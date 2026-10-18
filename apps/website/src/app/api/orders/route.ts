import { NextResponse } from 'next/server';
import { addOrder, makeId } from '@/lib/db';
import { getProduct, toProduct } from '@/lib/nestjs';
import type { CartItem, Order } from '@/lib/types';

export const runtime = 'nodejs';

const PHONE_RE = /^\+?\d[\d\s\-()]{7,}$/;
const SHIPPING_FEE = 25000;
const FREE_SHIPPING_FROM = 500000;

export async function POST(request: Request) {
  let body: Partial<Order> & { items?: CartItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Noto'g'ri so'rov" },
      { status: 400 },
    );
  }

  const customer = body.customer ?? ({} as Order['customer']);
  const items = Array.isArray(body.items) ? body.items : [];

  if (!customer.name || customer.name.trim().length < 2) {
    return NextResponse.json(
      { ok: false, error: "Ismni to'liq kiriting" },
      { status: 400 },
    );
  }
  if (!PHONE_RE.test(customer.phone ?? '')) {
    return NextResponse.json(
      { ok: false, error: "Telefon raqam noto'g'ri" },
      { status: 400 },
    );
  }
  if (!customer.address || customer.address.trim().length < 5) {
    return NextResponse.json(
      { ok: false, error: "Yetkazib berish manzilini kiriting" },
      { status: 400 },
    );
  }
  if (!customer.city || customer.city.trim().length < 2) {
    return NextResponse.json(
      { ok: false, error: "Shaharni tanlang" },
      { status: 400 },
    );
  }
  if (items.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Savat bo'sh" },
      { status: 400 },
    );
  }

  const normalized: CartItem[] = [];
  let subtotal = 0;

  for (const raw of items) {
    try {
      const nestProduct = await getProduct(String(raw.productId));
      const product = toProduct(nestProduct);
      const qty = Math.max(1, Math.min(50, Math.floor(raw.quantity || 1)));
      normalized.push({
        id: raw.id || makeId('ci_'),
        productId: product.id,
        variantId: raw.variantId,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: qty,
        color: raw.color,
        size: raw.size,
      });
      subtotal += product.price * qty;
    } catch {
      return NextResponse.json(
        { ok: false, error: `Mahsulot topilmadi: ${raw.productId}` },
        { status: 400 },
      );
    }
  }

  const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  const paymentMethod = (body.paymentMethod ?? 'cash') as Order['paymentMethod'];
  if (!['cash', 'card', 'click', 'payme'].includes(paymentMethod)) {
    return NextResponse.json(
      { ok: false, error: "To'lov usuli noto'g'ri" },
      { status: 400 },
    );
  }

  const order: Order = {
    id: makeId('ord_'),
    customer: {
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      email: customer.email?.trim() || undefined,
      address: customer.address.trim(),
      city: customer.city.trim(),
      note: customer.note?.trim() || undefined,
    },
    items: normalized,
    subtotal,
    shipping,
    total,
    paymentMethod,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await addOrder(order);
  return NextResponse.json({ ok: true, data: order });
}
