import { cookies } from 'next/headers';

interface GithubUser {
  id: number;
  login: string;
  avatar_url: string;
  name: string;
}

// 관리자 인증 확인 (서버 사이드)
export function isAuthenticated(): boolean {
  const cookieStore = cookies();

  // 기본 인증 확인
  const isAuthed = cookieStore.get('authed')?.value === 'true';

  // 관리자 토큰 확인 (추가 보안)
  const adminToken = cookieStore.get('admin_token');
  const isTokenValid =
    !!adminToken &&
    (process.env.ADMIN_TOKEN
      ? adminToken.value === process.env.ADMIN_TOKEN
      : adminToken.value === 'admin_secret_token');

  // GitHub 사용자 확인 (toris-dev만 허용)
  const githubUser = getGithubUser();
  const isValidGithubUser = !!githubUser && githubUser.login === 'toris-dev';

  // 모든 조건이 만족되어야 함
  return !!isAuthed && isTokenValid && isValidGithubUser;
}

export function getGithubUser(): GithubUser | null {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('github_user');

    if (!userCookie) return null;

    return JSON.parse(userCookie.value);
  } catch (error) {
    console.error('Error parsing github_user cookie:', error);
    return null;
  }
}

export function getGithubToken(): string | null {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('github_token');

  return tokenCookie ? tokenCookie.value : null;
}

export function isGithubLoggedIn(): boolean {
  const user = getGithubUser();
  return !!user && !!getGithubToken();
}

// toris-dev 계정인지 확인
export function isTorisDevAccount(): boolean {
  const user = getGithubUser();
  return !!user && user.login === 'toris-dev';
}

// 기존 사용자/비밀번호 검증 (더 이상 사용하지 않음)
export const validateCredentials = (username: string, password: string) => {
  const envUsername = process.env.ADMIN_USERNAME;
  const envPassword = process.env.ADMIN_PASSWORD;

  if (!envUsername || !envPassword) {
    console.error('Admin credentials not set in environment variables');
    return false;
  }

  return username === envUsername && password === envPassword;
};
