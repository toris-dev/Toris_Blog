import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // GitHub 쿠키 확인
    const cookieStore = cookies();
    const userCookie = cookieStore.get('github_user');
    const tokenCookie = cookieStore.get('github_token');

    if (!userCookie || !tokenCookie) {
      return NextResponse.json(
        { error: 'GitHub 로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 사용자 정보 파싱
    let user;
    try {
      user = JSON.parse(userCookie.value);
    } catch (error) {
      console.error('GitHub 쿠키 파싱 에러:', error);
      return NextResponse.json(
        { error: '로그인 세션이 손상되었습니다. 다시 로그인해주세요.' },
        { status: 401 }
      );
    }

    // toris-dev 계정인지 확인
    if (user.login !== 'toris-dev') {
      return NextResponse.json(
        { error: '관리자 권한이 없는 GitHub 계정입니다' },
        { status: 403 }
      );
    }

    // 토큰 유효성 체크
    const apiResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenCookie.value}`
      }
    });

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: 'GitHub 인증 토큰이 만료되었습니다. 다시 로그인해주세요.' },
        { status: 401 }
      );
    }

    // 관리자 인증 쿠키 설정
    cookies().set('authed', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 1 day
    });

    // 관리자 토큰 설정 (추가 보안용)
    cookies().set(
      'admin_token',
      process.env.ADMIN_TOKEN || 'admin_secret_token',
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 1 day
      }
    );

    return NextResponse.json({
      success: true,
      user: {
        login: user.login,
        name: user.name || user.login,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
