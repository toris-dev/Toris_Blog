import { isAuthenticated } from '@/utils/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    authenticated: isAuthenticated()
  });
}
