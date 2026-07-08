'use client';

import { useRef, useState } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform
} from 'framer-motion';
import Image from 'next/image';

import type { Project } from '@/data/projects';
import { cn } from '@/utils/style';
import { AccentButton, CountUp, GhostButton, Reveal } from './shared';

const EASE = [0.16, 1, 0.3, 1] as const;

/* ------------------------------------------------------------------ */
/* 콘셉트 데이터 (illustrative demo)                                    */
/* ------------------------------------------------------------------ */

/** PnL 곡선의 원본 좌표 (x 0→600, y 낮을수록 수익 높음) */
const PNL_POINTS: [number, number][] = [
  [0, 152],
  [50, 140],
  [100, 154],
  [150, 120],
  [200, 130],
  [250, 96],
  [300, 110],
  [350, 72],
  [400, 86],
  [450, 54],
  [500, 40],
  [550, 60],
  [600, 26]
];

/** 각 지점의 라벨/누적 수익률 (툴팁용) */
const PNL_META: { label: string; value: number }[] = [
  { label: 'W-12', value: -2 },
  { label: 'W-11', value: 6 },
  { label: 'W-10', value: 3 },
  { label: 'W-9', value: 17 },
  { label: 'W-8', value: 12 },
  { label: 'W-7', value: 33 },
  { label: 'W-6', value: 24 },
  { label: 'W-5', value: 58 },
  { label: 'W-4', value: 46 },
  { label: 'W-3', value: 82 },
  { label: 'W-2', value: 108 },
  { label: 'W-1', value: 90 },
  { label: 'Now', value: 142 }
];

/** Catmull-Rom → 베지어 스무딩으로 부드러운 path 생성 */
function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return '';
  const d: string[] = [`M ${points[0][0]},${points[0][1]}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`);
  }
  return d.join(' ');
}

const PNL_LINE = smoothPath(PNL_POINTS);
const PNL_AREA = `${PNL_LINE} L 600,200 L 0,200 Z`;

interface AssetRow {
  sym: string;
  name: string;
  weight: number;
  pnl: number;
  color: string;
}

const ASSETS: AssetRow[] = [
  { sym: 'BTC', name: 'Bitcoin', weight: 42, pnl: 18.2, color: '#F7931A' },
  { sym: 'ETH', name: 'Ethereum', weight: 28, pnl: 9.4, color: '#627EEA' },
  { sym: 'SOL', name: 'Solana', weight: 14, pnl: -4.1, color: '#14F195' },
  { sym: 'ARB', name: 'Arbitrum', weight: 9, pnl: 23.7, color: '#28A0F0' },
  { sym: 'USDC', name: 'USD Coin', weight: 7, pnl: 0.2, color: '#2775CA' }
];

const TECH_GROUPS: { label: string; items: string[] }[] = [
  { label: 'Framework', items: ['Next.js'] },
  { label: 'Language', items: ['TypeScript'] },
  { label: 'Styling', items: ['Tailwind CSS'] },
  { label: 'Charts', items: ['Recharts'] },
  { label: 'Web3', items: ['Web3'] }
];

const IMPACT: {
  target: number;
  prefix?: string;
  suffix?: string;
  label: string;
  desc: string;
  tone: 'gain' | 'accent' | 'loss';
}[] = [
  {
    target: 12480,
    label: '분석한 거래',
    desc: '거래소 체결 내역을 정규화해 집계',
    tone: 'accent'
  },
  {
    target: 68,
    suffix: '%',
    label: '평균 승률',
    desc: '진입·청산 페어를 매칭해 산출',
    tone: 'gain'
  },
  {
    target: 142,
    prefix: '+',
    suffix: '%',
    label: '누적 ROI',
    desc: '기간 누적 손익률 (12주)',
    tone: 'gain'
  },
  {
    target: 24,
    label: '추적 자산',
    desc: '멀티 체인·거래소 토큰 커버리지',
    tone: 'accent'
  }
];

