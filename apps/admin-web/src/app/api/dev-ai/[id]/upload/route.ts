/**
 * Server-side proxy for the dev AI "upload result file" button. The browser
 * sends a multipart body here; we forward it to Nest's
 * /admin/style-jobs/:id/upload-result with the admin JWT the client itself
 * cannot read (httpOnly cookie).
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.API_URL ?? 'http://localhost:4000/api/v1';
const ACCESS_COOKIE = 'n2431.access';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const c = await cookies();
  const token = c.get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  // Pipe the multipart body straight through — Nest's FileInterceptor on
  // the other end extracts the "file" field.
  const upstream = await fetch(`${API_BASE}/admin/style-jobs/${id}/upload-result`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: req.body,
    // @ts-expect-error — Node fetch requires duplex: 'half' when streaming a request body.
    duplex: 'half',
  });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}
