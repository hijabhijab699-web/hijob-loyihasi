import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { listContacts, listNewsletter, listOrders } from '@/lib/db';

export const runtime = 'nodejs';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'hijob2026';
const COOKIE_NAME = 'hijob_admin';
const COOKIE_VALUE = 'ok';

async function isAuthed() {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === COOKIE_VALUE;
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
  const [orders, newsletter, contacts] = await Promise.all([
    listOrders(),
    listNewsletter(),
    listContacts(),
  ]);
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  return NextResponse.json({
    ok: true,
    data: {
      stats: {
        orders: orders.length,
        subscribers: newsletter.length,
        messages: contacts.length,
        revenue,
      },
      orders,
      newsletter,
      contacts,
    },
  });
}

export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Noto'g'ri so'rov" },
      { status: 400 },
    );
  }
  if ((body.password ?? '') !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { ok: false, error: "Parol noto'g'ri" },
      { status: 401 },
    );
  }
  const res = NextResponse.json({ ok: true, data: { authed: true } });
  res.cookies.set(COOKIE_NAME, COOKIE_VALUE, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
