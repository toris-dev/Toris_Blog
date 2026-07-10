'use client';

import { useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue
} from 'framer-motion';
import type { Project } from '@/data/projects';
import { BrowserFrame } from './DeviceFrames';
import { AccentButton, CountUp, EASE, GhostButton, Reveal } from './shared';

const ROSE = '#F43F5E';

/* ---------- 인라인 SVG 아이콘 (Feather 스타일) ---------- */
function Ico({
  children,
  className,
  filled = false
}: {
  children: ReactNode;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
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

const paths = {
  train: (
    <>
      <rect x="4" y="3" width="16" height="13" rx="2" />
      <path d="M4 11h16" />
      <path d="M8 19l-2 3M16 19l2 3" />
    </>
  ),
  bed: <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20" />,
  coffee: (
    <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" />
  ),
  won: (
    <>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>
  ),
  pin: (
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  heart: (
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  ),
  check: <polyline points="20 6 9 17 4 12" />,
  star: (
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  ),
  cursor: <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
};

/* ---------- 공통 섹션 헤더 ---------- */
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
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-500 dark:text-rose-400">
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

/* ---------- 히어로 목업: 플래너 폼 ---------- */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-900/10 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-800">
      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function PlannerForm() {
  return (
    <div className="space-y-3 bg-white p-5 dark:bg-slate-900">
      <p className="text-sm font-bold text-slate-900 dark:text-white">
        어떤 여행을 떠날까요?
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="출발" value="서울 홍대입구" />
        <Field label="도착" value="부산 해운대" />
      </div>
      <Field label="날짜" value="3.14 (토) – 3.15 (일)" />
      <div className="rounded-xl border border-slate-900/10 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-slate-800">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-medium text-slate-500 dark:text-slate-400">
            예산
          </span>
          <span className="font-bold text-rose-500 dark:text-rose-400">
            ₩300,000
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="relative h-full w-[62%] rounded-full bg-gradient-to-r from-rose-500 to-rose-400">
            <span className="absolute -right-1 top-[-3px] size-3 rounded-full border-2 border-rose-500 bg-white" />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <span className="rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-600 ring-1 ring-rose-500/40 dark:text-rose-300">
          2명 · 커플
        </span>
        <span className="rounded-full px-3 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-slate-900/10 dark:text-slate-400 dark:ring-white/10">
          친구
        </span>
        <span className="rounded-full px-3 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-slate-900/10 dark:text-slate-400 dark:ring-white/10">
          가족
        </span>
      </div>
      <button
        type="button"
        tabIndex={-1}
        className="w-full cursor-default rounded-xl bg-gradient-to-r from-rose-500 to-rose-400 py-2.5 text-[13px] font-bold text-white"
      >
        코스 만들기
      </button>
    </div>
  );
}

function Hero({ project }: { project: Project }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });
  const blobA = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const blobB = useTransform(scrollYProgress, [0, 1], [0, -110]);

  return (
    <section ref={ref} className="relative overflow-hidden px-6 pb-24 pt-32">
      <motion.div
        style={reduce ? undefined : { y: blobA }}
        className="pointer-events-none absolute -left-28 top-20 size-96 rounded-full bg-rose-400/30 blur-3xl"
      />
      <motion.div
        style={reduce ? undefined : { y: blobB }}
        className="pointer-events-none absolute -right-28 bottom-0 size-[26rem] rounded-full bg-rose-500/20 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[45fr_55fr]">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-500 dark:text-rose-400">
            {project.category} · {project.status}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            여행 계획,{' '}
            <span className="bg-gradient-to-r from-rose-500 to-rose-400 bg-clip-text text-transparent">
              3분
            </span>
            이면 끝
          </h1>
          <p className="mt-6 max-w-md leading-relaxed text-slate-600 dark:text-slate-400">
            출발지·예산·일정만 입력하면 교통편, 숙소, 데이트 코스까지 자동으로
            완성됩니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <AccentButton
              href="#lovetrip-register"
              from={project.accent.from}
              to={project.accent.to}
              glow={project.accent.glow}
            >
              사전 등록하고 먼저 쓰기
            </AccentButton>
            <GhostButton href="#lovetrip-curation">
              코스 미리 둘러보기
            </GhostButton>
          </div>
        </motion.div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
        >
          <BrowserFrame url="lovetrip.app/plan">
            <PlannerForm />
          </BrowserFrame>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- 1. 문제: 흩어지는 탭 카드 ---------- */
const TABS = [
  { icon: paths.train, label: '교통 · KTX 예매', url: 'letskorail.com' },
  { icon: paths.bed, label: '숙소 · 해운대 호텔', url: 'booking.com' },
  { icon: paths.coffee, label: '맛집 · 부산 카페', url: 'map.naver.com' },
  { icon: paths.won, label: '정산 · 계산기', url: 'kakao talk' }
];
const SCATTER = [
  { x: -130, y: -22, r: -6 },
  { x: -44, y: 18, r: 3 },
  { x: 44, y: -16, r: -3 },
  { x: 130, y: 24, r: 6 }
];

function ProblemSection() {
  const reduce = useReducedMotion();
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Problem"
        title="여행 준비, 탭이 몇 개나 열려 있나요?"
        sub="교통 따로, 숙소 따로, 정산은 카톡으로. 계획은 늘 조각나 있습니다."
      />
      <div className="relative mx-auto mt-14 h-52 max-w-3xl overflow-hidden">
        {TABS.map((t, i) => (
          <div
            key={t.label}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <motion.div
              initial={reduce ? false : { x: 0, y: 0, rotate: 0 }}
              whileInView={{
                x: SCATTER[i].x,
                y: SCATTER[i].y,
                rotate: SCATTER[i].r
              }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.8, ease: EASE }}
              className={`${card} w-44 p-3 shadow-lg backdrop-blur`}
              style={{ zIndex: i }}
            >
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-slate-900/5 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  <Ico className="size-3.5">{t.icon}</Ico>
                </span>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  {t.label}
                </p>
              </div>
              <p className="mt-2 truncate text-[10px] text-slate-500 dark:text-slate-500">
                {t.url}
              </p>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- 2. 시그니처 A: 폼 → 지도 스크럽 전환 ---------- */
function MapPin({
  mv,
  label,
  className,
  reduce
}: {
  mv: MotionValue<number>;
  label: string;
  className: string;
  reduce: boolean;
}) {
  return (
    <div className={`absolute -translate-x-1/2 -translate-y-full ${className}`}>
      <motion.div
        style={reduce ? undefined : { scale: mv }}
        className="flex origin-bottom flex-col items-center"
      >
        <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-rose-600 shadow dark:bg-slate-900 dark:text-rose-300">
          {label}
        </span>
        <span className="mt-1 flex size-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg">
          <Ico className="size-3">{paths.pin}</Ico>
        </span>
      </motion.div>
    </div>
  );
}

const PLAN_STEPS = [
  { title: '조건 입력', desc: '출발지·예산·일정만' },
  { title: '자동 생성', desc: '교통+숙소+코스 완성' },
  { title: '함께 편집', desc: '커플이 실시간 협업' }
];

function FormToMapSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end']
  });
  const [stepIdx, setStepIdx] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) =>
    setStepIdx(v >= 0.66 ? 2 : v >= 0.33 ? 1 : 0)
  );
  const activeStep = reduce ? 2 : stepIdx;
  const formOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const formX = useTransform(scrollYProgress, [0, 0.4], [0, -40]);
  const mapOpacity = useTransform(scrollYProgress, [0.3, 0.7], [0, 1]);
  const routeLen = useTransform(scrollYProgress, [0.4, 0.8], [0, 1]);
  const springCfg = { stiffness: 340, damping: 17 };
  const pin1 = useSpring(
    useTransform(scrollYProgress, [0.7, 0.78], [0, 1]),
    springCfg
  );
  const pin2 = useSpring(
    useTransform(scrollYProgress, [0.78, 0.86], [0, 1]),
    springCfg
  );
  const pin3 = useSpring(
    useTransform(scrollYProgress, [0.86, 0.94], [0, 1]),
    springCfg
  );

  return (
    <section ref={ref} className={reduce ? 'relative' : 'relative h-[180vh]'}>
      <div
        className={
          reduce
            ? 'flex items-center px-6 py-24'
            : 'sticky top-0 flex min-h-screen items-center px-6 py-16'
        }
      >
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[45fr_55fr]">
          <div>
            <Head
              align="left"
              eyebrow="Solution"
              title="입력은 한 번, 계획은 완성"
              sub="폼을 채우는 순간 경로·일정·코스가 지도 위에 그려집니다. 스크롤해 보세요."
            />
            <ol className="mt-8 hidden space-y-3 lg:block">
              {PLAN_STEPS.map((s, i) => (
                <li
                  key={s.title}
                  className={`rounded-2xl border px-4 py-3 transition-all duration-300 ${
                    activeStep === i
                      ? 'border-rose-500/60 bg-rose-500/5 opacity-100 dark:bg-rose-500/10'
                      : 'border-slate-900/10 opacity-35 dark:border-white/10'
                  }`}
                >
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {i + 1}. {s.title}
                    <span className="ml-1.5 font-medium text-slate-500 dark:text-slate-400">
                      — {s.desc}
                    </span>
                  </p>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-wrap gap-2 lg:hidden">
              {PLAN_STEPS.map((s, i) => (
                <span
                  key={s.title}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-all duration-300 ${
                    activeStep === i
                      ? 'border-rose-500/60 bg-rose-500/10 text-rose-600 opacity-100 dark:text-rose-300'
                      : 'border-slate-900/10 text-slate-500 opacity-35 dark:border-white/10 dark:text-slate-400'
                  }`}
                >
                  {i + 1}. {s.title}
                </span>
              ))}
            </div>
            <div aria-hidden className="mt-6 flex gap-2">
              {PLAN_STEPS.map((s, i) => (
                <span
                  key={s.title}
                  className={`size-2 rounded-full transition-colors duration-300 ${
                    activeStep >= i
                      ? 'bg-rose-500'
                      : 'bg-slate-300 dark:bg-white/15'
                  }`}
                />
              ))}
            </div>
          </div>
          <BrowserFrame url="lovetrip.app/plan → /course">
            <div className="relative h-[380px] bg-white dark:bg-slate-900">
              <motion.div
                style={
                  reduce ? { opacity: 0 } : { opacity: formOpacity, x: formX }
                }
                className="absolute inset-0"
              >
                <PlannerForm />
              </motion.div>
              <motion.div
                style={{ opacity: reduce ? 1 : mapOpacity }}
                className="absolute inset-0 flex flex-col"
              >
                <div className="relative flex-1 overflow-hidden bg-rose-50 dark:bg-slate-800">
                  <svg
                    viewBox="0 0 220 240"
                    className="absolute inset-0 size-full"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <g
                      className="stroke-slate-300 dark:stroke-slate-600"
                      strokeWidth="1.5"
                      fill="none"
                    >
                      <path d="M0 52 H220" />
                      <path d="M0 128 H220" />
                      <path d="M0 196 H220" />
                      <path d="M48 0 V240" />
                      <path d="M120 0 V240" />
                      <path d="M182 0 V240" />
                    </g>
                    <motion.path
                      d="M58 40 C86 84 82 126 116 150 C136 166 150 182 164 198"
                      fill="none"
                      stroke={ROSE}
                      strokeWidth="3"
                      strokeDasharray="7 7"
                      strokeLinecap="round"
                      style={{ pathLength: reduce ? 1 : routeLen }}
                    />
                  </svg>
                  <MapPin
                    mv={pin1}
                    reduce={!!reduce}
                    label="서울 홍대입구"
                    className="left-[26%] top-[24%]"
                  />
                  <MapPin
                    mv={pin2}
                    reduce={!!reduce}
                    label="경유 · 대전"
                    className="left-[53%] top-[66%]"
                  />
                  <MapPin
                    mv={pin3}
                    reduce={!!reduce}
                    label="부산 해운대"
                    className="left-3/4 top-[90%]"
                  />
                </div>
                <div className="border-t border-slate-900/10 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                  <p className="text-[11px] font-bold text-rose-500 dark:text-rose-400">
                    Day 1
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-700 dark:text-slate-300">
                    10:00 KTX 출발 · 13:00 호텔 체크인 · 15:00 블루라인파크 ·
                    19:00 해운대 야경
                  </p>
                </div>
              </motion.div>
            </div>
          </BrowserFrame>
        </div>
      </div>
    </section>
  );
}

/* ---------- 3. 큐레이션 ---------- */
const SPOTS = [
  {
    name: '연남 로우커피',
    meta: '카페 · 연남동',
    star: '4.8',
    tint: 'from-rose-200 to-amber-100 dark:from-rose-500/40 dark:to-amber-500/20'
  },
  {
    name: '해운대 블루라인파크',
    meta: '액티비티 · 부산',
    star: '4.7',
    tint: 'from-sky-200 to-rose-100 dark:from-sky-500/40 dark:to-rose-500/20'
  },
  {
    name: '부산현대미술관',
    meta: '전시 · 을숙도',
    star: '4.6',
    tint: 'from-slate-200 to-rose-100 dark:from-slate-500/40 dark:to-rose-500/20'
  }
];

function CurationSection() {
  return (
    <section id="lovetrip-curation" className="px-6 py-24">
      <Head
        eyebrow="Curation"
        title="오늘은 어디 갈까?"
        sub="분위기 좋은 카페부터 야경 명소까지, 테마별로 큐레이션된 데이트 코스."
      />
      <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-3">
        {SPOTS.map((s, i) => (
          <Reveal key={s.name} delay={i * 0.08}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: EASE }}
              className={`${card} overflow-hidden shadow-sm`}
            >
              <div className={`relative h-36 bg-gradient-to-br ${s.tint}`}>
                <span className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-white/80 text-rose-500 backdrop-blur dark:bg-slate-900/70 dark:text-rose-400">
                  <Ico className="size-4">{paths.heart}</Ico>
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {s.name}
                  </p>
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                    <Ico className="size-3" filled>
                      {paths.star}
                    </Ico>
                    {s.star}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {s.meta}
                </p>
              </div>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- 4. 시그니처 B: 1/N 정산 카운트업 ---------- */
const RECEIPT = [
  { label: 'KTX 왕복 2인', amount: '₩119,600' },
  { label: '숙소 1박 · 해운대', amount: '₩89,000' },
  { label: '저녁 · 야경 코스', amount: '₩46,400' }
];

function SettleSection() {
  const reduce = useReducedMotion();
  return (
    <section className="px-6 py-24">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <Reveal className="order-2 lg:order-1">
          <div className={`${card} mx-auto max-w-sm p-6 shadow-xl`}>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Receipt · 부산 1박 2일
            </p>
            <ul className="mt-4 space-y-3">
              {RECEIPT.map((r, i) => (
                <motion.li
                  key={r.label}
                  initial={reduce ? false : { opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{
                    delay: 0.2 + i * 0.15,
                    duration: 0.5,
                    ease: EASE
                  }}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-600 dark:text-slate-400">
                    {r.label}
                  </span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                    {r.amount}
                  </span>
                </motion.li>
              ))}
              <motion.li
                initial={reduce ? false : { opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: 0.65, duration: 0.5, ease: EASE }}
                className="flex items-center justify-between border-t border-dashed border-slate-900/15 pt-3 text-sm font-bold text-slate-900 dark:border-white/15 dark:text-white"
              >
                <span>합계</span>
                <span className="tabular-nums">₩255,000</span>
              </motion.li>
            </ul>
            <motion.div
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                delay: 0.9,
                type: 'spring',
                stiffness: 320,
                damping: 16
              }}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-600 ring-1 ring-rose-500/40 dark:text-rose-300"
            >
              <Ico className="size-3.5">{paths.check}</Ico>
              정산 완료
            </motion.div>
          </div>
        </Reveal>
        <div className="order-1 lg:order-2">
          <Head
            align="left"
            eyebrow="1/N Split"
            title="정산은 앱이 합니다"
            sub="지출을 기록하는 순간 자동으로 나눠집니다. 여행이 끝나도 계산기는 필요 없어요."
          />
          <Reveal delay={0.15}>
            <p className="mt-8 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              <CountUp target={127500} prefix="₩" duration={1.2} />
              <span className="ml-2 text-lg font-semibold text-rose-500 dark:text-rose-400">
                / 인
              </span>
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              2명 기준, 총 ₩255,000 자동 분할
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- 5. 협업 ---------- */
function CollabSection() {
  const reduce = useReducedMotion();
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Together"
        title="둘이 같이 만드는 계획"
        sub="상대가 담은 장소에 하트가 실시간으로. 하나의 코스를 함께 완성하세요."
      />
      <Reveal className="mx-auto mt-12 max-w-3xl">
        <div className={`${card} relative h-64 overflow-hidden p-6 shadow-lg`}>
          <div className="flex -space-x-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-400 text-xs font-bold text-white ring-2 ring-white dark:ring-slate-900">
              준
            </span>
            <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-300 text-xs font-bold text-white ring-2 ring-white dark:ring-slate-900">
              지
            </span>
            <span className="ml-4 self-center pl-4 text-xs font-medium text-slate-500 dark:text-slate-400">
              2명이 편집 중
            </span>
          </div>
          <div className="mx-auto mt-8 flex max-w-xs items-center justify-between rounded-xl border border-slate-900/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-800">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                해운대 야경 스팟
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                지수님이 코스에 추가
              </p>
            </div>
            <motion.span
              animate={
                reduce ? undefined : { scale: [0, 1.2, 1], opacity: [0, 1, 1] }
              }
              transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 3.1 }}
              className="text-rose-500 dark:text-rose-400"
            >
              <Ico className="size-5" filled>
                {paths.heart}
              </Ico>
            </motion.span>
          </div>
          <motion.div
            animate={reduce ? undefined : { x: [0, 150, 0], y: [0, 24, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-[14%] top-[52%]"
          >
            <Ico className="size-4 text-rose-500" filled>
              {paths.cursor}
            </Ico>
            <span className="mt-0.5 inline-block rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
              준
            </span>
          </motion.div>
          <motion.div
            animate={reduce ? undefined : { x: [0, -130, 0], y: [0, -18, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2
            }}
            className="absolute right-[16%] top-[74%]"
          >
            <Ico className="size-4 text-amber-500" filled>
              {paths.cursor}
            </Ico>
            <span className="mt-0.5 inline-block rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
              지
            </span>
          </motion.div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- 6. 최종 CTA ---------- */
function FinalCta({ project }: { project: Project }) {
  const reduce = useReducedMotion();
  return (
    <section
      id="lovetrip-register"
      className="relative overflow-hidden px-6 py-28"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/20 blur-3xl" />
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative mx-auto max-w-xl text-center"
      >
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          다음 여행은{' '}
          <span className="bg-gradient-to-r from-rose-500 to-rose-400 bg-clip-text text-transparent">
            love-trip
          </span>
          과
        </h2>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          출시 소식을 가장 먼저 받아보세요. 사전 등록자에게 프리미엄 코스를
          먼저 열어드립니다.
        </p>
        <div className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            placeholder="이메일 주소"
            aria-label="이메일 주소"
            className="h-12 flex-1 rounded-full border border-slate-900/15 bg-white px-5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-rose-500 dark:border-white/15 dark:bg-white/5 dark:text-white"
          />
          <AccentButton
            from={project.accent.from}
            to={project.accent.to}
            glow={project.accent.glow}
          >
            사전 등록
          </AccentButton>
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
            라이브 사이트 ↗
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

export default function LoveTripLanding({ project }: { project: Project }) {
  return (
    <div className="overflow-x-clip bg-slate-50 text-slate-900 dark:bg-[#050810] dark:text-white">
      <Hero project={project} />
      <ProblemSection />
      <FormToMapSection />
      <CurationSection />
      <SettleSection />
      <CollabSection />
      <FinalCta project={project} />
      <LandingFooter project={project} />
    </div>
  );
}
