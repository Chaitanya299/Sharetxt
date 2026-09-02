import { NextRequest, NextResponse } from 'next/server';
import { consumeView, effectiveNow } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Each successful fetch counts as a view. Unavailable (missing/expired/limit) → 404 JSON.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const paste = await consumeView(params.id, effectiveNow(req.headers));
  if (!paste) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json(paste);
}
