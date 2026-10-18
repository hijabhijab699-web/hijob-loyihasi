import { NextResponse } from 'next/server';
import { applyPromo } from '@/lib/promo';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: { code?: string; subtotal?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Noto'g'ri so'rov" },
      { status: 400 },
    );
  }
  const subtotal = Number(body.subtotal);
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return NextResponse.json(
      { ok: false, error: "Savat bo'sh" },
      { status: 400 },
    );
  }
  const res = applyPromo(body.code ?? '', subtotal);
  if ('error' in res) {
    return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, data: res });
}
