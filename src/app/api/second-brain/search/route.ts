import { getSecondBrainStats, searchSecondBrain } from '@/utils/secondBrain';
import { isSecondBrainAuthorized } from '@/utils/secondBrainAuth';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseLimit(value: string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 8;
}

export async function GET(request: NextRequest) {
  if (!isSecondBrainAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return NextResponse.json({
      ...getSecondBrainStats(),
      usage: 'GET /api/second-brain/search?q=검색어'
    });
  }

  return NextResponse.json({
    query,
    results: searchSecondBrain(query, parseLimit(searchParams.get('limit')))
  });
}

export async function POST(request: NextRequest) {
  if (!isSecondBrainAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    query?: string;
    limit?: number;
  } | null;
  const query = body?.query?.trim();

  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  return NextResponse.json({
    query,
    results: searchSecondBrain(query, body?.limit)
  });
}
