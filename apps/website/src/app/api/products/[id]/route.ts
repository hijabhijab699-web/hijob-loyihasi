import { NextResponse } from 'next/server';
import { getProduct, getProducts, toProduct } from '@/lib/nestjs';
import { listReviews } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const raw = await getProduct(id);
    const product = toProduct(raw);
    const related = await getProducts({
      category: product.category,
      pageSize: 5,
    });
    const relatedList = related.items
      .filter((p) => p.id !== raw.id)
      .map((p) => toProduct(p))
      .slice(0, 4);
    const reviews = await listReviews(product.id);
    return NextResponse.json({
      ok: true,
      data: { product, reviews, related: relatedList },
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : 'Mahsulot topilmadi',
      },
      { status: 404 },
    );
  }
}
