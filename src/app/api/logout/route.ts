import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieStore = await cookies();

    // 관리자 인증 쿠키 삭제
    cookieStore.delete('authed');
    cookieStore.delete('admin_token');

    // GitHub 관련 쿠키 삭제
    cookieStore.delete('github_user');
    cookieStore.delete('github_token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('로그아웃 에러:', error);
    return NextResponse.json({ error: '로그아웃 실패' }, { status: 500 });
  }
}
