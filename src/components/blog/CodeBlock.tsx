'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { codeToHtml } from 'shiki';
import { cn } from '@/utils/style';

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
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  // 서버와 클라이언트에서 항상 동일한 구조 렌더링 (hydration mismatch 방지)
  // 복사 버튼은 항상 렌더링하되, 클라이언트에서만 동작하도록 처리
  return (
    <div
      data-code-block="true"
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-border bg-muted shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border bg-muted/80 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-full bg-traffic-red shadow-[0_0_0_0.5px_rgba(0,0,0,0.1)]" />
          <div className="size-3 rounded-full bg-traffic-yellow shadow-[0_0_0_0.5px_rgba(0,0,0,0.1)]" />
          <div className="size-3 rounded-full bg-traffic-green shadow-[0_0_0_0.5px_rgba(0,0,0,0.1)]" />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-xs font-medium uppercase text-muted-foreground">
            {language || 'text'}
          </span>
          <button
            onClick={mounted ? handleCopy : undefined}
            className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground transition-colors hover:border-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="코드 복사"
            title="코드 복사"
            disabled={!mounted}
          >
            {mounted && copied ? '✓ 복사됨' : '복사'}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto p-4">
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre className="shiki">
            <code className={className}>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

// displayName 설정 (pre 컴포넌트에서 감지용)
CodeBlock.displayName = 'CodeBlock';
