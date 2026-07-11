'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import type { Project } from '@/data/projects';
import { cn } from '@/utils/style';
import { BrowserFrame } from './DeviceFrames';
import { AccentButton, CountUp, EASE, GhostButton, Reveal } from './shared';

const SITE = 'https://catchmeme.com';

/* ---------- 인라인 SVG 아이콘 ---------- */
function Ico({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

const iconPaths: Record<string, ReactNode> = {
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  )
};

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <Ico className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Ico>
  );
}

/* ---------- 섹션 헤딩 ---------- */
function Head({
  eyebrow,
  title,
  sub,
  align = 'center'
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: string;
  align?: 'center' | 'left';
}) {
  return (
    <Reveal
      className={
        align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'
      }
    >
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-600 dark:text-orange-400">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
        {title}
      </h2>
      {sub && (
        <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-400">
          {sub}
        </p>
      )}
    </Reveal>
  );
}

const card =
  'rounded-2xl border border-slate-900/10 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]';

const focusRing =
  'rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500';

/* ---------- 사용 안전 신호등 배지 ---------- */
const TONE = {
  green: {
    label: '써도 됨',
    chip: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500'
  },
  amber: {
    label: '맥락 주의',
    chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500'
  },
  red: {
    label: '이미 늦음',
    chip: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500'
  }
} as const;

function SafetyBadge({ tone }: { tone: keyof typeof TONE }) {
  const t = TONE[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold',
        t.chip
      )}
    >
      <span className={cn('size-1.5 rounded-full', t.dot)} />
      {t.label}
    </span>
  );
}

