import { NextResponse } from 'next/server';
import { API_URL } from '@/lib/nestjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Proxy for the signed-in buyer's order history on the Nest API. The
// browser passes its access token in Authorization: Bearer <token>; we
// forward it unchanged so the Nest JWT guard can read it. We never
// store the token on the server — the client (AuthProvider) owns it.
export async function GET(request: Request) {
  const auth = request.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'GET',
      headers: { Authorization: auth },
      cache: 'no-store',
    });
    const text = await res.text();
    let payload: unknown = text;
    try {
      payload = JSON.parse(text);
    } catch {
      /* text */
    }
    return NextResponse.json(payload, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'FETCH_FAILED' },
      { status: 502 },
    );
  }
}