/* ------------------------------------------------------------------ */
/* 공용 스타일 토큰                                                     */
/* ------------------------------------------------------------------ */

const SURFACE =
  'rounded-2xl border border-slate-900/10 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none';
const OVERLINE =
  'font-mono text-xs font-semibold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-400';
const BODY = 'text-slate-600 dark:text-slate-400';

const GAIN = 'text-emerald-600 dark:text-emerald-400';
const LOSS = 'text-rose-600 dark:text-rose-400';

function GitHubGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 2.5-.34c.85 0 1.71.12 2.5.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.8-4.58 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

/* 24x24 stroke 아이콘 — 각 피처에 어울리는 글리프 직접 드로잉 */
function FeatureIcon({ i }: { i: number }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true
  };
  switch (i) {
    case 0: // PnL 성과 차트
      return (
        <svg {...common}>
          <path d="M3 3v18h18" />
          <path d="M6 14l4-5 3 3 5-8" />
          <circle cx="21" cy="4" r="1" />
        </svg>
      );
    case 1: // 승률 · ROI
      return (
        <svg {...common}>
          <path d="M3 17l6-6 4 4 8-9" />
          <path d="M14 6h7v7" />
        </svg>
      );
    case 2: // 자산 배분 테이블
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9.5h18M9 4v16" />
        </svg>
      );
    default: // 데이터 중심 대시보드
      return (
        <svg {...common}>
          <path d="M3 12h3l2.5 6L12 5l2.5 10L17 12h4" />
        </svg>
      );
  }
}

/* ------------------------------------------------------------------ */
/* 콘셉트 그래픽: PnL 라인 차트 (hover 인터랙션 + draw-in)               */
/* ------------------------------------------------------------------ */

