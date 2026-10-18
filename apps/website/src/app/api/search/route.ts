import { NextResponse } from 'next/server';
import { getProducts, toProduct } from '@/lib/nestjs';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  if (!q.trim()) {
    return NextResponse.json({ ok: true, data: { items: [], total: 0 } });
  }
  try {
    const page = await getProducts({ q, pageSize: 10 });
    const items = page.items.map((p) => toProduct(p));
    return NextResponse.json({ ok: true, data: { items, total: page.total } });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'API error' },
      { status: 502 },
    );
  }
}
