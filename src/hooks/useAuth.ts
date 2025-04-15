'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export const useAuth = () => {
  const { data: session, status } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    // 세션이 있고, 사용자가 toris-dev인 경우에만 인증됨
    const isAuthed = !!session && session.user?.login === 'toris-dev';
    setIsAuthenticated(isAuthed);
    setLoading(false);
  }, [session, status]);

  const signin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signIn('github', { callbackUrl: '/' });
    } catch (err) {
      console.error('로그인 오류:', err);
      setError('로그인 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const signout = async () => {
    try {
      setLoading(true);
      await signOut({ callbackUrl: '/' });
    } catch (err) {
      console.error('로그아웃 오류:', err);
      setError('로그아웃 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // 인증이 필요한 페이지에서 인증 확인
  useEffect(() => {
    // 아직 로딩 중이면 처리하지 않음
    if (loading) return;

    // 인증이 필요한 페이지에서만 체크
    const isProtectedRoute = ['/dashboard', '/write'].some((route) =>
      window.location.pathname.startsWith(route)
    );

    // 인증이 필요한 경로이고 인증되지 않았으면 로그인 페이지로 리다이렉트
    if (isProtectedRoute && isAuthenticated === false) {
      router.push('/signin');
    }
  }, [isAuthenticated, loading, router]);

  return {
    isAuthenticated,
    loading,
    error,
    signin,
    signout,
    session
  };
};
