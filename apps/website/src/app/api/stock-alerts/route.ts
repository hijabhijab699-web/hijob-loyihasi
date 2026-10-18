import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getProduct } from '@/lib/nestjs';

export const runtime = 'nodejs';

const DATA_FILE = path.join(process.cwd(), 'data', 'stock-alerts.json');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Alert = { productId: string; email: string; createdAt: string };

async function readAll(): Promise<Alert[]> {
  try {
    const txt = await fs.readFile(DATA_FILE, 'utf8');
    const arr = JSON.parse(txt);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function writeAll(data: Alert[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export async function POST(request: Request) {
  let body: { productId?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Noto'g'ri so'rov" },
      { status: 400 },
    );
  }
  const productId = String(body.productId ?? '').trim();
  const email = (body.email ?? '').trim().toLowerCase();
  if (!productId) {
    return NextResponse.json(
      { ok: false, error: 'Mahsulot ID kerak' },
      { status: 400 },
    );
  }
  try {
    await getProduct(productId);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Mahsulot topilmadi' },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Email manzil noto'g'ri" },
      { status: 400 },
    );
  }

  const items = await readAll();
  if (items.some((e) => e.productId === productId && e.email === email)) {
    return NextResponse.json({
      ok: true,
      data: { message: "Siz allaqachon ro'yxatdasiz. Qaytganda xabar beramiz." },
    });
  }
  items.unshift({ productId, email, createdAt: new Date().toISOString() });
  await writeAll(items);
  return NextResponse.json({
    ok: true,
    data: { message: "Qabul qilindi. Mahsulot qaytganda email yuboramiz." },
  });
}
