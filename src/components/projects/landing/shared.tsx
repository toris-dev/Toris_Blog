'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring
} from 'framer-motion';
import { cn } from '@/utils/style';

/** Expo-out — 랜딩 공통 이징 */
export const EASE = [0.16, 1, 0.3, 1] as const;

/** 뷰포트 진입 시 아래에서 떠오르는 공통 리빌 래퍼 */
export function Reveal({
  children,
  delay = 0,
  y = 32,
  className
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: reduce ? 0.01 : 0.7, delay: reduce ? 0 : delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** 뷰포트 진입 시 0 → target 카운트업 숫자 */
export function CountUp({
  target,
  suffix = '',
  prefix = '',
  duration = 1.4,
  className
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(target);
      return;
    }
    mv.set(target);
    const unsub = spring.on('change', (v) => setDisplay(Math.round(v)));
    return unsub;
  }, [inView, target, reduce, mv, spring]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

/** 서비스 액센트 그라디언트 CTA 버튼 */
export function AccentButton({
  children,
  href,
  from,
  to,
  glow,
  onClick,
  className
}: {
  children: ReactNode;
  href?: string;
  from: string;
  to: string;
  glow: string;
  onClick?: () => void;
  className?: string;
}) {
  const style = {
    background: `linear-gradient(90deg, ${from}, ${to})`,
    boxShadow: `0 8px 32px ${glow}`
  };
  const cls = cn(
    'inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 active:scale-[0.97]',
    className
  );
  if (href) {
    return (
      <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className={cls} style={style}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} style={style}>
      {children}
    </button>
  );
}

/** 고스트(보조) 버튼 — 라이트/다크 페어 */
export function GhostButton({
  children,
  href,
  className
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        'inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-900/15 bg-slate-900/5 px-7 text-sm font-semibold text-slate-900 transition-colors duration-200 hover:bg-slate-900/10 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10',
        className
      )}
    >
      {children}
    </a>
  );
}
