/**
 * Server routes that forward the browser's dress-mannequin requests to the
 * NestJS API. We can't call `/seller/products/:id/dress-mannequin` directly
 * from the client component because the auth token lives in an httpOnly
 * cookie — only server routes can read it and set the Bearer header.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.API_URL ?? 'http://localhost:4000/api/v1';
const ACCESS_COOKIE = 'n2431.access';

async function bearer() {
  const c = await cookies();
  return c.get(ACCESS_COOKIE)?.value;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ productId: string }> }) {
  const { productId } = await ctx.params;
  const token = await bearer();
  if (!token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const upstream = await fetch(`${API_BASE}/seller/products/${productId}/dress-mannequin`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ productId: string }> }) {
  const { productId } = await ctx.params;
  const token = await bearer();
  if (!token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const body = await req.text();
  const upstream = await fetch(`${API_BASE}/seller/products/${productId}/dress-mannequin`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}
