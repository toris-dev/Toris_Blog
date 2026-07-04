import type { ReactNode } from 'react';
import { cn } from '@/utils/style';

/**
 * 프로덕트 목업용 디바이스 프레임 4종 (폰/브라우저/OS 윈도우/터미널).
 * 순수 마크업 — 서버/클라이언트 어디서든 사용 가능. 라이트/다크 페어 적용.
 */

export function PhoneFrame({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative mx-auto w-[280px] rounded-[2.6rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-700',
        className
      )}
    >
      {/* 다이나믹 아일랜드 */}
      <div className="absolute left-1/2 top-2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-slate-900 dark:bg-slate-950" />
      <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] bg-white dark:bg-slate-950">
        {children}
      </div>
    </div>
  );
}

export function BrowserFrame({
  children,
  url,
  className
}: {
  children: ReactNode;
  url: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-900/10 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900',
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-900/10 bg-slate-100 px-4 py-2.5 dark:border-white/5 dark:bg-slate-800">
        <span className="size-2.5 rounded-full bg-[#FF5F57]" />
        <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="size-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-[11px] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          {url}
        </span>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

export function WindowFrame({
  children,
  title,
  className
}: {
  children: ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-900/10 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900',
        className
      )}
    >
      <div className="relative flex items-center border-b border-slate-900/10 bg-slate-100 px-4 py-2.5 dark:border-white/5 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#FF5F57]" />
          <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="size-2.5 rounded-full bg-[#28C840]" />
        </div>
        <span className="absolute left-1/2 -translate-x-1/2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {title}
        </span>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

export function TerminalFrame({
  children,
  title = 'zsh — devpulse',
  className
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-white/10 bg-[#0B0F19] shadow-2xl',
        className
      )}
    >
      <div className="relative flex items-center border-b border-white/5 bg-[#111827] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#FF5F57]" />
          <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="size-2.5 rounded-full bg-[#28C840]" />
        </div>
        <span className="absolute left-1/2 -translate-x-1/2 font-mono text-[11px] text-slate-500">
          {title}
        </span>
      </div>
      <div className="relative p-4 font-mono text-[13px] leading-relaxed">
        {children}
      </div>
    </div>
  );
}
