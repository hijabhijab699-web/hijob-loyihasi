import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, Length } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, CurrentUserInfo } from '../auth/current-user.decorator';
import { ChatsService } from './chats.service';
import { ChatMessageKind } from '@prisma/client';

class SendMessageDto {
  @IsOptional()
  @IsEnum(['text', 'product', 'payment_link', 'receipt'])
  kind?: ChatMessageKind;

  @IsString()
  @Length(1, 4000)
  body!: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

@ApiTags('chats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chats: ChatsService) {}

  @Get()
  listMine(@CurrentUser() user: CurrentUserInfo) {
    return this.chats.listMyChats(user.id);
  }

  @Get('unread')
  unread(@CurrentUser() user: CurrentUserInfo) {
    return this.chats.totalUnread(user.id);
  }

  @Post('open/:sellerId')
  open(
    @CurrentUser() user: CurrentUserInfo,
    @Param('sellerId', new ParseUUIDPipe()) sellerId: string,
  ) {
    return this.chats.openChat(user.id, sellerId);
  }

  @Get(':id/messages')
  messages(
    @CurrentUser() user: CurrentUserInfo,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.chats.getMessages(user.id, id);
  }

  @Post(':id/messages')
  send(
    @CurrentUser() user: CurrentUserInfo,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chats.sendMessage(user.id, id, dto);
  }
}
