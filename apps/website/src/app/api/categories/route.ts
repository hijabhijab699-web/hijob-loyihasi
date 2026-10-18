import { NextResponse } from 'next/server';
import { getHome, toCategory } from '@/lib/nestjs';

export const runtime = 'nodejs';

const COVERS: Record<string, string> = {
  scarves: '/images/category-ipak.webp',
  dresses: '/images/category-shoyi.webp',
  bags: '/images/category-pashmina.webp',
  accessories: '/images/category-shifon.webp',
};

export async function GET() {
  try {
    const home = await getHome();
    const data = home.categories.map((c) => {
      const base = toCategory(c);
      return {
        ...base,
        image: base.image || COVERS[c.id as string] || '/images/category-ipak.webp',
      };
    });
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'API error' },
      { status: 502 },
    );
  }
}
