'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue
} from 'framer-motion';
import type { Project } from '@/data/projects';
import { PhoneFrame } from './DeviceFrames';
import { AccentButton, CountUp, EASE, GhostButton, Reveal } from './shared';

/* ---------- 인라인 SVG 아이콘 ---------- */
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
  book: (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  heart: (
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  ),
  message: (
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  ),
  flame: (
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3 2.24.5 5 2.5 5 6a5 5 0 1 1-10 0c0-2.3 1.5-4.05 3-5.5.5 1.5.5 3 .5 5z" />
  ),
  crown: <path d="M2 18h20l-2-9-5 4-3-7-3 7-5-4z" />,
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />
};

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
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
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
const goldPill =
  'rounded-full bg-gradient-to-r from-amber-600 to-amber-400 px-2.5 py-0.5 text-[10px] font-bold text-white';

/* ---------- 리더 화면 ---------- */
function ReaderScreen({ showSheet = false }: { showSheet?: boolean }) {
  return (
    <div className="relative flex h-full flex-col bg-amber-50/40 pt-9 dark:bg-slate-950">
      <div className="border-b border-slate-900/10 px-4 pb-2.5 dark:border-white/10">
        <p className="text-[13px] font-bold text-slate-900 dark:text-white">
          요한복음 3장
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1 flex-1 rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-amber-600 to-amber-400" />
          </div>
          <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
            오늘의 읽기 2/3장
          </p>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-hidden p-4 font-serif text-[12px] leading-relaxed text-slate-800 dark:text-slate-200">
        <p>
          <sup className="mr-1 text-[9px] font-bold text-amber-600 dark:text-amber-400">
            14
          </sup>
          모세가 광야에서 뱀을 든 것 같이 인자도 들려야 하리니
        </p>
        <p>
          <sup className="mr-1 text-[9px] font-bold text-amber-600 dark:text-amber-400">
            15
          </sup>
          이는 저를 믿는 자마다 영생을 얻게 하려 하심이니라
        </p>
        <p className="rounded-md bg-amber-200/60 p-1.5 dark:bg-amber-500/25">
          <sup className="mr-1 text-[9px] font-bold text-amber-600 dark:text-amber-400">
            16
          </sup>
          하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 저를 믿는
          자마다 멸망치 않고 영생을 얻게 하려 하심이니라
        </p>
      </div>
      <span className="absolute bottom-4 right-4 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 px-3 py-2 text-[11px] font-bold text-white shadow-lg">
        +200P 받기
      </span>
      {showSheet && (
        <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-slate-900/10 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-slate-900">
          <p className="text-[11px] font-bold text-slate-900 dark:text-white">
            폰트 설정
          </p>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
            <span>가</span>
            <div className="h-1 flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="relative h-full w-1/2 rounded-full bg-amber-500">
                <span className="absolute -right-1 top-[-4px] size-3 rounded-full border-2 border-amber-500 bg-white" />
              </div>
            </div>
            <span className="text-[14px]">가</span>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="rounded-full bg-amber-500/15 px-3 py-1 font-serif text-[10px] font-semibold text-amber-700 ring-1 ring-amber-500/40 dark:text-amber-300">
              명조
            </span>
            <span className="rounded-full px-3 py-1 text-[10px] font-medium text-slate-500 ring-1 ring-slate-900/10 dark:text-slate-400 dark:ring-white/10">
              고딕
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 히어로 ---------- */
const FLOATS = [
  { label: '7일 연속', icon: paths.flame, pos: '-left-6 top-16', dur: 5 },
  { label: '+200P', icon: null, pos: '-right-8 top-40', dur: 6 },
  { label: 'Lv.12 Disciple', icon: paths.crown, pos: '-left-10 bottom-24', dur: 7 }
];

function Hero({ project }: { project: Project }) {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-32">
      <div className="pointer-events-none absolute -left-24 top-24 size-96 rounded-full bg-amber-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full bg-yellow-400/15 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
            {project.category} · {project.status}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            말씀이{' '}
            <span className="bg-gradient-to-r from-amber-600 to-yellow-400 bg-clip-text text-transparent">
              습관
            </span>
            이 되도록
          </h1>
          <p className="mt-6 max-w-md leading-relaxed text-slate-600 dark:text-slate-400">
            읽고, 나누고, 함께 자라는 성경 앱. 오늘의 한 장이 포인트가 되고,
            포인트가 꾸준함이 됩니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <AccentButton
              href="#bb-register"
              from={project.accent.from}
              to={project.accent.to}
              glow={project.accent.glow}
            >
              출시 알림 신청
            </AccentButton>
            <GhostButton href="#bb-growth">성장 시스템 보기</GhostButton>
          </div>
        </motion.div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
          className="relative mx-auto w-fit"
        >
          <PhoneFrame className="w-[270px]">
            <ReaderScreen />
          </PhoneFrame>
          {FLOATS.map((f) => (
            <motion.div
              key={f.label}
              animate={reduce ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: f.dur, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute ${f.pos} flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-white px-3 py-1.5 text-[11px] font-bold text-amber-700 shadow-lg dark:bg-slate-900 dark:text-amber-300`}
            >
              {f.icon && (
                <Ico className="size-3.5 text-amber-500">{f.icon}</Ico>
              )}
              {f.label}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- 1. 문제: 작심삼일 체크리스트 ---------- */
const PLAN_ROWS = [
  { date: '1월 1일', range: '창세기 1–3장', done: true },
  { date: '1월 2일', range: '창세기 4–6장', done: true },
  { date: '1월 3일', range: '창세기 7–9장', done: false },
  { date: '1월 4일', range: '창세기 10–12장', done: false }
];

function ProblemSection() {
  const reduce = useReducedMotion();
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Problem"
        title="작심삼일, 성경 읽기의 최대 난관"
        sub="3일째부터 멈춘 계획표, 익숙하시죠? 의지가 아니라 시스템이 필요합니다."
      />
      <Reveal className="mx-auto mt-12 max-w-md">
        <div className={`${card} divide-y divide-slate-900/5 p-2 shadow-sm dark:divide-white/5`}>
          {PLAN_ROWS.map((r, i) => (
            <div key={r.date} className="flex items-center gap-3 p-3">
              <span
                className={`flex size-6 items-center justify-center rounded-full border-2 ${
                  r.done
                    ? 'border-amber-500 text-amber-500'
                    : 'border-slate-300 text-slate-300 dark:border-slate-700 dark:text-slate-600'
                }`}
              >
                {r.done ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-3.5"
                    aria-hidden
                  >
                    <motion.path
                      d="M20 6 9 17l-5-5"
                      initial={reduce ? false : { pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ delay: 0.3 + i * 0.3, duration: 0.4 }}
                    />
                  </svg>
                ) : (
                  <span className="text-xs font-bold">–</span>
                )}
              </span>
              <div className="flex-1">
                <p
                  className={`text-sm font-semibold ${
                    r.done
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {r.range}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {r.date}
                </p>
              </div>
              {!r.done && (
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  미완료
                </span>
              )}
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- 2. 읽기 경험 ---------- */
function ReadingSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <PhoneFrame className="w-[260px]">
            <ReaderScreen showSheet />
          </PhoneFrame>
        </Reveal>
        <div>
          <Head
            align="left"
            eyebrow="Reader"
            title="읽기에만 집중되는 화면"
            sub="개역한글 본문, 세리프 서체, 골드 하이라이트. 폰트 크기부터 색상까지 나에게 맞는 읽기 환경을 만들 수 있습니다."
          />
          <ul className="mt-8 space-y-3">
            {[
              '구절 하이라이트 & 북마크',
              '폰트 크기 · 종류 · 색상 조절',
              '읽은 만큼 채워지는 진행바'
            ].map((t, i) => (
              <Reveal key={t} delay={0.1 + i * 0.08} y={16}>
                <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <span className="flex size-5 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <Ico className="size-3">{paths.check}</Ico>
                  </span>
                  {t}
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- 3. 시그니처 A: 레벨 프로그레스 & 뱃지 해금 스크럽 ---------- */
const CIRC = 2 * Math.PI * 54;

function Particle({
  p,
  angle,
  reduce
}: {
  p: MotionValue<number>;
  angle: number;
  reduce: boolean;
}) {
  const x = useTransform(p, [0.7, 0.85], [0, Math.cos(angle) * 58]);
  const y = useTransform(p, [0.7, 0.85], [0, Math.sin(angle) * 58]);
  const opacity = useTransform(p, [0.7, 0.74, 0.85], [0, 1, 0]);
  if (reduce) return null;
  return (
    <motion.span
      style={{ x, y, opacity }}
      className="absolute left-1/2 top-1/2 ml-[-3px] mt-[-3px] size-1.5 rounded-full bg-amber-400"
    />
  );
}

function UnlockBadge({
  p,
  at,
  icon,
  label,
  reduce
}: {
  p: MotionValue<number>;
  at: number;
  icon: ReactNode;
  label: string;
  reduce: boolean;
}) {
  const raw = useTransform(p, [at, at + 0.05], [0, 1]);
  const scale = useSpring(raw, { stiffness: 300, damping: 14 });
  const lockOpacity = useTransform(raw, [0, 1], [1, 0]);
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-900/10 bg-slate-50 p-2.5 dark:border-white/10 dark:bg-slate-900">
      <div className="relative">
        <motion.span
          style={reduce ? undefined : { scale }}
          className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-400 text-white"
        >
          <Ico className="size-4">{icon}</Ico>
        </motion.span>
        <motion.span
          style={{ opacity: reduce ? 0 : lockOpacity }}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
        >
          <Ico className="size-4">{paths.lock}</Ico>
        </motion.span>
      </div>
      <p className="text-[9px] font-semibold text-slate-600 dark:text-slate-400">
        {label}
      </p>
    </div>
  );
}

/* 시그니처 B: 포인트 카운터 (11,950 → 12,450 + 플로팅 +500P) */
function PointCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(11950);
  const [floatUp, setFloatUp] = useState(false);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setVal(12450);
      return;
    }
    setFloatUp(true);
    const controls = animate(11950, 12450, {
      duration: 1.4,
      ease: 'easeOut',
      onUpdate: (v) => setVal(Math.round(v))
    });
    return () => controls.stop();
  }, [inView, reduce]);

  return (
    <div ref={ref} className="relative text-right">
      <p className="text-[15px] font-extrabold tabular-nums text-amber-600 dark:text-amber-400">
        {val.toLocaleString()} P
      </p>
      {floatUp && (
        <motion.span
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], y: -24 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          className="absolute right-0 top-0 text-[11px] font-bold text-amber-500"
        >
          +500P
        </motion.span>
      )}
    </div>
  );
}

function GrowthSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end']
  });
  const p = scrollYProgress;
  const dashOffset = useTransform(p, [0.1, 0.7], [CIRC, 0]);
  const lv11Opacity = useTransform(p, [0.68, 0.7], [1, 0]);
  const lv11Rx = useTransform(p, [0.6, 0.7], [0, 90]);
  const lv12Opacity = useTransform(p, [0.7, 0.72], [0, 1]);
  const lv12Rx = useTransform(p, [0.7, 0.78], [-90, 0]);

  return (
    <section
      id="bb-growth"
      ref={ref}
      className={reduce ? 'relative' : 'relative h-[220vh]'}
    >
      <div
        className={
          reduce
            ? 'px-6 py-24'
            : 'sticky top-0 flex min-h-screen flex-col items-center justify-center px-6 py-16'
        }
      >
        <Head
          eyebrow="Growth"
          title="읽을수록 자라는 나"
          sub="한 장을 읽을 때마다 링이 차오르고, 레벨이 오르고, 뱃지가 열립니다."
        />
        <div className="mt-10">
          <PhoneFrame className="w-[280px]">
            <div className="flex h-full flex-col bg-amber-50/40 pt-10 dark:bg-slate-950">
              {/* 프로필 헤더 */}
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-400 text-[12px] font-bold text-white">
                    은
                  </span>
                  <div>
                    <p className="text-[12px] font-bold text-slate-900 dark:text-white">
                      은혜
                    </p>
                    <span className={goldPill}>Lv.12 Disciple</span>
                  </div>
                </div>
                <PointCounter />
              </div>
              {/* 원형 프로그레스 링 + 레벨 플립 + 파티클 */}
              <div className="relative mx-auto mt-4">
                <svg width="150" height="150" viewBox="0 0 150 150" aria-hidden>
                  <circle
                    cx="75"
                    cy="75"
                    r="54"
                    fill="none"
                    strokeWidth="9"
                    className="stroke-slate-200 dark:stroke-slate-800"
                  />
                  <motion.circle
                    cx="75"
                    cy="75"
                    r="54"
                    fill="none"
                    stroke="url(#bbGold)"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    style={{ strokeDashoffset: reduce ? 0 : dashOffset }}
                    transform="rotate(-90 75 75)"
                  />
                  <defs>
                    <linearGradient id="bbGold" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#D97706" />
                      <stop offset="100%" stopColor="#FBBF24" />
                    </linearGradient>
                  </defs>
                </svg>
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ perspective: 600 }}
                >
                  <motion.p
                    style={
                      reduce
                        ? { opacity: 0 }
                        : { opacity: lv11Opacity, rotateX: lv11Rx }
                    }
                    className="absolute text-2xl font-extrabold text-slate-900 dark:text-white"
                  >
                    Lv.11
                  </motion.p>
                  <motion.p
                    style={
                      reduce
                        ? undefined
                        : { opacity: lv12Opacity, rotateX: lv12Rx }
                    }
                    className="absolute text-2xl font-extrabold text-amber-600 dark:text-amber-400"
                  >
                    Lv.12
                  </motion.p>
                </div>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Particle
                    key={i}
                    p={p}
                    angle={(i * Math.PI) / 3}
                    reduce={!!reduce}
                  />
                ))}
              </div>
              <p className="text-center text-[10px] font-medium text-slate-500 dark:text-slate-400">
                다음 레벨까지 550P
              </p>
              {/* 뱃지 해금 */}
              <div className="mt-3 grid grid-cols-3 gap-2 px-4">
                <UnlockBadge
                  p={p}
                  at={0.75}
                  icon={paths.book}
                  label="성실한 독자"
                  reduce={!!reduce}
                />
                <UnlockBadge
                  p={p}
                  at={0.85}
                  icon={paths.message}
                  label="나눔이"
                  reduce={!!reduce}
                />
                <UnlockBadge
                  p={p}
                  at={0.95}
                  icon={paths.flame}
                  label="7일 연속"
                  reduce={!!reduce}
                />
              </div>
              {/* 스트릭 */}
              <div className="mx-4 mt-3 rounded-xl border border-slate-900/10 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    연속 7일
                  </p>
                  <Ico className="size-3.5 text-amber-500">{paths.flame}</Ico>
                </div>
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <span
                      key={i}
                      className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-amber-600 to-amber-400"
                    />
                  ))}
                </div>
              </div>
            </div>
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}

