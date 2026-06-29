import { askSecondBrain } from '@/utils/secondBrainChat';
import { isSecondBrainAuthorized } from '@/utils/secondBrainAuth';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isSecondBrainAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    message?: string;
  } | null;

  const message = body?.message?.trim();

  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const result = askSecondBrain(message);

  return NextResponse.json(result);
}
