import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/nestjs';

// Catch-all proxy for the rest of /tryon/* — my-renders, prepare, reset,
// enqueue-product. More specific routes (faceswap, preview/:id/image) win
// over this one. Mirrors the mobile app's calls 1:1 with Bearer forwarding
// so the Primerka page behaves exactly like the Primerka tab.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function forward(req: NextRequest, path: string[]) {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const search = req.nextUrl.searchParams.toString();
  const url = `${API_URL}/tryon/${path.join('/')}${search ? `?${search}` : ''}`;

  const init: RequestInit = {
    method: req.method,
    headers: {
      Authorization: auth,
      'Content-Type': req.headers.get('content-type') ?? 'application/json',
    },
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  const upstream = await fetch(url, init);
  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
