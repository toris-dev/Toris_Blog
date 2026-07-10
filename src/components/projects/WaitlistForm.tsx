'use client';

import { useState, type FormEvent } from 'react';
import type { Project } from '@/data/projects';
import { cn } from '@/utils/style';

type Status = 'idle' | 'loading' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 프로젝트 사전등록 폼 — 이메일을 /api/waitlist 로 보내 프로젝트별 GitHub Issue에
 * 기록한다. 프로젝트 액센트 색상을 사용하며 라이트/다크 모두 대응.
 */
export default function WaitlistForm({
  project,
  className,
  ctaLabel = '사전 등록'
}: {
  project: Project;
  className?: string;
  ctaLabel?: string;
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const { from, to, glow } = project.accent;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'loading') return;
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setStatus('error');
      setMessage('유효한 이메일 주소를 입력해 주세요.');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: project.slug,
          projectName: project.name,
          email: value
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message || '사전등록이 완료되었습니다!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || '접수에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } catch {
      setStatus('error');
      setMessage('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  if (status === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'mx-auto w-full max-w-md rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-center',
          className
        )}
      >
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          ✓ {message}
        </p>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          출시 소식을 이메일로 가장 먼저 알려드릴게요.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn('mx-auto w-full max-w-md', className)}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="이메일 주소"
          aria-label={`${project.name} 사전등록 이메일 주소`}
          autoComplete="email"
          disabled={status === 'loading'}
          className="h-12 flex-1 rounded-full border border-slate-900/15 bg-white px-5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900/40 disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/40"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            background: `linear-gradient(90deg, ${from}, ${to})`,
            boxShadow: `0 8px 28px ${glow}`
          }}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === 'loading' ? '접수 중…' : ctaLabel}
        </button>
      </div>
      <p
        aria-live="polite"
        className={cn(
          'mt-2 min-h-[1.25rem] px-1 text-xs',
          status === 'error'
            ? 'text-rose-500 dark:text-rose-400'
            : 'text-slate-500 dark:text-slate-400'
        )}
      >
        {message || '이메일만 남기면 출시 시 가장 먼저 알려드려요.'}
      </p>
    </form>
  );
}
