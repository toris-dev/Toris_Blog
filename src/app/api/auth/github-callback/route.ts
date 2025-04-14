import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // URL에서 코드와 리다이렉트 경로 추출
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const redirectPath = searchParams.get('redirect') || '/guestbook';

  if (!code) {
    // 코드가 없을 경우 오류 페이지로 리다이렉트
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=no_code&message=${encodeURIComponent('GitHub 인증 코드가 없습니다.')}`
    );
  }

  try {
    // 액세스 토큰 요청
    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code
        })
      }
    );

    if (!tokenResponse.ok) {
      throw new Error('액세스 토큰 요청 실패');
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || '액세스 토큰 요청 실패');
    }

    const { access_token } = tokenData;

    // 사용자 정보 요청
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${access_token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Toris-Blog'
      }
    });

    if (!userResponse.ok) {
      throw new Error('사용자 정보 요청 실패');
    }

    const userData = await userResponse.json();

    // 쿠키에 토큰 및 사용자 정보 저장
    const cookieStore = cookies();
    cookieStore.set('github_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/'
    });

    cookieStore.set(
      'github_user',
      JSON.stringify({
        id: userData.id,
        login: userData.login,
        avatar_url: userData.avatar_url
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7일
        path: '/'
      }
    );

    // 성공 리다이렉트
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}${redirectPath}?auth_success=true`
    );
  } catch (error) {
    console.error('GitHub 인증 오류:', error);

    // 오류 리다이렉트
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=auth_failed&message=${encodeURIComponent('GitHub 인증에 실패했습니다.')}`
    );
  }
}
