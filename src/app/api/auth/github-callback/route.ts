import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const redirect = url.searchParams.get('redirect') || '/';

  console.log(`GitHub callback: Processing request from ${request.url}`);
  console.log(
    `GitHub callback: Received code=${code ? 'yes' : 'no'}, redirect=${redirect}`
  );
  console.log(
    `GitHub callback: GITHUB_CLIENT_ID=${process.env.GITHUB_CLIENT_ID ? 'set' : 'not set'}`
  );
  console.log(
    `GitHub callback: GITHUB_CLIENT_SECRET=${process.env.GITHUB_CLIENT_SECRET ? 'set' : 'not set'}`
  );

  if (!code) {
    console.error('GitHub callback: No code provided');
    return NextResponse.redirect(
      new URL(`${redirect}?error=no_code&time=${Date.now()}`, request.url)
    );
  }

  try {
    console.log('GitHub callback: Received code, fetching token');

    // GitHub에서 액세스 토큰 가져오기
    const tokenUrl = 'https://github.com/login/oauth/access_token';
    console.log(`GitHub callback: Requesting token from ${tokenUrl}`);

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });

    console.log(
      `GitHub callback: Token response status: ${tokenResponse.status}`
    );
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error('GitHub token error:', tokenData);
      return NextResponse.redirect(
        new URL(
          `${redirect}?error=token_error&message=${encodeURIComponent(tokenData.error_description || 'Unknown error')}&time=${Date.now()}`,
          request.url
        )
      );
    }

    const accessToken = tokenData.access_token;
    console.log('GitHub callback: Token received successfully');

    // 사용자 정보 가져오기
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.error('GitHub user data error:', userData);
      return NextResponse.redirect(
        new URL(
          `${redirect}?error=user_data_error&time=${Date.now()}`,
          request.url
        )
      );
    }

    console.log(
      'GitHub callback: User data fetched successfully',
      userData.login
    );

    // 세션 쿠키 설정 (자동 만료 시간 설정)
    const expiresDate = new Date();
    expiresDate.setHours(expiresDate.getHours() + 24); // 24시간 유효

    // 실제 리다이렉트 URL 생성 (절대 URL로 변환)
    let redirectUrl = redirect;
    if (!redirectUrl.startsWith('http')) {
      // 상대 URL을 절대 URL로 변환
      redirectUrl = new URL(redirect, request.url).toString();
    }

    console.log(`GitHub callback: Will redirect to ${redirectUrl}`);

    // 사용자 정보 쿠키에 저장
    const response = NextResponse.redirect(
      new URL(
        `${redirectUrl}?auth_success=true&user=${encodeURIComponent(userData.login)}&time=${Date.now()}`
      )
    );

    response.cookies.set({
      name: 'github_user',
      value: JSON.stringify({
        id: userData.id,
        login: userData.login,
        avatar_url: userData.avatar_url,
        name: userData.name || userData.login
      }),
      expires: expiresDate,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    response.cookies.set({
      name: 'github_token',
      value: accessToken,
      expires: expiresDate,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    console.log('GitHub callback: Redirecting to', redirectUrl);
    return response;
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return NextResponse.redirect(
      new URL(
        `${redirect}?error=server_error&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}&time=${Date.now()}`,
        request.url
      )
    );
  }
}
