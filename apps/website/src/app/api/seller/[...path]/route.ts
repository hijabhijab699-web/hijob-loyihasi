import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/nestjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Catch-all proxy for the seller API. The site hits /api/seller/<path>
// from the browser; this route forwards the request to /seller/<path>
// on the Nest API with the caller's Bearer token. Keeps the API base
// URL + CORS concerns server-side and matches the pattern used by the
// buyer-orders proxy at ../me/orders/route.ts.
async function forward(req: NextRequest, path: string[]) {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const search = req.nextUrl.searchParams.toString();
  const url = `${API_URL}/seller/${path.join('/')}${search ? `?${search}` : ''}`;

  const init: RequestInit = {
    method: req.method,
    headers: {
      Authorization: auth,
      ...(req.headers.get('content-type')
        ? { 'Content-Type': req.headers.get('content-type')! }
        : {}),
    },
    cache: 'no-store',
  };
  if (!['GET', 'HEAD'].includes(req.method)) {
    init.body = await req.text();
  }

  try {
    const res = await fetch(url, init);
    const text = await res.text();
    let payload: unknown = text;
    try {
      payload = JSON.parse(text);
    } catch {
      /* non-JSON */
    }
    return NextResponse.json(payload, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'FETCH_FAILED' },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
