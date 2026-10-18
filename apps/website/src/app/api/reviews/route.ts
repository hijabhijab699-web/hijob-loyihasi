import { NextResponse } from 'next/server';
import { addReview, listReviews, makeId } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId') ?? undefined;
  const items = await listReviews(productId);
  return NextResponse.json({ ok: true, data: items });
}

export async function POST(request: Request) {
  let body: {
    productId?: string;
    name?: string;
    rating?: number;
    text?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Noto'g'ri so'rov" },
      { status: 400 },
    );
  }

  const name = (body.name ?? '').trim();
  const text = (body.text ?? '').trim();
  const rating = Number(body.rating);

  if (name.length < 2)
    return NextResponse.json(
      { ok: false, error: "Ismni kiriting" },
      { status: 400 },
    );
  if (!Number.isFinite(rating) || rating < 1 || rating > 5)
    return NextResponse.json(
      { ok: false, error: "Reyting 1 dan 5 gacha bo'lishi kerak" },
      { status: 400 },
    );
  if (text.length < 5)
    return NextResponse.json(
      { ok: false, error: "Fikringizni yozing" },
      { status: 400 },
    );

  const review = {
    id: makeId('rv_'),
    productId: body.productId ? String(body.productId) : undefined,
    name,
    rating: Math.round(rating),
    text,
    createdAt: new Date().toISOString(),
  };
  await addReview(review);
  return NextResponse.json({ ok: true, data: review });
}
