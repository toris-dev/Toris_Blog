'use client';

import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/style';
import { useEffect, useState } from 'react';

export default function SigninPage() {
  const { isAuthenticated, loading, error: authError, signin } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // URL에서 에러 파라미터 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const errorMsg = urlParams.get('message');

    if (errorParam) {
      setError(
        `로그인 중 오류가 발생했습니다: ${decodeURIComponent(errorMsg || errorParam)}`
      );
      // URL 정리
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 인증 훅에서 발생한 에러가 있으면 표시
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // GitHub 로그인 처리
  const handleGitHubSignin = () => {
    signin();
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

        {loading ? (
          <div className="flex flex-col items-center justify-center p-4">
            <div className="size-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent dark:border-blue-400"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              로그인 상태 확인 중...
            </p>
          </div>
        ) : isAuthenticated ? (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-center dark:bg-green-900/20">
            <p className="font-medium text-green-800 dark:text-green-200">
              이미 로그인되어 있습니다.
            </p>
            <p className="mt-2 text-green-700 dark:text-green-300">
              잠시 후 홈 페이지로 이동합니다...
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
              onClick={handleGitHubSignin}
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
