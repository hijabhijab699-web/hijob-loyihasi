/**
 * Server route that forwards the browser upload to the NestJS API.
 * We can't call the API directly from the client because the auth token
 * lives in an httpOnly cookie that only server routes can read.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.API_URL ?? 'http://localhost:4000/api/v1';
const ACCESS_COOKIE = 'n2431.access';

export async function POST(req: NextRequest) {
  const c = await cookies();
  const token = c.get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  // Forward the raw multipart body so we don't have to reconstruct it.
  const upstream = await fetch(`${API_BASE}/seller/uploads`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Pass through the boundary the browser generated.
      'Content-Type': req.headers.get('content-type') ?? 'multipart/form-data',
    },
    body: req.body,
    // @ts-expect-error duplex is required for streaming request bodies on Node 18+
    duplex: 'half',
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}