function PnLChart({
  project,
  reduce
}: {
  project: Project;
  reduce: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const cur = active ?? PNL_META.length - 1;
  const point = PNL_POINTS[cur];
  const meta = PNL_META[cur];

  return (
    <div className={cn(SURFACE, 'p-5 sm:p-6')}>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className={OVERLINE}>PnL · 12W</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-white">
            <span className={GAIN}>+142%</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[11px] text-slate-500 dark:text-slate-500">
            {meta.label}
          </p>
          <p
            className={cn(
              'font-mono text-sm font-bold',
              meta.value >= 0 ? GAIN : LOSS
            )}
          >
            {meta.value >= 0 ? '+' : ''}
            {meta.value}%
          </p>
        </div>
      </div>

      <div
        className="relative"
        onMouseLeave={() => setActive(null)}
        role="img"
        aria-label="12주 누적 손익 곡선 — 우상향, 현재 +142%"
      >
        <svg
          viewBox="0 0 600 200"
          preserveAspectRatio="none"
          className="h-40 w-full sm:h-48"
        >
          <defs>
            <linearGradient id="pnlArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={project.accent.to} stopOpacity="0.32" />
              <stop offset="55%" stopColor={project.accent.from} stopOpacity="0.1" />
              <stop offset="100%" stopColor={project.accent.from} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="pnlLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={project.accent.from} />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>

          {/* 그리드 */}
          {[40, 80, 120, 160].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="600"
              y2={y}
              className="stroke-slate-900/[0.06] dark:stroke-white/[0.06]"
              strokeWidth="1"
            />
          ))}

          {/* 면적 */}
          <motion.path
            d={PNL_AREA}
            fill="url(#pnlArea)"
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
          />

          {/* 라인 draw-in */}
          <motion.path
            d={PNL_LINE}
            fill="none"
            stroke="url(#pnlLine)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.4, ease: EASE }}
          />

          {/* active 마커 */}
          <line
            x1={point[0]}
            y1="0"
            x2={point[0]}
            y2="200"
            className="stroke-slate-900/15 dark:stroke-white/20"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
          <circle
            cx={point[0]}
            cy={point[1]}
            r="5"
            fill={project.accent.to}
            stroke="#fff"
            strokeWidth="2"
          />

          {/* hover 히트존 */}
          {PNL_POINTS.map((p, i) => (
            <rect
              key={i}
              x={p[0] - 25}
              y="0"
              width="50"
              height="200"
              fill="transparent"
              onMouseEnter={() => setActive(i)}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 콘셉트 그래픽: 승률 도넛 링                                           */
/* ------------------------------------------------------------------ */

function WinRateRing({ reduce }: { reduce: boolean }) {
  const rate = 0.68;
  return (
    <div className={cn(SURFACE, 'flex flex-col items-center p-5 sm:p-6')}>
      <p className={cn(OVERLINE, 'self-start')}>Win Rate</p>
      <div className="relative mt-3 size-40">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
          </defs>
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            strokeWidth="12"
            className="stroke-slate-900/[0.08] dark:stroke-white/[0.08]"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            whileInView={{ pathLength: rate }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.3, ease: EASE }}
            style={{ pathLength: reduce ? rate : undefined }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-bold text-slate-900 dark:text-white">
            <CountUp target={68} suffix="%" />
          </span>
          <span className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-500">
            847승 / 398패
          </span>
        </div>
      </div>
      <div className="mt-4 flex w-full items-center justify-between font-mono text-[11px]">
        <span className={GAIN}>▲ 847 WIN</span>
        <span className={LOSS}>▼ 398 LOSS</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 콘셉트 그래픽: 자산 배분 테이블                                       */
/* ------------------------------------------------------------------ */

function AllocationTable({ reduce }: { reduce: boolean }) {
  return (
    <div className={cn(SURFACE, 'overflow-hidden p-5 sm:p-6')}>
      <div className="mb-3 flex items-center justify-between">
        <p className={OVERLINE}>Allocation</p>
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-500">
          5 assets
        </span>
      </div>
      <div className="grid grid-cols-[1.4fr_2fr_0.9fr] gap-x-3 border-b border-slate-900/10 pb-2 font-mono text-[10px] uppercase tracking-wider text-slate-400 dark:border-white/10 dark:text-slate-500">
        <span>Asset</span>
        <span>Weight</span>
        <span className="text-right">24h</span>
      </div>
      <ul>
        {ASSETS.map((a, i) => (
          <li
            key={a.sym}
            className="group grid grid-cols-[1.4fr_2fr_0.9fr] items-center gap-x-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.05]"
          >
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: a.color }}
              />
              <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                {a.sym}
              </span>
              <span className="hidden text-[11px] text-slate-500 dark:text-slate-400 sm:inline">
                {a.name}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-full max-w-28 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10">
                <motion.span
                  className="block h-full rounded-full"
                  style={{ backgroundColor: a.color }}
                  initial={reduce ? false : { width: 0 }}
                  whileInView={{ width: `${a.weight}%` }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.9, delay: i * 0.08, ease: EASE }}
                />
              </span>
              <span className="w-9 shrink-0 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                {a.weight}%
              </span>
            </span>
            <span
              className={cn(
                'text-right font-mono text-xs font-semibold',
                a.pnl >= 0 ? GAIN : LOSS
              )}
            >
              {a.pnl >= 0 ? '+' : ''}
              {a.pnl}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. HERO                                                             */
/* ------------------------------------------------------------------ */

function Hero({ project, reduce }: { project: Project; reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -48]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0.6, -1.4]);

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-12 sm:pt-16">
      {/* 배경 글로우 + 그리드 */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-8%] h-[520px] w-[900px] max-w-[130vw] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background: `radial-gradient(closest-side, ${project.accent.glow}, transparent)`
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 text-slate-900 opacity-[0.035] dark:text-white dark:opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(closest-side, black, transparent 85%)'
        }}
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex size-1.5">
              <span
                className={cn(
                  'absolute inline-flex size-full rounded-full bg-emerald-500',
                  reduce ? '' : 'animate-ping opacity-75'
                )}
              />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
            </span>
            {project.status}
          </span>
          <span className="rounded-full border border-slate-900/10 px-3 py-1 font-mono text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300">
            {project.year}
          </span>
          <span className="rounded-full border border-slate-900/10 px-3 py-1 font-mono text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300">
            {project.category}
          </span>
        </motion.div>

        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
          className="mt-6 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl"
        >
          {project.name}
        </motion.h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16, ease: EASE }}
          className="mx-auto mt-4 max-w-xl text-lg font-semibold text-slate-800 dark:text-slate-200 sm:text-xl"
        >
          {project.tagline}
        </motion.p>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24, ease: EASE }}
          className={cn('mx-auto mt-5 max-w-xl text-sm leading-relaxed sm:text-base', BODY)}
        >
          {project.description}
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.32, ease: EASE }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <AccentButton
            href={project.github}
            from={project.accent.from}
            to={project.accent.to}
            glow={project.accent.glow}
          >
            <GitHubGlyph />
            GitHub 보기
          </AccentButton>
          <GhostButton href="#showcase">대시보드 미리보기</GhostButton>
          <GhostButton href="#tech">기술 스택 보기</GhostButton>
        </motion.div>
      </div>

      {/* 목업 — 트레이딩 터미널 프레임 + 패럴럭스 틸트 */}
      <div ref={ref} className="relative mx-auto mt-14 max-w-5xl [perspective:1600px]">
        <motion.div
          style={reduce ? undefined : { y, rotate }}
          className="relative"
        >
          <div className="overflow-hidden rounded-2xl border border-slate-900/10 bg-white shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-[#0A0F1C] dark:shadow-black/60">
            {/* 터미널 상단 바 */}
            <div className="flex items-center gap-2 border-b border-slate-900/10 bg-slate-100/80 px-4 py-2.5 dark:border-white/5 dark:bg-white/[0.04]">
              <span className="size-2.5 rounded-full bg-[#FF5F57]" />
              <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="size-2.5 rounded-full bg-[#28C840]" />
              <span className="ml-3 flex flex-1 items-center gap-2 truncate rounded-md bg-white px-3 py-1 font-mono text-[11px] text-slate-500 dark:bg-black/30 dark:text-slate-400">
                <span className="text-emerald-500">●</span>
                cryptotrade.gg / dashboard
              </span>
              <span className="hidden font-mono text-[11px] text-emerald-500 sm:inline">
                LIVE
              </span>
            </div>
            <div
              className="relative w-full"
              style={{ aspectRatio: '1376 / 768' }}
            >
              <Image
                src={project.image}
                alt="CryptoTrade.gg 트레이딩 대시보드 목업 — PnL 성과 차트, 승률 링, 자산 배분 테이블이 배치된 다크 테마 터미널 화면"
                width={1376}
                height={768}
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="h-auto w-full object-cover"
              />
              {/* 상단 미묘한 글로스 */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5"
              />
            </div>
          </div>

          {/* 플로팅 액센트 칩 */}
          <motion.div
            aria-hidden
            initial={reduce ? false : { opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
            className="absolute -left-3 top-10 hidden rounded-xl border border-emerald-500/30 bg-white/90 px-3 py-2 shadow-lg backdrop-blur dark:bg-[#0A0F1C]/90 sm:block"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              ROI
            </p>
            <p className={cn('font-mono text-lg font-bold', GAIN)}>+142%</p>
          </motion.div>
          <motion.div
            aria-hidden
            initial={reduce ? false : { opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.62, ease: EASE }}
            className="absolute -right-3 bottom-14 hidden rounded-xl border border-sky-500/30 bg-white/90 px-3 py-2 shadow-lg backdrop-blur dark:bg-[#0A0F1C]/90 sm:block"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              Win Rate
            </p>
            <p className="font-mono text-lg font-bold text-sky-600 dark:text-sky-400">
              68%
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 2. PROBLEM / GOAL                                                   */
/* ------------------------------------------------------------------ */

function ProblemSection() {
  return (
    <section className="border-y border-slate-900/10 bg-white/60 px-6 py-24 dark:border-white/10 dark:bg-white/[0.02] sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <p className={OVERLINE}>Problem</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            &ldquo;나 트레이딩 잘해&rdquo;를 증명할 방법이 없었다
          </h2>
          <p className={cn('mt-5 text-base leading-relaxed', BODY)}>
            트레이더의 실력은 스크린샷 몇 장으로 남습니다. 수익 인증은 조작하기
            쉽고, 손실은 조용히 사라지죠. 거래소마다 흩어진 체결 내역은 승률도,
            진짜 수익률도 말해주지 않습니다.{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              CryptoTrade.gg
            </span>
            는 거래 데이터 그 자체로 전적을 증명합니다. op.gg가 게임 실력을
            보여주듯, 트레이딩 실력을 데이터로.
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <ul className="grid gap-4">
            {[
              {
                who: '액티브 트레이더',
                need: '흩어진 거래소 기록을 한곳에서 객관적으로 리뷰하고 싶은 사람'
              },
              {
                who: '전적을 공유하려는 트레이더',
                need: '스크린샷이 아닌 검증 가능한 데이터로 실력을 보여주려는 사람'
              },
              {
                who: '데이터로 개선하려는 사람',
                need: '승률·손익·자산 배분을 지표로 보고 전략을 다듬으려는 사람'
              }
            ].map((row) => (
              <li key={row.who} className={cn(SURFACE, 'flex gap-4 p-5')}>
                <span
                  aria-hidden
                  className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21a8 8 0 0 0-16 0" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {row.who}
                  </p>
                  <p className={cn('mt-1 text-sm leading-relaxed', BODY)}>
                    {row.need}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. KEY FEATURES                                                     */
/* ------------------------------------------------------------------ */

function FeaturesSection({
  project,
  reduce
}: {
  project: Project;
  reduce: boolean;
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
      <Reveal className="max-w-2xl">
        <p className={OVERLINE}>Features</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          트레이딩 터미널처럼 날카로운 데이터 대시보드
        </h2>
        <p className={cn('mt-4 text-base leading-relaxed', BODY)}>
          손익 곡선부터 자산 배분까지, 트레이더가 매일 확인하는 지표를 한 화면에
          밀도 있게 담았습니다.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {project.features.map((f, i) => (
          <motion.article
            key={f.title}
            initial={reduce ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, delay: i * 0.08, ease: EASE }}
            whileHover={reduce ? undefined : { y: -6 }}
            className={cn(
              SURFACE,
              'group relative overflow-hidden p-6 transition-shadow duration-300 hover:shadow-lg',
              i === 3 ? 'sm:col-span-2 lg:col-span-1' : ''
            )}
            style={
              {
                '--glow': project.accent.glow
              } as React.CSSProperties
            }
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: project.accent.glow }}
            />
            <span
              className="relative inline-flex size-11 items-center justify-center rounded-xl text-sky-600 ring-1 ring-inset ring-sky-500/20 dark:text-sky-400"
              style={{
                background: `linear-gradient(135deg, ${project.accent.from}22, ${project.accent.to}18)`
              }}
            >
              <FeatureIcon i={i} />
            </span>
            <h3 className="relative mt-5 text-base font-semibold text-slate-900 dark:text-white">
              {f.title}
            </h3>
            <p className={cn('relative mt-2 text-sm leading-relaxed', BODY)}>
              {f.description}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4. VISUAL SHOWCASE                                                  */
/* ------------------------------------------------------------------ */

function ShowcaseSection({
  project,
  reduce
}: {
  project: Project;
  reduce: boolean;
}) {
  return (
    <section
      id="showcase"
      className="relative overflow-hidden border-y border-slate-900/10 bg-white/60 px-6 py-24 dark:border-white/10 dark:bg-white/[0.02] sm:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[-10%] h-[420px] w-[620px] max-w-[120vw] rounded-full opacity-25 blur-3xl"
        style={{
          background: `radial-gradient(closest-side, ${project.accent.glow}, transparent)`
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className={OVERLINE}>Showcase</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            데이터가 곧 화면이 되는 대시보드
          </h2>
          <p className={cn('mt-4 text-base leading-relaxed', BODY)}>
            코드로 그린 라이브 위젯과 실제 대시보드 목업을 나란히. 모든 숫자는
            데모용 예시입니다.
          </p>
        </Reveal>

        {/* 코드로 그린 콘셉트 위젯 3종 */}
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <PnLChart project={project} reduce={reduce} />
          </Reveal>
          <Reveal delay={0.1}>
            <WinRateRing reduce={reduce} />
          </Reveal>
          <Reveal delay={0.05} className="lg:col-span-3">
            <AllocationTable reduce={reduce} />
          </Reveal>
        </div>

        {/* 실제 목업 — 각도를 준 프레임 */}
        <Reveal delay={0.1} className="mt-8">
          <motion.div
            whileHover={reduce ? undefined : { rotate: 0, scale: 1.01 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative mx-auto max-w-4xl [transform:rotate(-1deg)]"
          >
            <div className="overflow-hidden rounded-2xl border border-slate-900/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0A0F1C] dark:shadow-black/60">
              <div className="flex items-center gap-2 border-b border-slate-900/10 bg-slate-100/80 px-4 py-2.5 dark:border-white/5 dark:bg-white/[0.04]">
                <span className="size-2.5 rounded-full bg-[#FF5F57]" />
                <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
                <span className="size-2.5 rounded-full bg-[#28C840]" />
                <span className="ml-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  portfolio · overview
                </span>
              </div>
              <div className="relative w-full" style={{ aspectRatio: '1376 / 768' }}>
                <Image
                  src={project.image}
                  alt="CryptoTrade.gg 대시보드 전체 화면 — 트레이딩 성과와 포트폴리오 개요"
                  width={1376}
                  height={768}
                  sizes="(max-width: 896px) 100vw, 896px"
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 5. TECH STACK                                                       */
/* ------------------------------------------------------------------ */

function TechSection({ project }: { project: Project }) {
  return (
    <section id="tech" className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
      <Reveal className="max-w-2xl">
        <p className={OVERLINE}>Tech Stack</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          역할별로 정리한 기술 구성
        </h2>
        <p className={cn('mt-4 text-base leading-relaxed', BODY)}>
          데이터 시각화 프론트엔드와 온체인·거래소 데이터 연동을 중심으로
          구성했습니다.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TECH_GROUPS.map((group, i) => (
          <Reveal key={group.label} delay={i * 0.06}>
            <div className={cn(SURFACE, 'h-full p-6')}>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {group.label}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.items.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-slate-900/[0.03] px-3.5 py-1.5 text-sm font-medium text-slate-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
                  >
                    <span
                      aria-hidden
                      className="size-1.5 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${project.accent.from}, ${project.accent.to})`
                      }}
                    />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 6. IMPACT / RESULT                                                  */
/* ------------------------------------------------------------------ */

function ImpactSection() {
  return (
    <section className="border-y border-slate-900/10 bg-white/60 px-6 py-24 dark:border-white/10 dark:bg-white/[0.02] sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className={OVERLINE}>Impact</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            구현한 것과 배운 것
          </h2>
          <p className={cn('mt-4 text-base leading-relaxed', BODY)}>
            아래 수치는 데이터 시각화 역량을 보여주기 위한 데모 예시입니다. 실제
            운영 지표가 아니라, 어떤 규모의 데이터를 다루도록 설계했는지를
            나타냅니다.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {IMPACT.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div className={cn(SURFACE, 'h-full p-6')}>
                <div
                  className={cn(
                    'font-mono text-3xl font-bold tracking-tight sm:text-4xl',
                    s.tone === 'gain'
                      ? GAIN
                      : s.tone === 'loss'
                        ? LOSS
                        : 'text-sky-600 dark:text-sky-400'
                  )}
                >
                  <CountUp
                    target={s.target}
                    prefix={s.prefix}
                    suffix={s.suffix}
                  />
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {s.label}
                </p>
                <p className={cn('mt-1 text-xs leading-relaxed', BODY)}>
                  {s.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1} className="mt-8">
          <div className={cn(SURFACE, 'p-6 sm:p-8')}>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  h: '데이터 인제스트 엔진',
                  p: '거래소 API의 서로 다른 체결 스키마를 하나의 정규화 모델로 매핑하고, 페어링·수수료·펀딩까지 반영해 신뢰할 수 있는 손익을 계산합니다.'
                },
                {
                  h: '시각화 파이프라인',
                  p: 'Recharts와 커스텀 SVG를 함께 써서 PnL 곡선·승률 링·자산 배분을 렌더링. 라이트/다크 양쪽에서 대비를 지키며 밀도 높은 지표를 표현했습니다.'
                },
                {
                  h: 'Web3 데이터 연동',
                  p: '온체인 지갑과 거래소 데이터를 함께 다루기 위한 어댑터 구조를 설계해, 새로운 소스를 붙일 때 시각화 레이어는 그대로 재사용합니다.'
                }
              ].map((c) => (
                <div key={c.h}>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {c.h}
                  </h3>
                  <p className={cn('mt-2 text-sm leading-relaxed', BODY)}>
                    {c.p}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 7. FINAL CTA                                                        */
/* ------------------------------------------------------------------ */

function FinalCta({ project, reduce }: { project: Project; reduce: boolean }) {
  return (
    <section className="relative overflow-hidden px-6 py-28 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[760px] max-w-[130vw] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
        style={{
          background: `radial-gradient(closest-side, ${project.accent.glow}, transparent)`
        }}
      />
      <Reveal className="relative mx-auto max-w-3xl text-center">
        <div
          className={cn(
            SURFACE,
            'px-6 py-14 sm:px-12'
          )}
        >
          <p className={OVERLINE}>CryptoTrade.gg</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
            트레이딩 전적을
            <br className="hidden sm:block" /> 데이터로 증명하세요
          </h2>
          <p className={cn('mx-auto mt-5 max-w-xl text-base leading-relaxed', BODY)}>
            승률·손익·자산 배분을 한 페이지에. 코드와 설계 과정이 궁금하다면
            저장소를, 다른 작업이 궁금하다면 프로젝트 목록을 확인해보세요.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <AccentButton
              href={project.github}
              from={project.accent.from}
              to={project.accent.to}
              glow={project.accent.glow}
            >
              <GitHubGlyph />
              GitHub 보기
            </AccentButton>
            <GhostButton href="/projects">다른 프로젝트 보기</GhostButton>
            <GhostButton href="/contact">문의하기</GhostButton>
          </div>
        </div>
      </Reveal>

      <div className="relative mx-auto mt-10 flex max-w-3xl flex-col items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400 sm:flex-row">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          {project.name}{' '}
          <span className="font-normal">© {project.year} toris-dev</span>
        </p>
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:hover:text-white"
        >
          GitHub
        </a>
      </div>

      {/* reduce 모션 사용자에겐 정적, 아니면 미묘한 하단 라인 */}
      <motion.div
        aria-hidden
        initial={reduce ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: EASE }}
        className="relative mx-auto mt-10 h-px max-w-3xl origin-left"
        style={{
          background: `linear-gradient(90deg, transparent, ${project.accent.from}, ${project.accent.to}, transparent)`
        }}
      />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* ROOT                                                                */
/* ------------------------------------------------------------------ */

export default function CryptoTradeLanding({ project }: { project: Project }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <div className="min-h-dvh overflow-x-clip bg-slate-50 pt-24 text-slate-900 dark:bg-[#050810] dark:text-white">
      <Hero project={project} reduce={reduce} />
      <ProblemSection />
      <FeaturesSection project={project} reduce={reduce} />
      <ShowcaseSection project={project} reduce={reduce} />
      <TechSection project={project} />
      <ImpactSection />
      <FinalCta project={project} reduce={reduce} />
    </div>
  );
}
