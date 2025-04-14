// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextRequest, NextResponse } from 'next/server';

// Redirect all post API calls to markdown
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/api/markdown', request.url));
}

export async function POST(request: NextRequest) {
  return NextResponse.redirect(new URL('/api/markdown', request.url));
}

// Delete API는 지금은 필요없음
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { message: 'This endpoint is no longer available' },
    { status: 410 }
  );
}
