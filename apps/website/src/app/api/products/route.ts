import { NextResponse } from 'next/server';
import { getProducts, toProduct, type ProductsQuery } from '@/lib/nestjs';

export const runtime = 'nodejs';

function num(v: string | null): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsRaw = searchParams.get('ids');
  const ids = idsRaw
    ? idsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  const q: ProductsQuery = {
    category: searchParams.get('category') ?? undefined,
    q: searchParams.get('q') ?? undefined,
    color: searchParams.get('colors') ?? undefined,
    size: searchParams.get('sizes') ?? undefined,
    minPrice: num(searchParams.get('minPrice')),
    maxPrice: num(searchParams.get('maxPrice')),
    sort: searchParams.get('sort') ?? undefined,
    page: num(searchParams.get('page')),
    pageSize: num(searchParams.get('pageSize')),
    ids,
  };

  try {
    const page = await getProducts(q);
    const items = page.items.map((p) => toProduct(p));
    const totalPages = Math.max(
      1,
      Math.ceil(page.total / Math.max(1, page.pageSize)),
    );
    return NextResponse.json({
      ok: true,
      data: {
        items,
        total: page.total,
        page: page.page,
        pageSize: page.pageSize,
        totalPages,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'API error' },
      { status: 502 },
    );
  }
}
