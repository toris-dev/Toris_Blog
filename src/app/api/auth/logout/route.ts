import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });

    // GitHub 관련 쿠키 삭제
    const cookieStore = cookies();

    // 쿠키가 존재하는 경우에만 삭제
    if (cookieStore.has('github_user')) {
      response.cookies.set({
        name: 'github_user',
        value: '',
        expires: new Date(0),
        path: '/'
      });
    }

    if (cookieStore.has('github_token')) {
      response.cookies.set({
        name: 'github_token',
        value: '',
        expires: new Date(0),
        path: '/'
      });
    }

    return response;
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