/* ---------- 4. 포인트 규칙 ---------- */
const RULES = [
  { icon: paths.book, points: 200, label: '한 장 읽기', desc: '오늘의 본문을 끝까지 읽으면' },
  { icon: paths.heart, points: 100, label: '좋아요', desc: '나눔 글에 마음을 표현하면' },
  { icon: paths.message, points: 300, label: '댓글 · 나눔', desc: '묵상을 글로 나누면' }
];

function RulesSection() {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Points"
        title="모든 행동이 포인트"
        sub="읽기, 좋아요, 나눔. 말씀과 함께한 모든 순간이 성장으로 쌓입니다."
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
        {RULES.map((r, i) => (
          <Reveal key={r.label} delay={i * 0.12}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: EASE }}
              className={`${card} h-full p-6 text-center shadow-sm`}
            >
              <span className="mx-auto flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Ico className="size-5">{r.icon}</Ico>
              </span>
              <p className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
                <CountUp target={r.points} prefix="+" duration={1} />
                <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                  P
                </span>
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                {r.label}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {r.desc}
              </p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- 5. 커뮤니티 ---------- */
const FEED = [
  {
    tag: 'QT나눔',
    author: '은혜님',
    level: 'Lv.23',
    body: '오늘 시편 23편에서 “내 잔이 넘치나이다”라는 구절이 유독 마음에 남았어요. 부족함 속에서도…',
    likes: 41,
    comments: 12
  },
  {
    tag: '찬양추천',
    author: '다윗님',
    level: 'Lv.8',
    body: '새벽 묵상하며 들은 찬양 하나 나눠요. 가사가 오늘 본문이랑 딱 맞닿아 있어서 소름…',
    likes: 18,
    comments: 5
  }
];

function CommunitySection() {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Community"
        title="혼자 읽지 않도록"
        sub="QT 나눔, 찬양 추천, 성경 질문. 같은 본문을 읽는 사람들의 온기."
      />
      <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
        {FEED.map((f, i) => (
          <Reveal key={f.tag} delay={i * 0.12}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25, ease: EASE }}
              className={`${card} flex h-full flex-col p-5 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  {f.tag}
                </span>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  {f.author}
                </p>
                <span className={goldPill}>{f.level}</span>
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {f.body}
              </p>
              <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Ico className="size-3.5 text-amber-500">{paths.heart}</Ico>
                  좋아요 {f.likes}
                </span>
                <span className="flex items-center gap-1">
                  <Ico className="size-3.5">{paths.message}</Ico>
                  댓글 {f.comments}
                </span>
              </div>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- 6. 그룹 랭킹 ---------- */
const RANKS = [
  { rank: 1, name: '사랑교회 청년부', streak: 21 },
  { rank: 2, name: '은혜셀', streak: 18 },
  { rank: 3, name: '새벽기도팀', streak: 15 }
];

function RankingSection() {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Group race"
        title="우리 교회, 함께 달리기"
        sub="그룹 연속 읽기 랭킹. 혼자면 사흘, 함께면 삼 주."
      />
      <div className="mx-auto mt-12 flex max-w-lg flex-col gap-3">
        {RANKS.map((r, i) => (
          <Reveal key={r.name} delay={i * 0.1}>
            <div
              className={`flex items-center gap-4 rounded-2xl border p-4 shadow-sm ${
                r.rank === 1
                  ? 'border-amber-500/40 bg-amber-500/10 dark:border-amber-400/30 dark:bg-amber-500/10'
                  : 'border-slate-900/10 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]'
              }`}
            >
              <span
                className={`flex size-8 items-center justify-center rounded-full text-sm font-extrabold ${
                  r.rank === 1
                    ? 'bg-gradient-to-br from-amber-600 to-amber-400 text-white'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {r.rank}
              </span>
              <div className="flex-1">
                <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                  {r.name}
                  {r.rank === 1 && (
                    <Ico className="size-4 text-amber-500">{paths.crown}</Ico>
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  연속 {r.streak}일 읽는 중
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Ico className="size-3.5">{paths.flame}</Ico>
                {r.streak}일
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- 7. 최종 CTA ---------- */
function FinalCta({ project }: { project: Project }) {
  const reduce = useReducedMotion();
  return (
    <section id="bb-register" className="relative overflow-hidden px-6 py-28">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(217,119,6,0.22), transparent 70%)'
        }}
      />
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative mx-auto max-w-xl text-center"
      >
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600 to-amber-400 text-white shadow-lg">
          <Ico className="size-6">{paths.book}</Ico>
        </span>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          오늘{' '}
          <span className="bg-gradient-to-r from-amber-600 to-yellow-400 bg-clip-text text-transparent">
            한 장
          </span>
          부터 시작하세요
        </h2>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          출시 알림을 신청하면 첫 읽기 계획을 함께 만들어 드립니다.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <AccentButton
            from={project.accent.from}
            to={project.accent.to}
            glow={project.accent.glow}
          >
            출시 알림 신청
          </AccentButton>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            개역한글 · iOS · Android
          </p>
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
            GitHub
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

export default function BubbleBibleLanding({ project }: { project: Project }) {
  return (
    <div className="overflow-x-clip bg-slate-50 text-slate-900 dark:bg-[#050810] dark:text-white">
      <Hero project={project} />
      <ProblemSection />
      <ReadingSection />
      <GrowthSection />
      <RulesSection />
      <CommunitySection />
      <RankingSection />
      <FinalCta project={project} />
      <LandingFooter project={project} />
    </div>
  );
}
