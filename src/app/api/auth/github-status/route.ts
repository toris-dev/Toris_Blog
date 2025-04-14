import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('github_user');
    const tokenCookie = cookieStore.get('github_token');

    if (!userCookie || !tokenCookie) {
      console.log('GitHub status check: No cookies found');
      return NextResponse.json({ loggedIn: false });
    }

    try {
      // 사용자 정보 파싱
      const user = JSON.parse(userCookie.value);
      console.log(`GitHub status check: Found user cookie for ${user.login}`);

      // 토큰 유효성 체크 (간단한 GitHub API 호출)
      const apiResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenCookie.value}`
        }
      });

      if (!apiResponse.ok) {
        console.log('GitHub status check: Invalid token');
        // 토큰이 유효하지 않음, 쿠키 삭제
        return NextResponse.json(
          { loggedIn: false, error: 'Invalid token' },
          { status: 401 }
        );
      }

      console.log(`GitHub status check: User ${user.login} is logged in`);
      return NextResponse.json({
        loggedIn: true,
        user: {
          id: user.id,
          login: user.login,
          name: user.name,
          avatar_url: user.avatar_url
        }
      });
    } catch (error) {
      console.error('Error parsing github_user cookie:', error);
      return NextResponse.json({ loggedIn: false, error: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Error checking GitHub login status:', error);
    return NextResponse.json(
      { loggedIn: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
