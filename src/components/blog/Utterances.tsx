'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

interface UtterancesProps {
  repo: string; // 'owner/repo' 형식
}

export function Utterances({ repo }: UtterancesProps) {
  const commentsRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const currentTheme = theme === 'dark' ? 'github-dark' : 'github-light';
    const commentsElement = commentsRef.current;

    // Utterances 스크립트가 이미 로드되었는지 확인
    if (commentsElement && commentsElement.querySelector('.utterances')) {
      // 이미 로드된 경우, 테마만 변경
      const iframe =
        commentsElement.querySelector<HTMLIFrameElement>('.utterances-frame');
      if (iframe) {
        iframe.contentWindow?.postMessage(
          { type: 'set-theme', theme: currentTheme },
          'https://utteranc.es'
        );
      }
      return;
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

    if (commentsElement) {
      commentsElement.appendChild(scriptEl);
    }

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거 (선택 사항)
      if (commentsElement) {
        commentsElement.innerHTML = '';
      }
    };
  }, [repo, theme]);

  return <div ref={commentsRef} className="mt-12" />;
}
