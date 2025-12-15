'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

interface UtterancesProps {
  repo: string; // 'owner/repo' 형식
}

export function Utterances({ repo }: UtterancesProps) {
  const commentsRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const isMountedRef = useRef(true);
  const { theme } = useTheme();

  useEffect(() => {
    // 테마 매핑: cyberpunk도 dark로 처리
    const currentTheme =
      theme === 'dark' || theme === 'cyberpunk'
        ? 'github-dark'
        : 'github-light';

    // 컴포넌트가 마운트되어 있는지 확인
    if (!isMountedRef.current) {
      return;
    }

    // requestAnimationFrame을 사용하여 다음 프레임에 실행
    // 이렇게 하면 DOM이 완전히 렌더링된 후에 실행됩니다
    const frameId = requestAnimationFrame(() => {
      const commentsElement = commentsRef.current;

      // DOM에 요소가 연결되어 있고 마운트되어 있는지 확인
      if (
        !commentsElement ||
        !commentsElement.isConnected ||
        !isMountedRef.current
      ) {
        return;
      }

      // Utterances 스크립트가 이미 로드되었는지 확인
      const existingUtterances = commentsElement.querySelector('.utterances');
      if (existingUtterances) {
        // 이미 로드된 경우, 테마만 변경
        const iframe =
          commentsElement.querySelector<HTMLIFrameElement>('.utterances-frame');
        if (iframe && iframe.contentWindow && isMountedRef.current) {
          try {
            iframe.contentWindow.postMessage(
              { type: 'set-theme', theme: currentTheme },
              'https://utteranc.es'
            );
          } catch (error) {
            // 에러는 무시 (이미 언마운트되었거나 접근 불가능한 경우)
            if (process.env.NODE_ENV === 'development') {
              console.warn('Failed to update Utterances theme:', error);
            }
          }
        }
        return;
      }

      // 기존 스크립트가 있으면 안전하게 제거
      if (scriptRef.current) {
        const script = scriptRef.current;
        if (script.parentNode && isMountedRef.current) {
          try {
            script.parentNode.removeChild(script);
          } catch (error) {
            // 이미 제거된 경우 무시
          }
        }
        scriptRef.current = null;
      }

      // 마운트 상태를 다시 확인
      if (!isMountedRef.current || !commentsElement.isConnected) {
        return;
      }

      // 스크립트가 로드되지 않은 경우 새로 생성
      const scriptEl = document.createElement('script');
      scriptEl.src = 'https://utteranc.es/client.js';
      scriptEl.async = true;
      scriptEl.setAttribute('repo', repo);
      scriptEl.setAttribute('issue-term', 'pathname');
      scriptEl.setAttribute('label', 'comment');
      scriptEl.setAttribute('theme', currentTheme);
      scriptEl.setAttribute('crossorigin', 'anonymous');

      // 스크립트 로드 에러 처리
      scriptEl.onerror = () => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load Utterances script');
        }
      };

      // DOM에 안전하게 추가
      try {
        if (commentsElement.isConnected && isMountedRef.current) {
          commentsElement.appendChild(scriptEl);
          scriptRef.current = scriptEl;
        }
      } catch (error) {
        // insertAdjacentHTML 에러 방지
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to append Utterances script:', error);
        }
      }
    });

    return () => {
      cancelAnimationFrame(frameId);
      isMountedRef.current = false;

      // cleanup: 스크립트만 안전하게 제거
      if (scriptRef.current) {
        const script = scriptRef.current;
        if (script.parentNode) {
          try {
            script.parentNode.removeChild(script);
          } catch (error) {
            // 이미 제거된 경우 무시
          }
        }
        scriptRef.current = null;
      }

      // Utterances가 생성한 DOM 요소도 제거
      // cleanup 함수에서 ref를 직접 사용하지 않도록 주의
      // (이미 위에서 처리됨)
    };
  }, [repo, theme]);

  // 컴포넌트 마운트 시 isMountedRef를 true로 설정
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return <div ref={commentsRef} className="mt-12" suppressHydrationWarning />;
}
