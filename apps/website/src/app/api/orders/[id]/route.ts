import { NextResponse } from 'next/server';
import { listOrders } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orders = await listOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return NextResponse.json(
      { ok: false, error: "Buyurtma topilmadi" },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, data: order });
}
