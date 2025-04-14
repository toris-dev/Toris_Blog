import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('github_token')?.value;
    const userCookie = cookieStore.get('github_user')?.value;

    if (!token || !userCookie) {
      return NextResponse.json({ loggedIn: false });
    }

    // 사용자 정보 파싱
    let user;
    try {
      user = JSON.parse(userCookie);
    } catch (e) {
      console.error('사용자 쿠키 파싱 오류:', e);
      return NextResponse.json({ loggedIn: false });
    }

    // 토큰 유효성 검사 (선택적)
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Toris-Blog'
        }
      });

      if (!response.ok) {
        throw new Error('토큰이 유효하지 않습니다.');
      }
    } catch (error) {
      console.error('GitHub 토큰 검증 오류:', error);
      // 토큰이 유효하지 않으면 쿠키 삭제
      cookieStore.delete('github_token');
      cookieStore.delete('github_user');
      return NextResponse.json({ loggedIn: false });
    }

    return NextResponse.json({ loggedIn: true, user });
  } catch (error) {
    console.error('GitHub 상태 확인 오류:', error);
    return NextResponse.json(
      { loggedIn: false, error: '상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
