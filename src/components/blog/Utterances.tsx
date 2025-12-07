'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

interface UtterancesProps {
  repo: string; // 'owner/repo' 형식
}

export function Utterances({ repo }: UtterancesProps) {
  const commentsRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const currentTheme = theme === 'dark' ? 'github-dark' : 'github-light';
    const commentsElement = commentsRef.current;

    // DOM에 요소가 연결되어 있는지 확인
    if (!commentsElement || !commentsElement.isConnected) {
      return;
    }

    // Utterances 스크립트가 이미 로드되었는지 확인
    if (commentsElement.querySelector('.utterances')) {
      // 이미 로드된 경우, 테마만 변경
      const iframe =
        commentsElement.querySelector<HTMLIFrameElement>('.utterances-frame');
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.postMessage(
            { type: 'set-theme', theme: currentTheme },
            'https://utteranc.es'
          );
        } catch (error) {
          console.warn('Failed to update Utterances theme:', error);
        }
      }
      return;
    }

    // 기존 스크립트가 있으면 제거
    if (scriptRef.current && scriptRef.current.parentNode) {
      scriptRef.current.parentNode.removeChild(scriptRef.current);
      scriptRef.current = null;
    }

    // 스크립트가 로드되지 않은 경우 새로 생성
    const scriptEl = document.createElement('script');
    scriptEl.src = 'https://utteranc.es/client.js';
    scriptEl.async = true;
    scriptEl.setAttribute('repo', repo);
    scriptEl.setAttribute('issue-term', 'pathname'); // 현재 페이지 경로를 이슈 제목으로 사용
    scriptEl.setAttribute('label', 'comment'); // 이슈에 추가할 라벨
    scriptEl.setAttribute('theme', currentTheme);
    scriptEl.setAttribute('crossorigin', 'anonymous');

    // 스크립트 로드 에러 처리
    scriptEl.onerror = () => {
      console.error('Failed to load Utterances script');
    };

    // DOM에 안전하게 추가
    if (commentsElement && commentsElement.isConnected) {
      commentsElement.appendChild(scriptEl);
      scriptRef.current = scriptEl;
    }

    return () => {
      // cleanup: 스크립트만 안전하게 제거
      if (scriptRef.current && scriptRef.current.parentNode) {
        try {
          scriptRef.current.parentNode.removeChild(scriptRef.current);
        } catch (error) {
          // 이미 제거된 경우 무시
          console.warn('Failed to remove Utterances script:', error);
        }
        scriptRef.current = null;
      }
    };
  }, [repo, theme]);

  return <div ref={commentsRef} className="mt-12" />;
}
