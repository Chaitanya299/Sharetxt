import { NextRequest, NextResponse } from 'next/server';
import { createPaste, effectiveNow, baseUrl } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Request body must be valid JSON');
  }
  if (typeof body !== 'object' || body === null) {
    return badRequest('Request body must be a JSON object');
  }

  const { content, ttl_seconds, max_views } = body as Record<string, unknown>;

  if (typeof content !== 'string' || content.length === 0) {
    return badRequest('content is required and must be a non-empty string');
  }

  let ttl: number | null = null;
  if (ttl_seconds !== undefined && ttl_seconds !== null) {
    if (!Number.isInteger(ttl_seconds) || (ttl_seconds as number) < 1) {
      return badRequest('ttl_seconds must be an integer >= 1');
    }
    ttl = ttl_seconds as number;
  }

  let maxViews: number | null = null;
  if (max_views !== undefined && max_views !== null) {
    if (!Number.isInteger(max_views) || (max_views as number) < 1) {
      return badRequest('max_views must be an integer >= 1');
    }
    maxViews = max_views as number;
  }

  const id = await createPaste(content, ttl, maxViews, effectiveNow(req.headers));
  const url = `${baseUrl(req.headers)}/p/${id}`;
  return NextResponse.json({ id, url }, { status: 201 });
}
