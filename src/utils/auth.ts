import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';

interface GithubUser {
  id: number;
  login: string;
  avatar_url: string;
  name: string;
}

// Next-Auth 서버 세션 가져오기
export async function getServerAuthSession() {
  return await getServerSession(authOptions);
}

// 관리자 인증 확인 (서버 사이드)
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerAuthSession();

  // 세션이 있고, 사용자가 toris-dev인 경우에만 인증됨
  return !!session && session.user?.login === 'toris-dev';
}

// 기존 쿠키 기반 인증 함수들은 하위 호환성을 위해 유지
// 추후 제거할 예정

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
