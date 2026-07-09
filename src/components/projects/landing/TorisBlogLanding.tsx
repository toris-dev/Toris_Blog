'use client';

import { useRef, type ReactNode } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform
} from 'framer-motion';
import Image from 'next/image';

import { cn } from '@/utils/style';
import type { Project } from '@/data/projects';
import { AccentButton, CountUp, GhostButton, Reveal } from './shared';

/** Expo-out — 랜딩 공통 이징 */
const EASE = [0.16, 1, 0.3, 1] as const;

const OVERLINE =
  'text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-400';
const SURFACE =
  'rounded-2xl border border-slate-900/10 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none';

/* ------------------------------------------------------------------ */
/*  Inline SVG icon set (24×24 stroke) — drawn per-feature, not by name */
/* ------------------------------------------------------------------ */

function IconBase({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** MDX 문서 */
const IconDoc = (
  <IconBase>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h4" />
  </IconBase>
);

/** 카테고리 · 태그 필터 */
const IconFilter = (
  <IconBase>
    <path d="M4 5h16M7 12h10M10 19h4" />
  </IconBase>
);

/** 조회수 · 좋아요 (activity) */
const IconPulse = (
  <IconBase>
    <path d="M3 12h4l2 6 4-14 2 8h6" />
  </IconBase>
);

/** GEO · SEO (shield) */
const IconShield = (
  <IconBase>
    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
    <path d="M9.5 12l1.8 1.8L15 10" />
  </IconBase>
);

/** 코드 */
const IconCode = (
  <IconBase>
    <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14" />
  </IconBase>
);

/** 스파클 */
const IconSpark = (
  <IconBase>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    <path d="M18 15l.7 1.9L20.6 18l-1.9.7L18 20.6l-.7-1.9L15.4 18l1.9-.7z" />
  </IconBase>
);

const FEATURE_ICONS = [IconDoc, IconFilter, IconPulse, IconShield, IconCode, IconSpark];

/* ------------------------------------------------------------------ */
/*  Browser chrome frame                                               */
/* ------------------------------------------------------------------ */

function BrowserFrame({
  url,
  children,
  className
}: {
  url: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-900/10 bg-white shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-[#0a0f1c] dark:shadow-black/40',
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-900/10 bg-slate-100/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
        <span className="size-3 rounded-full bg-rose-400/80" />
        <span className="size-3 rounded-full bg-amber-400/80" />
        <span className="size-3 rounded-full bg-emerald-400/80" />
        <div className="ml-3 flex h-6 max-w-[240px] flex-1 items-center gap-1.5 truncate rounded-md bg-white px-3 text-[11px] text-slate-500 ring-1 ring-slate-900/5 dark:bg-white/[0.05] dark:text-slate-400 dark:ring-white/10">
          <svg viewBox="0 0 24 24" className="size-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <span className="truncate">{url}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  1. Hero                                                            */
/* ------------------------------------------------------------------ */

function Hero({ project, reduce }: { project: Project; reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [4, 0, -3]);

  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-16 sm:pt-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[860px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${project.accent.glow}, transparent)` }}
      />
      <div className="relative mx-auto max-w-4xl text-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-6 flex flex-wrap items-center justify-center gap-2"
        >
          {[project.status, project.year, project.category].map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-slate-900/10 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"
            >
              {pill}
            </span>
          ))}
        </motion.div>

        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
          className="text-4xl font-bold leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-6xl"
        >
          {project.name}
          <span className="mt-3 block bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-2xl text-transparent dark:from-cyan-300 dark:to-blue-400 sm:text-4xl">
            {project.tagline}
          </span>
        </motion.h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: EASE }}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg"
        >
          {project.description}
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28, ease: EASE }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <AccentButton
            href={project.github}
            from={project.accent.from}
            to={project.accent.to}
            glow={project.accent.glow}
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
              <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
            </svg>
            GitHub 보기
          </AccentButton>
          <GhostButton href={project.github}>프로젝트 보기</GhostButton>
          <GhostButton href="#tech">기술 스택 보기</GhostButton>
        </motion.div>
      </div>

      {/* Mockup in browser chrome with scroll parallax + tilt */}
      <motion.div
        ref={ref}
        initial={reduce ? false : { opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.9, bounce: 0.2, delay: 0.35 }}
        style={{ transformPerspective: 1400 }}
        className="relative mx-auto mt-16 max-w-5xl"
      >
        <motion.div style={reduce ? undefined : { y, rotate }}>
          <BrowserFrame url="toris-dev.vercel.app/blog">
            <div className="aspect-[1376/768] w-full">
              <Image
                src={project.image}
                alt="Toris Blog 웹 UI — 다크 모드 기술 블로그의 글 목록과 카테고리 필터, 목차 레일이 보이는 화면"
                width={1376}
                height={768}
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
                className="h-auto w-full object-cover"
              />
            </div>
          </BrowserFrame>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  2. Problem / Goal                                                  */
/* ------------------------------------------------------------------ */

const GOALS = [
  '흩어진 학습 기록을 한곳에 모아 다시 찾아보기 쉽게',
  '코드 하이라이트·목차로 “읽기 좋은” 기술 글 경험',
  '검색·AI 답변에 잘 노출되도록 GEO/SEO를 기본 탑재'
];

function ProblemSection() {
  return (
    <section className="border-y border-slate-900/10 bg-white/50 px-6 py-24 dark:border-white/10 dark:bg-white/[0.02] sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-2">
        <Reveal>
          <p className={OVERLINE}>Problem & Goal</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            배운 것은 많은데, 다시 꺼내볼 곳이 없다
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-slate-600 dark:text-slate-400">
            공부하고 삽질한 기록은 노트 앱, 메신저, 코드 주석에 흩어집니다. 정작 필요할 때
            다시 찾지 못하고, 어렵게 정리한 글도 검색에 노출되지 않으면 아무도 읽지 않죠.
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {' '}
              Toris Blog는 개발자가 배운 것을 오래 남기고, 검색·AI를 통해 다시 발견되게 만드는
              지식 아카이브
            </span>
            를 목표로 만들었습니다.
          </p>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">
            For — 지식을 축적하고 공유하려는 개발자, 그리고 나의 기록을 다시 찾는 미래의 나.
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <ul className="space-y-4">
            {GOALS.map((g, i) => (
              <li key={g} className={cn(SURFACE, 'flex items-start gap-4 p-5')}>
                <span
                  className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${'#0EA5E9'}, ${'#22D3EE'})` }}
                >
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {g}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  3. Key Features                                                    */
/* ------------------------------------------------------------------ */

function FeaturesSection({ project, reduce }: { project: Project; reduce: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
      <Reveal className="max-w-2xl">
        <p className={OVERLINE}>Key Features</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          읽기 좋고, 찾기 쉽고, 잘 노출되는 블로그
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {project.features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={reduce ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: (i % 3) * 0.1, ease: EASE }}
            whileHover={reduce ? undefined : { y: -6 }}
            className={cn(
              SURFACE,
              'group relative overflow-hidden p-6 transition-colors duration-200 hover:border-cyan-500/40 dark:hover:border-cyan-400/30'
            )}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: project.accent.glow }}
            />
            <span
              className="relative flex size-11 items-center justify-center rounded-xl text-white"
              style={{ background: `linear-gradient(135deg, ${project.accent.from}, ${project.accent.to})` }}
            >
              {FEATURE_ICONS[i % FEATURE_ICONS.length]}
            </span>
            <h3 className="relative mt-5 text-lg font-semibold text-slate-900 dark:text-white">
              {f.title}
            </h3>
            <p className="relative mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {f.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  4. Visual Showcase — mockup + coded MDX editor motif               */
/* ------------------------------------------------------------------ */

const CATEGORIES = ['전체', 'Next.js', 'React', 'TypeScript', 'DevOps', '회고'];

const CODE_LINES: { indent: number; tokens: { t: string; c: string }[] }[] = [
  { indent: 0, tokens: [{ t: '# ', c: 'text-slate-400' }, { t: 'Server Components 정리', c: 'text-slate-200' }] },
  { indent: 0, tokens: [] },
  { indent: 0, tokens: [{ t: 'export const ', c: 'text-cyan-400' }, { t: 'meta ', c: 'text-blue-300' }, { t: '= {', c: 'text-slate-400' }] },
  { indent: 1, tokens: [{ t: 'title', c: 'text-sky-300' }, { t: ': ', c: 'text-slate-400' }, { t: "'RSC 완벽 가이드'", c: 'text-emerald-300' }] },
  { indent: 1, tokens: [{ t: 'tags', c: 'text-sky-300' }, { t: ': [', c: 'text-slate-400' }, { t: "'next', 'react'", c: 'text-emerald-300' }, { t: ']', c: 'text-slate-400' }] },
  { indent: 0, tokens: [{ t: '}', c: 'text-slate-400' }] },
  { indent: 0, tokens: [] },
  { indent: 0, tokens: [{ t: '```tsx', c: 'text-slate-500' }] },
  { indent: 0, tokens: [{ t: 'async function ', c: 'text-cyan-400' }, { t: 'Page', c: 'text-blue-300' }, { t: '() {', c: 'text-slate-400' }] },
  { indent: 1, tokens: [{ t: 'return ', c: 'text-cyan-400' }, { t: '<Article />', c: 'text-sky-300' }] },
  { indent: 0, tokens: [{ t: '}', c: 'text-slate-400' }] }
];

const TOC = [
  { label: 'RSC란 무엇인가', active: true },
  { label: '렌더링 흐름', active: false },
  { label: '데이터 페칭', active: false },
  { label: '실전 예제', active: false }
];

function CodeEditorGraphic({ reduce }: { reduce: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-900/10 bg-[#0a0f1c] shadow-xl dark:border-white/10">
      {/* editor top bar */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-rose-400/80" />
        <span className="size-2.5 rounded-full bg-amber-400/80" />
        <span className="size-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-cyan-300">
          server-components.mdx
        </span>
        {/* dark-mode toggle motif */}
        <span className="ml-auto flex h-5 w-9 items-center rounded-full bg-cyan-500/30 p-0.5">
          <span className="size-4 translate-x-3.5 rounded-full bg-cyan-300 shadow" />
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-0">
        {/* code area */}
        <div className="relative overflow-hidden p-4 font-mono text-[11px] leading-relaxed sm:text-xs">
          {/* shimmer highlight sweeping the code */}
          {!reduce && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 h-6 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"
              initial={{ y: 8 }}
              animate={{ y: [8, 180, 8] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          {CODE_LINES.map((line, i) => (
            <div key={i} className="flex gap-3">
              <span className="w-4 shrink-0 select-none text-right text-slate-600">{i + 1}</span>
              <span style={{ paddingLeft: line.indent * 14 }} className="whitespace-pre">
                {line.tokens.length === 0 ? (
                  <span> </span>
                ) : (
                  line.tokens.map((tk, j) => (
                    <span key={j} className={tk.c}>
                      {tk.t}
                    </span>
                  ))
                )}
              </span>
            </div>
          ))}
        </div>

        {/* TOC rail */}
        <aside className="hidden w-44 border-l border-white/10 p-4 sm:block">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            목차
          </p>
          <div className="relative space-y-2 pl-3">
            <span className="absolute left-0 top-1 h-full w-px bg-white/10" />
            {TOC.map((t) => (
              <div key={t.label} className="relative">
                {t.active && (
                  <span className="absolute -left-3 top-1 h-4 w-0.5 rounded bg-cyan-400" />
                )}
                <p
                  className={cn(
                    'text-[11px] leading-tight',
                    t.active ? 'font-semibold text-cyan-300' : 'text-slate-500'
                  )}
                >
                  {t.label}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ShowcaseSection({ project, reduce }: { project: Project; reduce: boolean }) {
  return (
    <section className="border-y border-slate-900/10 bg-white/50 px-6 py-24 dark:border-white/10 dark:bg-white/[0.02] sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className={OVERLINE}>Visual Showcase</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            콘텐츠부터 코드 하이라이트까지, 한 화면에서
          </h2>
        </Reveal>

        {/* category filter chips */}
        <Reveal delay={0.05}>
          <div className="mt-8 flex flex-wrap gap-2">
            {CATEGORIES.map((c, i) => (
              <button
                key={c}
                type="button"
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500',
                  i === 0
                    ? 'border-transparent text-white shadow-sm'
                    : 'border-slate-900/10 bg-white/70 text-slate-600 hover:-translate-y-0.5 hover:border-cyan-500/40 hover:text-cyan-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-cyan-400/40 dark:hover:text-cyan-300'
                )}
                style={
                  i === 0
                    ? { background: `linear-gradient(135deg, ${project.accent.from}, ${project.accent.to})` }
                    : undefined
                }
              >
                {c}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-5">
          {/* framed mockup — angled */}
          <Reveal className="lg:col-span-3" y={40}>
            <motion.div
              whileHover={reduce ? undefined : { rotate: 0, scale: 1.01 }}
              transition={{ duration: 0.4, ease: EASE }}
              style={{ transformPerspective: 1200 }}
              className="relative"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] opacity-40 blur-3xl"
                style={{ background: `radial-gradient(closest-side, ${project.accent.glow}, transparent)` }}
              />
              <BrowserFrame url="toris-dev.vercel.app/blog/rsc-guide" className="rotate-[-1.5deg]">
                <div className="aspect-[1376/768] w-full">
                  <Image
                    src={project.image}
                    alt="Toris Blog 글 상세 화면 — 코드 하이라이트와 목차가 함께 표시된 기술 아티클"
                    width={1376}
                    height={768}
                    sizes="(max-width: 1024px) 100vw, 620px"
                    className="h-auto w-full object-cover"
                  />
                </div>
              </BrowserFrame>

              {/* floating accent chips */}
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
                className="absolute -left-3 top-8 hidden rounded-xl border border-slate-900/10 bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 shadow-lg backdrop-blur dark:border-white/10 dark:bg-[#0a0f1c]/90 dark:text-slate-200 sm:block"
              >
                <span className="text-cyan-500 dark:text-cyan-400">◆</span> 다크 모드 기본
              </motion.div>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
                className="absolute -right-3 bottom-10 hidden rounded-xl border border-slate-900/10 bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 shadow-lg backdrop-blur dark:border-white/10 dark:bg-[#0a0f1c]/90 dark:text-slate-200 sm:block"
              >
                <span className="text-cyan-500 dark:text-cyan-400">↗</span> 자동 목차 생성
              </motion.div>
            </motion.div>
          </Reveal>

          {/* coded MDX editor / TOC graphic */}
          <Reveal className="lg:col-span-2" delay={0.15} y={40}>
            <CodeEditorGraphic reduce={reduce} />
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              MDX 원문은 프론트매터(meta)부터 코드 블록까지 그대로 작성하고, 렌더 시 코드
              하이라이트와 목차가 자동으로 만들어집니다.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  5. Tech Stack                                                      */
/* ------------------------------------------------------------------ */

const GROUP_ORDER = ['Framework', 'Language', 'Styling', 'Content', 'Infra', 'Tools'] as const;
const TECH_GROUP: Record<string, (typeof GROUP_ORDER)[number]> = {
  'Next.js 16': 'Framework',
  'React 19': 'Framework',
  TypeScript: 'Language',
  'Tailwind CSS': 'Styling',
  MDX: 'Content',
  Vercel: 'Infra'
};

function TechSection({ project }: { project: Project }) {
  const groups = GROUP_ORDER.map((label) => ({
    label,
    items: project.tech.filter((t) => (TECH_GROUP[t] ?? 'Tools') === label)
  })).filter((g) => g.items.length > 0);

  return (
    <section id="tech" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24 sm:py-28">
      <Reveal className="max-w-2xl">
        <p className={OVERLINE}>Tech Stack</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          모던 프론트엔드 기본기 위에 쌓았습니다
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g, gi) => (
          <Reveal key={g.label} delay={(gi % 3) * 0.08}>
            <div className={cn(SURFACE, 'h-full p-6')}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                {g.label}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {g.items.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-900/10 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: `linear-gradient(135deg, ${project.accent.from}, ${project.accent.to})` }}
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
/*  6. Impact / Result                                                 */
/* ------------------------------------------------------------------ */

const STATS: { target: number; suffix?: string; label: string }[] = [
  { target: 48, suffix: '+', label: '발행한 글' },
  { target: 6, label: '주제 카테고리' },
  { target: 100, label: 'Lighthouse SEO' },
  { target: 0, label: '외부 DB 의존' }
];

function ImpactSection({ project, reduce }: { project: Project; reduce: boolean }) {
  return (
    <section className="border-y border-slate-900/10 bg-white/50 px-6 py-24 dark:border-white/10 dark:bg-white/[0.02] sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className={OVERLINE}>Impact & Engineering</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            지표가 아니라, 만들어낸 역량으로 증명합니다
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
              className={cn(SURFACE, 'p-6')}
            >
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-4xl font-bold text-transparent dark:from-cyan-300 dark:to-blue-400"
              >
                <CountUp target={s.target} suffix={s.suffix} />
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className={cn(SURFACE, 'mt-6 p-7')}>
            <p className="leading-relaxed text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">
                외부 DB 없이 조회수·좋아요를 운영합니다.
              </span>{' '}
              GitHub Issue를 데이터 저장소로 활용해 서버리스 환경에서 카운트를 집계하고,
              JSON-LD·sitemap·robots·llms.txt와 정제된 메타 설명으로 검색 엔진과 AI 크롤러 양쪽에
              대비했습니다. App Router의 정적 생성과 이미지 최적화로 로딩은 가볍게, GEO/SEO는
              기본값으로 — 인프라 비용은 0에 가깝게 유지하면서 프로덕션 품질을 확보한 것이 이
              프로젝트의 핵심 엔지니어링입니다.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['서버리스 조회수', 'GEO/SEO 기본 탑재', 'ISR 정적 생성', '이미지 최적화'].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-xs font-medium text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  7. Final CTA                                                       */
/* ------------------------------------------------------------------ */

function FinalCta({ project }: { project: Project }) {
  return (
    <section className="relative overflow-hidden px-6 py-28 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${project.accent.glow}, transparent)` }}
      />
      <Reveal className="relative mx-auto max-w-3xl text-center">
        <div className={cn(SURFACE, 'px-6 py-14 sm:px-14')}>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            개발 지식, 오래 남기고 다시 발견되게
          </h2>
          <p className="mx-auto mt-4 max-w-md text-slate-600 dark:text-slate-400">
            소스 코드와 라이브 블로그를 직접 확인해 보세요. 다른 프로젝트도 함께 둘러볼 수 있습니다.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <AccentButton
              href={project.github}
              from={project.accent.from}
              to={project.accent.to}
              glow={project.accent.glow}
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
                <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
              </svg>
              GitHub 보기
            </AccentButton>
            <GhostButton href="/projects">다른 프로젝트 보기</GhostButton>
            <GhostButton href="/contact">문의하기</GhostButton>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Root                                                               */
/* ------------------------------------------------------------------ */

export default function TorisBlogLanding({ project }: { project: Project }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <div className="min-h-dvh overflow-x-clip bg-slate-50 pt-24 text-slate-900 dark:bg-[#050810] dark:text-white">
      <Hero project={project} reduce={reduce} />
      <ProblemSection />
      <FeaturesSection project={project} reduce={reduce} />
      <ShowcaseSection project={project} reduce={reduce} />
      <TechSection project={project} />
      <ImpactSection project={project} reduce={reduce} />
      <FinalCta project={project} />
    </div>
  );
}
