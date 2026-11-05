import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/nestjs';

// Proxies the public one-off preview image stream from the Nest API
// (`GET /tryon/preview/:sessionId/image`). No auth — the session id itself
// is the capability. Served through the Next origin so the browser skips
// a cross-origin round-trip and the API base stays off the client.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(sessionId)) {
    return NextResponse.json({ ok: false, error: 'BAD_SESSION_ID' }, { status: 400 });
  }
  const upstream = await fetch(`${API_URL}/tryon/preview/${sessionId}/image`, {
    cache: 'no-store',
  });
  if (!upstream.ok) {
    return NextResponse.json(
      { ok: false, error: upstream.status === 404 ? 'IMAGE_EXPIRED' : 'FETCH_FAILED' },
      { status: upstream.status },
    );
  }
  const buf = await upstream.arrayBuffer();
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'private, max-age=300',
    },
  });
}
