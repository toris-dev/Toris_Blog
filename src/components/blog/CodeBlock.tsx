'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { codeToHtml } from 'shiki';
import { cn } from '@/utils/style';
import { copyToClipboard } from '@/utils/clipboard';
import toast from 'react-hot-toast';
import { FaCopy, FaCheck } from '@/components/icons';

interface CodeBlockProps {
  code: string;
  language: string;
  className?: string;
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const { theme } = useTheme();
  const [html, setHtml] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const isDark = theme === 'dark' || theme === 'cyberpunk';
    const shikiTheme = isDark ? 'github-dark' : 'github-light';

    codeToHtml(code, {
      lang: language || 'text',
      theme: shikiTheme,
      transformers: []
    })
      .then((highlighted) => {
        // Shiki가 생성한 HTML을 그대로 사용
        // codeBlockContent 내부에서 스타일링하므로 pre 태그에 추가 className 불필요
        setHtml(highlighted);
      })
      .catch((error) => {
        console.error('Shiki highlighting error:', error);
        // Fallback to plain text
        setHtml(`<pre class="shiki"><code>${code}</code></pre>`);
      });
  }, [code, language, theme, mounted]);

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      toast.success('코드가 복사되었습니다.');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('코드 복사에 실패했습니다.');
    }
  };

  // 서버와 클라이언트에서 항상 동일한 구조 렌더링 (hydration mismatch 방지)
  // 복사 버튼은 항상 렌더링하되, 클라이언트에서만 동작하도록 처리
  return (
    <div
      data-code-block="true"
      className={cn(
        'flex w-full min-w-0 max-w-full flex-col overflow-hidden rounded-lg border border-border bg-muted shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/80 px-2 py-1.5 sm:px-3 sm:py-2">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="size-2.5 rounded-full bg-traffic-red shadow-[0_0_0_0.5px_rgba(0,0,0,0.1)] sm:size-3" />
          <div className="size-2.5 rounded-full bg-traffic-yellow shadow-[0_0_0_0.5px_rgba(0,0,0,0.1)] sm:size-3" />
          <div className="size-2.5 rounded-full bg-traffic-green shadow-[0_0_0_0.5px_rgba(0,0,0,0.1)] sm:size-3" />
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="font-mono text-[10px] font-medium uppercase text-muted-foreground sm:text-xs">
            {language || 'text'}
          </span>
          <button
            onClick={mounted ? handleCopy : undefined}
            className="flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-foreground transition-colors hover:border-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:px-2 sm:py-1 sm:text-xs"
            aria-label={copied ? '복사됨' : '코드 복사'}
            title={copied ? '복사됨' : '코드 복사'}
            disabled={!mounted}
          >
            {mounted && copied ? (
              <>
                <FaCheck className="size-3 text-green-500" />
                <span>복사됨</span>
              </>
            ) : (
              <>
                <FaCopy className="size-3" />
                <span>복사</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div
        className="min-w-0 overflow-x-auto overflow-y-hidden p-2 sm:p-3 md:p-4"
        style={{
          WebkitOverflowScrolling: 'touch',
          maxWidth: '100%',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {html ? (
          <div
            className="min-w-0"
            style={{ maxWidth: '100%', width: '100%' }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre
            className="shiki min-w-0"
            style={{ maxWidth: '100%', width: '100%' }}
          >
            <code className={className}>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

// displayName 설정 (pre 컴포넌트에서 감지용)
CodeBlock.displayName = 'CodeBlock';
