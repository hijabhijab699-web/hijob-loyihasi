import { NextResponse } from 'next/server';
import { addContact, makeId } from '@/lib/db';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: Partial<{
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Noto'g'ri so'rov" },
      { status: 400 },
    );
  }

  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').trim();
  const phone = (body.phone ?? '').trim();
  const subject = (body.subject ?? '').trim();
  const message = (body.message ?? '').trim();

  if (name.length < 2)
    return NextResponse.json(
      { ok: false, error: "Ismni to'liq kiriting" },
      { status: 400 },
    );
  if (!EMAIL_RE.test(email))
    return NextResponse.json(
      { ok: false, error: "Email noto'g'ri" },
      { status: 400 },
    );
  if (message.length < 5)
    return NextResponse.json(
      { ok: false, error: "Xabar juda qisqa" },
      { status: 400 },
    );

  await addContact({
    id: makeId('ct_'),
    name,
    email,
    phone: phone || undefined,
    subject: subject || 'Umumiy savol',
    message,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    data: { message: "Xabaringiz qabul qilindi. Tez orada javob beramiz." },
  });
}
