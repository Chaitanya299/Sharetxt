import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Always 200 + JSON; `ok` reflects whether we can reach the persistence layer.
export async function GET() {
  try {
    await getRedis().ping();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
