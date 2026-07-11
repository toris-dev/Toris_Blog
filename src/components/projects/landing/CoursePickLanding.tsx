'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import type { Project } from '@/data/projects';
import { cn } from '@/utils/style';
import { PhoneFrame } from './DeviceFrames';
import { AccentButton, EASE, GhostButton, Reveal } from './shared';

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

const paths: Record<string, ReactNode> = {
  pin: (
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="8 12 11 15 16 9" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <line x1="9" y1="4" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="20" />
    </>
  ),
  paw: (
    <>
      <circle cx="7" cy="8" r="1.6" />
      <circle cx="12" cy="6" r="1.6" />
      <circle cx="17" cy="8" r="1.6" />
      <path d="M12 11c-2.8 0-5 2.2-5 4.6 0 1.6 1.2 2.4 2.6 2.4 1 0 1.6-.5 2.4-.5s1.4.5 2.4.5c1.4 0 2.6-.8 2.6-2.4C17 13.2 14.8 11 12 11Z" />
    </>
  ),
  stroller: (
    <>
      <path d="M4 5h2l2 8h9a4 4 0 0 0 4-4V7h-9" />
      <circle cx="9" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  run: (
    <>
      <circle cx="15" cy="4.5" r="1.8" />
      <path d="M12 8.5 8.5 11l2.5 3-2 5" />
      <path d="M12 8.5 15 10l3 1M13 12.5l2.5 3.5 3 1.5" />
    </>
  ),
  heart: (
    <path d="M12 20.5s-8-4.7-8-10.5a4.6 4.6 0 0 1 8-3.1 4.6 4.6 0 0 1 8 3.1c0 5.8-8 10.5-8 10.5Z" />
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z" />,
  mountain: (
    <>
      <path d="m8 6 5 8 3-4 6 9H2l6-13z" />
      <circle cx="18.5" cy="4.5" r="1.5" />
    </>
  ),
  arrow: (
    <>
      <line x1="4" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </>
  ),
  list: (
    <>
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="4.5" cy="6" r="1" />
      <circle cx="4.5" cy="12" r="1" />
      <circle cx="4.5" cy="18" r="1" />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.8.3-.9 1-.9 1.7" />
      <line x1="12" y1="16.5" x2="12" y2="16.6" />
    </>
  ),
  flag: (
    <>
      <path d="M4 21V4" />
      <path d="M4 4h13l-2.5 4L17 12H4" />
    </>
  )
};

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
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-green-600 dark:text-green-400">
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

/* ---------- 상황 버튼 데이터 ---------- */
const SITUATIONS = [
  { label: '강아지와', icon: 'paw' },
  { label: '아이와 유모차', icon: 'stroller' },
  { label: '혼자 러닝', icon: 'run' },
  { label: '데이트', icon: 'heart' },
  { label: '밤 산책', icon: 'moon' },
  { label: '등산 입문', icon: 'mountain' }
] as const;

function SituationButton({
  label,
  icon,
  active = false,
  size = 'md'
}: {
  label: string;
  icon: string;
  active?: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 rounded-xl border text-center transition-colors',
        size === 'md' ? 'p-3' : 'p-2',
        active
          ? 'border-green-500 bg-green-500/10 ring-2 ring-green-500/40 dark:border-green-400 dark:bg-green-400/10 dark:ring-green-400/30'
          : 'border-slate-900/10 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]'
      )}
    >
      <span
        className={cn(
          size === 'md' ? 'size-5' : 'size-4',
          active
            ? 'text-green-600 dark:text-green-400'
            : 'text-slate-500 dark:text-slate-400'
        )}
      >
        <Ico className="size-full">{paths[icon]}</Ico>
      </span>
      <span
        className={cn(
          'font-semibold leading-tight',
          size === 'md' ? 'text-[10px]' : 'text-[9px]',
          active
            ? 'text-green-700 dark:text-green-300'
            : 'text-slate-700 dark:text-slate-300'
        )}
      >
        {label}
      </span>
    </div>
  );
}

