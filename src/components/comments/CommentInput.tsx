'use client';

import { FC, useEffect, useRef, useState } from 'react';

type CommentInputProps = {
  postId: number | string;
};

const CommentInput: FC<CommentInputProps> = ({ postId }) => {
  const utterancesRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const scriptLoaded = useRef<boolean>(false);

  useEffect(() => {
    // 이미 스크립트가 로드되었으면 중복 실행 방지
    if (scriptLoaded.current) return;

    // 컨테이너가 없으면 실행 중단
    const utterancesContainer = utterancesRef.current;
    if (!utterancesContainer) return;

    // 모든 자식 요소 제거
    while (utterancesContainer.firstChild) {
      utterancesContainer.removeChild(utterancesContainer.firstChild);
    }

    try {
      // utterances 스크립트 생성
      const script = document.createElement('script');

      // 필수 속성 설정
      script.src = 'https://utteranc.es/client.js';
      script.setAttribute('repo', 'toris-dev/Toris_Blog');

      // issue-term 대신 issue-number 사용 (postId가 있을 경우)
      console.log('postId', postId);

      script.setAttribute('issue-term', '[새 글] ' + String(postId));

      script.setAttribute('label', 'blog-comment');
      script.setAttribute('theme', 'github-light');
      script.setAttribute('crossorigin', 'anonymous');
      script.async = true;

      // 에러 처리를 위한 이벤트 리스너 추가
      script.onerror = () => {
        setError('댓글을 불러오는데 실패했습니다. GitHub 연결을 확인해주세요.');
      };

      // DOM에 스크립트 추가하기 전에 이전 스크립트 제거
      const existingScript = utterancesContainer.querySelector(
        'script[src*="utteranc.es"]'
      );
      if (existingScript) {
        existingScript.remove();
      }

      // 컨테이너에 스크립트 추가
      utterancesContainer.appendChild(script);
      scriptLoaded.current = true;
    } catch (err) {
      console.error('Utterances 로드 오류:', err);
      setError('댓글 시스템을 초기화하는데 문제가 발생했습니다.');
    }

    // 다크모드 감지 및 테마 변경
    const updateTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      const utterancesFrame =
        document.querySelector<HTMLIFrameElement>('.utterances-frame');

      if (utterancesFrame && utterancesFrame.contentWindow) {
        try {
          const message = {
            type: 'set-theme',
            theme: isDarkMode ? 'github-dark' : 'github-light'
          };
          utterancesFrame.contentWindow.postMessage(
            message,
            'https://utteranc.es'
          );
        } catch (err) {
          console.error('테마 변경 실패:', err);
        }
      }
    };

    const darkModeObserver = new MutationObserver(updateTheme);

    darkModeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // 초기 테마 설정을 위해 한 번 실행
    setTimeout(updateTheme, 1000);

    return () => {
      darkModeObserver.disconnect();
    };
  }, [postId]);

  return (
    <div className="my-8 w-full">
      <div className="prose prose-sm mb-4 dark:prose-invert">
        <h3 className="text-lg font-semibold text-content dark:text-content-dark">
          댓글 남기기
        </h3>
        <p className="text-sm text-content-dark">
          GitHub 계정으로 댓글을 남길 수 있습니다.
        </p>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-300">
          <p>{error}</p>
          <button
            className="mt-2 text-sm font-medium underline"
            onClick={() => {
              setError(null);
              scriptLoaded.current = false;
              // 재시도 로직 트리거
              const currentPostId = postId;
              setTimeout(() => {
                if (utterancesRef.current) {
                  utterancesRef.current.innerHTML = '';
                  scriptLoaded.current = false;
                  // effect 다시 실행하기 위한 트릭
                  const script = document.createElement('script');
                  utterancesRef.current.appendChild(script);
                  utterancesRef.current.removeChild(script);
                }
              }, 100);
            }}
          >
            다시 시도하기
          </button>
        </div>
      ) : (
        <div
          ref={utterancesRef}
          className="utterances-container w-full rounded-md bg-white p-2 dark:bg-gray-800"
        />
      )}
    </div>
  );
};

export default CommentInput;
