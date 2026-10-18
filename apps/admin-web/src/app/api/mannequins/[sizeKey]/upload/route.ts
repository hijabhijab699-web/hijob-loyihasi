/**
 * Proxy for mannequin PNG uploads. The browser sends multipart here and we
 * forward it to Nest's /admin/mannequin-templates/:sizeKey/upload with the
 * admin JWT the browser cannot read (httpOnly cookie).
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.API_URL ?? 'http://localhost:4000/api/v1';
const ACCESS_COOKIE = 'n2431.access';

export async function POST(req: NextRequest, ctx: { params: Promise<{ sizeKey: string }> }) {
  const { sizeKey } = await ctx.params;
  const c = await cookies();
  const token = c.get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const upstream = await fetch(`${API_BASE}/admin/mannequin-templates/${sizeKey}/upload`, {
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
