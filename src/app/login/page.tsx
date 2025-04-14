'use client';

import { cn } from '@/utils/style';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<
    'checking' | 'authenticated' | 'unauthenticated'
  >('checking');
  const router = useRouter();

  // 로그인 상태 확인
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        setLoading(true);
        const response = await fetch('/api/auth/github-status');
        const data = await response.json();

        if (data.loggedIn && data.user) {
          // toris-dev 계정만 허용
          if (data.user.login === 'toris-dev') {
            setAuthStatus('authenticated');
            // 이미 로그인되어 있으면 대시보드로 리다이렉트
            router.push('/dashboard');
          } else {
            // 권한 없는 GitHub 계정
            await fetch('/api/auth/logout', { method: 'POST' });
            setError(
              '관리자 권한이 없는 GitHub 계정입니다. toris-dev 계정으로 로그인해주세요.'
            );
            setAuthStatus('unauthenticated');
          }
        } else {
          setAuthStatus('unauthenticated');
        }
      } catch (err) {
        console.error('로그인 상태 확인 실패:', err);
        setAuthStatus('unauthenticated');
      } finally {
        setLoading(false);
      }
    }

    // URL에 auth_success 파라미터가 있으면 확인
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth_success');
    const authError = urlParams.get('error');
    const errorMsg = urlParams.get('message');

    if (authError) {
      setError(
        `로그인 중 오류가 발생했습니다: ${decodeURIComponent(errorMsg || authError)}`
      );
      // URL 정리
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (authSuccess) {
      // URL 정리하고 상태 재확인
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    checkAuthStatus();
  }, [router]);

  // GitHub 로그인 처리
  const handleGitHubLogin = () => {
    setLoading(true);

    // 현재 URL을 리다이렉트 URL로 설정
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/github-callback?redirect=${encodeURIComponent('/login')}`;

    // GitHub OAuth 로그인 URL로 리다이렉트
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="container mx-auto my-10 max-w-md">
      <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
          관리자 로그인
        </h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        {authStatus === 'checking' ? (
          <div className="flex justify-center p-4">
            <div className="size-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent dark:border-blue-400"></div>
          </div>
        ) : authStatus === 'authenticated' ? (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-center dark:bg-green-900/20">
            <p className="font-medium text-green-800 dark:text-green-200">
              이미 로그인되어 있습니다.
            </p>
            <p className="mt-2 text-green-700 dark:text-green-300">
              잠시 후 대시보드로 이동합니다...
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              관리자 로그인을 위해 GitHub 계정으로 로그인해주세요.
              <br />
              <strong className="text-black dark:text-white">
                toris-dev
              </strong>{' '}
              계정만 로그인할 수 있습니다.
            </p>

            <button
              onClick={handleGitHubLogin}
              disabled={loading}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-md p-2 text-white',
                'bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600',
                'disabled:cursor-not-allowed disabled:bg-gray-500 dark:disabled:bg-gray-600'
              )}
            >
              {loading ? (
                <>
                  <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>로그인 중...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="white"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span>GitHub으로 로그인</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
