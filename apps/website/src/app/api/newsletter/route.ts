import { NextResponse } from 'next/server';
import { addNewsletter } from '@/lib/db';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Noto'g'ri so'rov" },
      { status: 400 },
    );
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Email manzil noto'g'ri" },
      { status: 400 },
    );
  }

  const added = await addNewsletter({
    email,
    subscribedAt: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    data: {
      alreadySubscribed: !added,
      message: added
        ? "Obuna muvaffaqiyatli! Rahmat."
        : "Siz allaqachon obunachisiz.",
    },
  });
}