/* ---------- 히어로 폰 화면: 홈 목업 ---------- */
function HeroPhoneScreen() {
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col bg-white pt-10 dark:bg-slate-950">
      <div className="px-4 pb-1">
        <p className="text-[10px] font-semibold text-green-600 dark:text-green-400">
          코스픽
        </p>
        <p className="mt-1 text-[16px] font-extrabold leading-snug text-slate-900 dark:text-white">
          오늘 어디 걷지?
        </p>
        <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
          지금 상황을 골라주세요
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {SITUATIONS.map((s, i) => (
          <SituationButton
            key={s.label}
            label={s.label}
            icon={s.icon}
            active={i === 0}
          />
        ))}
      </div>
      <div className="mt-auto p-3">
        <motion.div
          animate={reduce ? undefined : { scale: [1, 1.03, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-green-600 to-green-400 text-[11px] font-bold text-white"
        >
          강아지와 걷기 좋은 코스 보기
          <Ico className="size-3">{paths.arrow}</Ico>
        </motion.div>
      </div>
    </div>
  );
}

/* ---------- 1. 히어로 ---------- */
function Hero({ project }: { project: Project }) {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-32">
      {/* 등고선 느낌 배경 */}
      <div
        className="pointer-events-none absolute inset-0 text-green-700 opacity-[0.05] dark:text-green-300"
        style={{
          backgroundImage:
            'repeating-radial-gradient(circle at 20% 10%, currentColor 0, currentColor 1px, transparent 1px, transparent 56px)'
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-24 size-96 rounded-full bg-green-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div className="flex flex-wrap gap-2">
            {[project.status, project.year, project.category].map((t) => (
              <span
                key={t}
                className="rounded-full border border-green-600/25 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-700 dark:border-green-400/25 dark:bg-green-400/10 dark:text-green-300"
              >
                {t}
              </span>
            ))}
          </div>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            코스픽
            <span className="mt-3 block bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-2xl font-bold text-transparent dark:from-green-400 dark:to-green-300 sm:text-3xl">
              오늘 걷기 좋은 길을 골라드립니다
            </span>
          </h1>
          <p className="mt-6 max-w-md leading-relaxed text-slate-600 dark:text-slate-400">
            {project.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <AccentButton
              href={project.github}
              from={project.accent.from}
              to={project.accent.to}
              glow={project.accent.glow}
            >
              GitHub 보기
            </AccentButton>
            <GhostButton href="#coursepick-flow">추천 흐름 보기</GhostButton>
          </div>
        </motion.div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
          className="relative mx-auto"
        >
          <div className="pointer-events-none absolute inset-0 -m-10 rounded-full bg-green-500/15 blur-3xl" />
          <PhoneFrame className="relative w-[270px]">
            <HeroPhoneScreen />
          </PhoneFrame>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- 2. 문제 vs 코스픽의 답 ---------- */
const PROBLEMS = [
  '강아지 데려가도 되는 길인가?',
  '유모차가 지나갈 수 있나?',
  '밤에 걸어도 안전한가?',
  '중간에 화장실은 있나?'
];

const ANSWERS = [
  '반려견 동반 가능 여부를 코스마다 표기',
  '유모차 통행 · 경사 정보를 미리 확인',
  '야간 조명 · 안전 정보 상세 화면 최상단',
  '화장실 위치까지 포함한 실패 방지 체크'
];

function ProblemSection() {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Problem → Goal"
        title={
          <>
            지도 앱은 길은 알려주지만,{' '}
            <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent dark:from-green-400 dark:to-green-300">
              실패
            </span>
            는 못 막습니다
          </>
        }
        sub="목적지까지의 경로가 아니라, 오늘 내 상황에 맞는 실패 없는 코스 선택 — 그게 코스픽의 목표입니다."
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
        <Reveal>
          <div className={`${card} h-full p-6`}>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-slate-500/10 text-slate-500 dark:bg-white/5 dark:text-slate-400">
                <Ico className="h-[18px] w-[18px]">{paths.question}</Ico>
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                지도 앱 앞에서 멈추는 질문들
              </p>
            </div>
            <ul className="mt-5 space-y-3">
              {PROBLEMS.map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400"
                >
                  <span className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500">
                    <Ico className="size-4">{paths.question}</Ico>
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <div
            className={`${card} h-full border-green-600/25 p-6 dark:border-green-400/25`}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-green-500/15 text-green-600 dark:text-green-400">
                <Ico className="h-[18px] w-[18px]">{paths.check}</Ico>
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                코스픽의 답
              </p>
            </div>
            <ul className="mt-5 space-y-3">
              {ANSWERS.map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300"
                >
                  <span className="mt-0.5 shrink-0 text-green-600 dark:text-green-400">
                    <Ico className="size-4">{paths.check}</Ico>
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- 3. 핵심 기능 ---------- */
function FeatureSection({ project }: { project: Project }) {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Features"
        title="걷기 전에 다 알려주는 앱"
        sub="상황 선택부터 경로 시각화까지 — 코스픽의 세 가지 축."
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
        {project.features.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.1}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: EASE }}
              className={`${card} h-full p-6 shadow-sm transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(34,197,94,0.25)]`}
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-green-500/15 text-green-600 dark:text-green-400">
                <Ico className="size-5">{paths[f.icon] ?? paths.pin}</Ico>
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

/* ---------- 4. 추천 흐름 (센터피스) ---------- */
function FlowArrow() {
  const reduce = useReducedMotion();
  return (
    <div
      className="flex shrink-0 items-center justify-center self-center text-green-500 dark:text-green-400"
      aria-hidden
    >
      <motion.span
        animate={reduce ? undefined : { x: [0, 6, 0], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="block rotate-90 lg:rotate-0"
      >
        <Ico className="size-7">{paths.arrow}</Ico>
      </motion.span>
    </div>
  );
}

function StepShell({
  step,
  title,
  children
}: {
  step: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full max-w-[280px]">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-r from-green-600 to-green-400 text-[11px] font-bold text-white">
          {step}
        </span>
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          {title}
        </p>
      </div>
      <div className={`${card} p-4 shadow-sm`}>{children}</div>
    </div>
  );
}

const COURSES = [
  { name: '양재천 벚꽃길', meta: '3.2km · 45분', active: true },
  { name: '서울숲 순환 코스', meta: '2.4km · 35분', active: false },
  { name: '한강 잠원 산책로', meta: '4.1km · 60분', active: false }
];

const CHECKS = [
  '반려견 동반',
  '유모차 통행',
  '야간 조명',
  '화장실 2곳'
];

function FlowSection() {
  return (
    <section id="coursepick-flow" className="scroll-mt-24 px-6 py-24">
      <Head
        eyebrow="How it works"
        title="3번의 탭이면 코스가 정해집니다"
        sub="상황을 고르면, 조건에 맞는 코스만 남고, 걷기 전에 실패 요소를 전부 확인합니다."
      />
      <Reveal className="mt-14">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 lg:flex-row lg:items-stretch lg:justify-center">
          {/* Step 1: 상황 선택 */}
          <StepShell step={1} title="상황 선택">
            <div className="grid grid-cols-2 gap-1.5">
              {SITUATIONS.map((s, i) => (
                <SituationButton
                  key={s.label}
                  label={s.label}
                  icon={s.icon}
                  active={i === 0}
                  size="sm"
                />
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-500 dark:text-slate-400">
              &ldquo;강아지와&rdquo; 선택
            </p>
          </StepShell>

          <FlowArrow />

          {/* Step 2: 코스 리스트 */}
          <StepShell step={2} title="코스 리스트">
            <div className="space-y-2">
              {COURSES.map((c) => (
                <div
                  key={c.name}
                  className={cn(
                    'rounded-lg border p-2.5',
                    c.active
                      ? 'border-green-500/50 bg-green-500/10 dark:border-green-400/40 dark:bg-green-400/10'
                      : 'border-slate-900/10 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold text-slate-900 dark:text-white">
                      {c.name}
                    </p>
                    <span className="shrink-0 text-green-600 dark:text-green-400">
                      <Ico className="size-3.5">{paths.paw}</Ico>
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                    {c.meta} · 반려견 OK
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-500 dark:text-slate-400">
              조건에 맞는 코스만 남습니다
            </p>
          </StepShell>

          <FlowArrow />

          {/* Step 3: 실패 방지 상세 */}
          <StepShell step={3} title="실패 방지 상세">
            <div className="rounded-lg bg-gradient-to-r from-green-600 to-green-400 p-3 text-white">
              <p className="text-[13px] font-extrabold">양재천 벚꽃길</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {['3.2km', '45분', '평지'].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
              실패 방지 체크
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {CHECKS.map((t) => (
                <li
                  key={t}
                  className="flex items-center justify-between rounded-md bg-green-500/[0.08] px-2.5 py-1.5 dark:bg-green-400/[0.08]"
                >
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {t}
                  </span>
                  <span className="text-green-600 dark:text-green-400">
                    <Ico className="size-3.5">{paths.check}</Ico>
                  </span>
                </li>
              ))}
            </ul>
          </StepShell>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- 5. 로드맵 ---------- */
const MILESTONES = [
  { label: '기획 · 인터뷰', done: true, current: false },
  { label: '카카오맵 연동', done: false, current: true },
  { label: 'Supabase + 리뷰', done: false, current: false },
  { label: 'Play 스토어 출시', done: false, current: false }
];

function RoadmapSection({ project }: { project: Project }) {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Roadmap"
        title="10주 로드맵으로 달리는 중"
        sub="기획부터 스토어 출시까지, 4개의 마일스톤."
      />
      <Reveal className="mx-auto mt-12 max-w-4xl">
        <div className={`${card} p-6 sm:p-8`}>
          <div className="mb-6 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              MVP 10주 계획
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-700 dark:text-green-300">
              <span className="size-1.5 rounded-full bg-green-500 dark:bg-green-400" />
              {project.status}
            </span>
          </div>
          <ol className="grid gap-3 sm:grid-cols-4">
            {MILESTONES.map((m, i) => (
              <li key={m.label} className="relative">
                <div
                  className={cn(
                    'flex h-full flex-col gap-2 rounded-xl border p-4',
                    m.current
                      ? 'border-green-500/60 bg-green-500/10 shadow-[0_8px_30px_rgba(34,197,94,0.2)] dark:border-green-400/50 dark:bg-green-400/10'
                      : 'border-slate-900/10 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]'
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 items-center justify-center rounded-full text-[11px] font-bold',
                      m.done || m.current
                        ? 'bg-gradient-to-r from-green-600 to-green-400 text-white'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    {m.done ? (
                      <Ico className="size-3.5">{paths.check}</Ico>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <p
                    className={cn(
                      'text-xs font-bold leading-snug',
                      m.current
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-slate-700 dark:text-slate-300'
                    )}
                  >
                    {m.label}
                  </p>
                  {m.current && (
                    <p className="text-[10px] font-semibold text-green-600 dark:text-green-400">
                      지금 여기
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- 6. 기술 스택 ---------- */
const TECH_GROUPS = [
  { label: 'App', items: ['Flutter', 'Dart'] },
  { label: 'Map', items: ['Kakao Map'] },
  { label: 'Backend', items: ['Supabase'] },
  { label: '수익화', items: ['AdMob'] }
];

function TechSection() {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Tech Stack"
        title="가볍게, 그러나 단단하게"
        sub="1인 개발에 맞춘 검증된 조합."
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TECH_GROUPS.map((g, i) => (
          <Reveal key={g.label} delay={i * 0.08}>
            <div className={`${card} h-full p-5`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-600 dark:text-green-400">
                {g.label}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {g.items.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-slate-900/10 bg-white px-3 py-1 text-xs font-semibold text-slate-800 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.2} className="mx-auto mt-6 max-w-4xl">
        <p className="rounded-xl border border-green-600/20 bg-green-500/[0.06] px-5 py-4 text-center text-xs leading-relaxed text-slate-600 dark:border-green-400/20 dark:bg-green-400/[0.06] dark:text-slate-400">
          <span className="font-bold text-green-700 dark:text-green-300">
            1인 비사업자 제약
          </span>
          을 고려해 인앱 결제 대신{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            광고 + 후원 수익 모델
          </span>
          로 설계했습니다.
        </p>
      </Reveal>
    </section>
  );
}

/* ---------- 7. 최종 CTA ---------- */
function FinalCta({ project }: { project: Project }) {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden px-6 py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/15 blur-3xl" />
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: EASE }}
        className={`${card} relative mx-auto max-w-xl p-10 text-center shadow-lg sm:p-12`}
      >
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-green-400 text-white shadow-lg">
          <Ico className="size-6">{paths.flag}</Ico>
        </span>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          오늘의 산책,{' '}
          <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent dark:from-green-400 dark:to-green-300">
            실패 없이
          </span>
        </h2>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          개발 여정과 설계 문서는 GitHub에서 공개하고 있습니다.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <AccentButton
            href={project.github}
            from={project.accent.from}
            to={project.accent.to}
            glow={project.accent.glow}
          >
            GitHub 보기
          </AccentButton>
          <Link
            href="/projects"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-900/15 bg-slate-900/5 px-7 text-sm font-semibold text-slate-900 transition-colors duration-200 hover:bg-slate-900/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-500 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
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
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            GitHub ↗
          </a>
          <Link
            href="/projects"
            className="transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            모든 프로젝트 →
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function CoursePickLanding({ project }: { project: Project }) {
  return (
    <div className="overflow-x-clip bg-slate-50 text-slate-900 dark:bg-[#050810] dark:text-white">
      <Hero project={project} />
      <ProblemSection />
      <FeatureSection project={project} />
      <FlowSection />
      <RoadmapSection project={project} />
      <TechSection />
      <FinalCta project={project} />
      <LandingFooter project={project} />
    </div>
  );
}
