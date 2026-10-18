/**
 * Server-side proxy for the dev AI "mark complete" button. Required because
 * the Nest `/admin/style-jobs/:id/ai-complete` endpoint needs an admin JWT,
 * and the admin JWT lives in an httpOnly cookie the browser cannot read.
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminAiComplete } from '@/lib/api';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (!body?.resultUrl) {
    return NextResponse.json({ error: 'resultUrl is required' }, { status: 400 });
  }
  try {
    const job = await adminAiComplete(id, body.resultUrl);
    return NextResponse.json(job);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 500 });
  }
}
