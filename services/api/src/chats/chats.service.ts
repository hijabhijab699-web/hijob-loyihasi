import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ChatMessageKind, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

interface SendMessageInput {
  kind?: ChatMessageKind;
  body: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class ChatsService {
  private readonly logger = new Logger(ChatsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  /** Create (if needed) and return the chat between a buyer and a seller. */
  async openChat(userId: string, sellerId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      include: { user: { select: { id: true, fullName: true, phone: true } } },
    });
    if (!seller) throw new NotFoundException('SELLER_NOT_FOUND');
    if (seller.userId === userId) {
      throw new BadRequestException('CANNOT_CHAT_WITH_SELF');
    }

    const chat = await this.prisma.chat.upsert({
      where: { buyerUserId_sellerId: { buyerUserId: userId, sellerId } },
      create: { buyerUserId: userId, sellerId },
      update: {},
    });
    return this.toDto(chat.id, userId);
  }

  async listMyChats(userId: string) {
    // Both sides of the conversation list from the same endpoint — we figure
    // out which side `userId` is on per row (buyer or seller user).
    const [buyer, seller] = await Promise.all([
      this.prisma.chat.findMany({
        where: { buyerUserId: userId },
        orderBy: { lastMessageAt: 'desc' },
        include: {
          seller: { select: { id: true, brandName: true, logoUrl: true, user: { select: { id: true, fullName: true } } } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.chat.findMany({
        where: { seller: { userId } },
        orderBy: { lastMessageAt: 'desc' },
        include: {
          buyer: { select: { id: true, fullName: true, phone: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
    ]);

    const buyerSide = buyer.map((c) => ({
      id: c.id,
      role: 'buyer' as const,
      partner: {
        id: c.seller.id,
        kind: 'seller' as const,
        name: c.seller.brandName,
        avatarUrl: c.seller.logoUrl,
      },
      unread: c.buyerUnread,
      lastMessage: c.messages[0]
        ? {
            kind: c.messages[0].kind,
            body: c.messages[0].body,
            createdAt: c.messages[0].createdAt.toISOString(),
            mine: c.messages[0].senderId === userId,
          }
        : null,
      lastMessageAt: c.lastMessageAt.toISOString(),
    }));

    const sellerSide = seller.map((c) => ({
      id: c.id,
      role: 'seller' as const,
      partner: {
        id: c.buyer.id,
        kind: 'buyer' as const,
        name: c.buyer.fullName ?? c.buyer.phone,
        avatarUrl: null,
      },
      unread: c.sellerUnread,
      lastMessage: c.messages[0]
        ? {
            kind: c.messages[0].kind,
            body: c.messages[0].body,
            createdAt: c.messages[0].createdAt.toISOString(),
            mine: c.messages[0].senderId === userId,
          }
        : null,
      lastMessageAt: c.lastMessageAt.toISOString(),
    }));

    return [...buyerSide, ...sellerSide].sort((a, b) =>
      a.lastMessageAt < b.lastMessageAt ? 1 : -1,
    );
  }

  async getMessages(userId: string, chatId: string) {
    const chat = await this.requireChatForUser(userId, chatId);

    // Side-effect: viewing marks every unread message addressed to this
    // side as read, and zeroes that side's unread counter so the inbox
    // badge updates on the next list fetch.
    const sideField = chat.buyerUserId === userId ? 'buyerUnread' : 'sellerUnread';
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.chatMessage.updateMany({
        where: { chatId, readAt: null, senderId: { not: userId } },
        data: { readAt: now },
      }),
      this.prisma.chat.update({
        where: { id: chatId },
        data: { [sideField]: 0 },
      }),
    ]);

    const messages = await this.prisma.chatMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
    return messages.map((m) => ({
      id: m.id,
      kind: m.kind,
      body: m.body,
      payload: (m.payload as Prisma.JsonValue) ?? null,
      senderId: m.senderId,
      mine: m.senderId === userId,
      readAt: m.readAt ? m.readAt.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async sendMessage(userId: string, chatId: string, input: SendMessageInput) {
    const chat = await this.requireChatForUser(userId, chatId);

    const body = input.body?.trim();
    if (!body) throw new BadRequestException('EMPTY_BODY');
    if (body.length > 4000) throw new BadRequestException('BODY_TOO_LONG');

    const kind: ChatMessageKind = input.kind ?? 'text';
    const sellerUserId = (
      await this.prisma.seller.findUnique({
        where: { id: chat.sellerId },
        select: { userId: true },
      })
    )?.userId;

    const [message] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: {
          chatId,
          senderId: userId,
          kind,
          body,
          payload: input.payload as Prisma.InputJsonValue | undefined,
        },
      }),
      this.prisma.chat.update({
        where: { id: chatId },
        data: {
          lastMessageAt: new Date(),
          // Increment the OTHER side's unread so their inbox badge updates.
          ...(chat.buyerUserId === userId
            ? { sellerUnread: { increment: 1 } }
            : { buyerUnread: { increment: 1 } }),
        },
      }),
    ]);

    // Push to the other side — if the buyer sent it, notify the seller
    // user; if the seller sent it, notify the buyer.
    const recipientUserId =
      chat.buyerUserId === userId ? sellerUserId : chat.buyerUserId;
    if (recipientUserId) {
      void this.push
        .sendToUser(recipientUserId, 'Yangi xabar', body.slice(0, 120), {
          chatId,
          kind: 'chat_message',
        })
        .catch((err) =>
          this.logger.warn(
            `chat push failed to ${recipientUserId}: ${(err as Error).message}`,
          ),
        );
    }

    return {
      id: message.id,
      kind: message.kind,
      body: message.body,
      payload: message.payload,
      senderId: message.senderId,
      mine: true,
      createdAt: message.createdAt.toISOString(),
    };
  }

  async totalUnread(userId: string) {
    const [asBuyer, asSeller] = await Promise.all([
      this.prisma.chat.aggregate({
        where: { buyerUserId: userId },
        _sum: { buyerUnread: true },
      }),
      this.prisma.chat.aggregate({
        where: { seller: { userId } },
        _sum: { sellerUnread: true },
      }),
    ]);
    return {
      unread:
        (asBuyer._sum.buyerUnread ?? 0) + (asSeller._sum.sellerUnread ?? 0),
    };
  }

  private async requireChatForUser(userId: string, chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { seller: { select: { userId: true } } },
    });
    if (!chat) throw new NotFoundException('CHAT_NOT_FOUND');
    const participating =
      chat.buyerUserId === userId || chat.seller.userId === userId;
    if (!participating) throw new ForbiddenException('NOT_YOUR_CHAT');
    return chat;
  }

  private async toDto(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        seller: {
          select: {
            id: true,
            brandName: true,
            logoUrl: true,
            user: { select: { id: true, fullName: true, phone: true } },
          },
        },
        buyer: { select: { id: true, fullName: true, phone: true } },
      },
    });
    if (!chat) throw new NotFoundException('CHAT_NOT_FOUND');
    const amSeller = chat.seller.user.id === userId;
    return {
      id: chat.id,
      role: amSeller ? ('seller' as const) : ('buyer' as const),
      partner: amSeller
        ? {
            id: chat.buyer.id,
            kind: 'buyer' as const,
            name: chat.buyer.fullName ?? chat.buyer.phone,
            avatarUrl: null,
            phone: chat.buyer.phone,
          }
        : {
            id: chat.seller.id,
            kind: 'seller' as const,
            name: chat.seller.brandName,
            avatarUrl: chat.seller.logoUrl,
            phone: chat.seller.user.phone,
          },
    };
  }
}
