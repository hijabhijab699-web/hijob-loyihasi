import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/nestjs';

// Forwards the browser's multipart try-on request to the same Nest endpoint
// (`POST /tryon/faceswap`) the mobile app uses, so a shopper on the web gets
// the real AI face-swap render — not the overlay teaser the old modal showed.
// Requires the caller's Bearer token; the user must be signed in.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  let body: ArrayBuffer;
  try {
    body = await req.arrayBuffer();
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
  }

  const upstream = await fetch(`${API_URL}/tryon/faceswap`, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': req.headers.get('content-type') ?? 'application/octet-stream',
    },
    body,
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
