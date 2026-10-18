import { NextRequest, NextResponse } from 'next/server';
import { adminAiFail } from '@/lib/api';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    const job = await adminAiFail(id, body?.message ?? 'operator rejected');
    return NextResponse.json(job);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 500 });
  }
}
