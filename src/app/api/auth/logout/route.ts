import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieStore = await cookies();

    // GitHub 관련 쿠키 삭제
    cookieStore.delete('github_token');
    cookieStore.delete('github_user');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('로그아웃 오류:', error);
    return NextResponse.json(
      { success: false, message: '로그아웃 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