/* ---------- 밈 생명 게이지 (불꽃 미터) ---------- */
function FlameGauge({ level, stage }: { level: number; stage: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex items-center gap-2">
      <FlameIcon className="size-3.5 shrink-0 text-orange-500" />
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={level}
        aria-label={`밈 생명 게이지 ${level}% — ${stage}`}
      >
        {reduce ? (
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
            style={{ width: `${level}%` }}
          />
        ) : (
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${level}%` }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 1.1, ease: EASE }}
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
          />
        )}
      </div>
      <span className="w-12 shrink-0 text-right text-[10px] font-semibold text-slate-500 dark:text-slate-400">
        {stage}
      </span>
    </div>
  );
}

/* ---------- 목업: 밈 결과 카드 ---------- */
function MemeResultCard({
  name,
  meaning,
  tone,
  level,
  stage,
  match
}: {
  name: string;
  meaning: string;
  tone: keyof typeof TONE;
  level: number;
  stage: string;
  match?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-900/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {name}
          </p>
          {match && (
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[9px] font-bold text-orange-600 dark:text-orange-400">
              초성 일치 · {match}
            </span>
          )}
        </div>
        <SafetyBadge tone={tone} />
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
        {meaning}
      </p>
      <div className="mt-3">
        <FlameGauge level={level} stage={stage} />
      </div>
    </div>
  );
}

/* ---------- 1. 히어로 ---------- */
function Hero({ project }: { project: Project }) {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-32">
      {/* 도트 그리드 배경 */}
      <div
        className="pointer-events-none absolute inset-0 text-slate-900 opacity-[0.05] dark:text-white"
        style={{
          backgroundImage:
            'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      />
      <div className="pointer-events-none absolute -top-24 left-1/2 size-[30rem] -translate-x-1/2 rounded-full bg-orange-500/15 blur-3xl" />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative mx-auto max-w-3xl text-center"
      >
        <div className="mx-auto flex w-fit items-center justify-center">
          <span className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-lg">
            {!reduce && (
              <motion.span
                animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0, 0.35] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-2xl bg-orange-400"
                aria-hidden
              />
            )}
            <FlameIcon className="relative size-7" />
          </span>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {[project.status, project.year, project.category].map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-slate-900/10 bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300"
            >
              {pill}
            </span>
          ))}
        </div>
        <h1 className="mt-6 text-4xl font-extrabold leading-[1.14] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
          {project.name}
          <span className="mt-3 block bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl lg:text-4xl">
            {project.tagline}
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-slate-600 dark:text-slate-400">
          {project.description}
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <AccentButton
            href={SITE}
            from={project.accent.from}
            to={project.accent.to}
            glow={project.accent.glow}
          >
            catchmeme.com 방문 ↗
          </AccentButton>
          <GhostButton href="#memecatch-features">기능 둘러보기</GhostButton>
        </div>
      </motion.div>
    </section>
  );
}

/* ---------- 2. 문제 / 목표 ---------- */
const PAIN = [
  {
    title: '나무위키는 너무 길다',
    desc: '유래·논란·역사까지 스크롤 30번. 정작 궁금한 건 "이게 무슨 뜻이고 지금 써도 되냐"인데.'
  },
  {
    title: '챗봇은 신뢰 신호가 없다',
    desc: '그럴듯한 설명은 해주지만 출처도, 유행 시점도, 지금 쓰면 민망한지도 알려주지 않는다.'
  }
];

function ProblemSection() {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Problem"
        title={
          <>
            그 밈, 지금 써도{' '}
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              되는 건가요?
            </span>
          </>
        }
        sub="트렌드에 살짝 뒤처진 사람에게 필요한 건 긴 설명이 아니라 빠른 판단입니다."
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
        {PAIN.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.1}>
            <div className={`${card} h-full p-6`}>
              <span className="flex size-9 items-center justify-center rounded-xl bg-slate-900/5 text-slate-500 dark:bg-white/5 dark:text-slate-400">
                <Ico className="size-4">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </Ico>
              </span>
              <p className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                {p.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {p.desc}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.2} className="mx-auto mt-6 max-w-4xl">
        <div className="rounded-2xl border border-orange-500/25 bg-orange-500/[0.06] p-6 text-center dark:border-orange-400/25 dark:bg-orange-400/[0.06]">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-600 dark:text-orange-400">
            Goal
          </p>
          <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
            3초 안에 뜻 + 지금 사용 가능 여부까지.
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            검색하면 의미, 유래, 그리고 사용 안전 신호등이 한 화면에. 그게
            밈캐치의 전부이자 핵심입니다.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- 3. 핵심 기능 ---------- */
function FeaturesSection({ project }: { project: Project }) {
  return (
    <section id="memecatch-features" className="scroll-mt-20 px-6 py-24">
      <Head
        eyebrow="Features"
        title="사전이 아니라 판단 도구"
        sub="뜻풀이에서 끝나지 않고 '지금, 어디서, 누구에게' 써도 되는지 답합니다."
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
        {project.features.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.08}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: EASE }}
              className={`${card} h-full p-6 shadow-sm`}
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400">
                <Ico className="size-5">
                  {iconPaths[f.icon] ?? iconPaths.zap}
                </Ico>
              </span>
              <p className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                {f.title}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {f.description}
              </p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- 4. 비주얼 쇼케이스 ---------- */
function ShowcaseSection() {
  return (
    <section className="relative px-6 py-24">
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-3xl" />
      <Head
        eyebrow="Product"
        title={
          <>
            &ldquo;ㅇㅍㅌ&rdquo;만 쳐도{' '}
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              영포티
            </span>
            가 나온다
          </>
        }
        sub="초성 검색 → 신호등 판단 → 불꽃 생명 게이지. 검색부터 판단까지의 실제 흐름입니다."
      />
      <Reveal className="relative mx-auto mt-12 max-w-3xl">
        <BrowserFrame url="catchmeme.com">
          <div className="bg-slate-50 p-4 dark:bg-slate-950 sm:p-6">
            {/* 목업 헤더 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 text-white">
                  <FlameIcon className="size-4" />
                </span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  밈캐치
                </span>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                {['급상승', '신호등', '제보'].map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-slate-900/5 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-400"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            {/* 검색 바 */}
            <div className="mt-4 flex items-center gap-2.5 rounded-full border border-orange-500/40 bg-white px-4 py-2.5 shadow-sm dark:bg-white/[0.05]">
              <SearchIcon className="size-4 shrink-0 text-orange-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                ㅇㅍㅌ
              </span>
              <span className="ml-auto shrink-0 rounded-md bg-orange-500/10 px-2 py-0.5 text-[9px] font-bold text-orange-600 dark:text-orange-400">
                초성 검색
              </span>
            </div>
            {/* 결과 카드 */}
            <div className="mt-4 space-y-3">
              <MemeResultCard
                name="영포티"
                match="ㅇㅍㅌ"
                meaning="젊게 살고 싶어 하는 40대. 자칭은 위험하고 타칭은 미묘한, 맥락을 크게 타는 단어."
                tone="amber"
                level={62}
                stage="유행"
              />
              <MemeResultCard
                name="럭키비키"
                meaning="'완전 럭키잖아'의 초긍정 버전. 원영적 사고의 대표 밈으로 아직 안전 구간."
                tone="green"
                level={86}
                stage="급상승"
              />
              <MemeResultCard
                name="어쩔티비"
                meaning="'어쩌라고, 가서 TV나 봐'. 2021~22년 전성기를 지나 이제는 추억의 영역."
                tone="red"
                level={18}
                stage="추억"
              />
            </div>
            {/* 목업 푸터 라인 */}
            <p className="mt-4 text-center text-[10px] text-slate-400 dark:text-slate-500">
              신호등 · 생명 게이지는 pg_cron 일배치로 매일 갱신됩니다
            </p>
          </div>
        </BrowserFrame>
      </Reveal>
    </section>
  );
}

/* ---------- 5. 스탯 밴드 ---------- */
const STATS: { value: ReactNode; label: string }[] = [
  { value: <CountUp target={1733} />, label: '밈 수록' },
  { value: <CountUp target={648} />, label: '유튜브 임베드' },
  { value: <CountUp target={269} />, label: '나무위키 출처' },
  { value: '1990~2026', label: '밈 연대 커버리지' }
];

function StatsSection() {
  return (
    <section className="px-6 py-24">
      <Reveal className="mx-auto max-w-4xl">
        <div className={`${card} grid gap-8 p-8 sm:grid-cols-2 lg:grid-cols-4 lg:p-10`}>
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-3xl font-extrabold tabular-nums text-transparent sm:text-4xl">
                {s.value}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- 6. 기술 스택 ---------- */
const STACK_GROUPS = [
  { label: 'Frontend', items: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind v4'] },
  { label: 'Backend', items: ['Supabase', 'RLS', 'pg_cron'] },
  { label: 'PWA', items: ['Serwist'] },
  { label: 'Infra', items: ['Vercel'] }
];

const ENG_NOTES = [
  {
    title: 'RLS 기본 deny + security definer RPC',
    desc: '모든 테이블은 기본 차단. 반응·댓글·신고 같은 쓰기는 검증된 RPC로만 통과합니다.'
  },
  {
    title: 'pg_trgm + 초성 한국어 검색',
    desc: 'trigram 인덱스에 초성 generated column을 더해 오타·초성·유사어 검색을 DB단에서 처리.'
  },
  {
    title: 'ISR 캐시',
    desc: '1,733개 밈 상세 페이지를 정적 생성 + 재검증으로 서빙해 비용과 속도를 동시에 잡았습니다.'
  }
];

function TechSection() {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Tech Stack"
        title="가볍게, 그러나 단단하게"
        sub="개인 프로젝트지만 프로덕션 기준으로. 보안과 검색 품질에 특히 공을 들였습니다."
      />
      <div className="mx-auto mt-12 max-w-4xl space-y-5">
        <Reveal>
          <div className={`${card} space-y-5 p-6 sm:p-8`}>
            {STACK_GROUPS.map((g) => (
              <div
                key={g.label}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
              >
                <p className="w-24 shrink-0 text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  {g.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {g.items.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-slate-900/10 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {ENG_NOTES.map((n, i) => (
            <Reveal key={n.title} delay={0.1 + i * 0.08}>
              <div className={`${card} h-full p-5`}>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {n.title}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {n.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 7. 최종 CTA ---------- */
function FinalCta({ project }: { project: Project }) {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden px-6 py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/15 blur-3xl" />
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: EASE }}
        className={`${card} relative mx-auto max-w-2xl p-10 text-center sm:p-14`}
      >
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-lg">
          <FlameIcon className="size-6" />
        </span>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          다음에 모르는 밈이 나오면,{' '}
          <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
            3초
          </span>
          면 됩니다
        </h2>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          지금 바로 검색해 보세요. 회원가입 없이, 설치 없이 열립니다.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <AccentButton
            href={SITE}
            from={project.accent.from}
            to={project.accent.to}
            glow={project.accent.glow}
          >
            밈캐치 써보기 ↗
          </AccentButton>
          <Link
            href="/projects"
            className={cn(
              'inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
              focusRing
            )}
          >
            다른 프로젝트 보기
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ---------- 미니 푸터 ---------- */
function LandingFooter({ project }: { project: Project }) {
  return (
    <footer className="border-t border-slate-900/10 px-6 py-10 dark:border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400 sm:flex-row">
        <p>
          <span className="font-bold text-slate-900 dark:text-white">
            {project.name}
          </span>{' '}
          · © 2026 toris-dev
        </p>
        <div className="flex items-center gap-6">
          <a
            href={SITE}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'transition-colors hover:text-slate-900 dark:hover:text-white',
              focusRing
            )}
          >
            라이브 사이트 ↗
          </a>
          <Link
            href="/projects"
            className={cn(
              'transition-colors hover:text-slate-900 dark:hover:text-white',
              focusRing
            )}
          >
            모든 프로젝트 →
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function MemeCatchLanding({ project }: { project: Project }) {
  return (
    <div className="overflow-x-clip bg-slate-50 text-slate-900 dark:bg-[#0A0604] dark:text-white">
      <Hero project={project} />
      <ProblemSection />
      <FeaturesSection project={project} />
      <ShowcaseSection />
      <StatsSection />
      <TechSection />
      <FinalCta project={project} />
      <LandingFooter project={project} />
    </div>
  );
}
