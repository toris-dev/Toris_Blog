'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform
} from 'framer-motion';
import type { Project } from '@/data/projects';
import { PhoneFrame } from './DeviceFrames';
import { AccentButton, CountUp, EASE, GhostButton, Reveal } from './shared';

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

const paths = {
  eyeOff: (
    <>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  send: (
    <>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </>
  ),
  pin: (
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  )
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
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-400">
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

/* ---------- 채팅 버블 ---------- */
function Bubble({
  from,
  name,
  text
}: {
  from: 'other' | 'me' | 'system';
  name?: string;
  text: string;
}) {
  if (from === 'system') {
    return (
      <p className="py-1 text-center text-[10px] text-slate-400 dark:text-slate-500">
        {text}
      </p>
    );
  }
  if (from === 'me') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[75%] rounded-2xl rounded-br-sm bg-gradient-to-r from-cyan-500 to-cyan-400 px-3 py-2 text-[12px] font-medium text-white">
          {text}
        </p>
      </div>
    );
  }
  return (
    <div className="max-w-[80%]">
      {name && (
        <p className="mb-0.5 text-[9px] font-semibold text-slate-400 dark:text-slate-500">
          {name}
        </p>
      )}
      <p className="rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 text-[12px] text-slate-800 dark:bg-slate-800 dark:text-slate-200">
        {text}
      </p>
    </div>
  );
}

function TypingDots() {
  const reduce = useReducedMotion();
  return (
    <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2.5 dark:bg-slate-800">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={reduce ? undefined : { y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          className="size-1.5 rounded-full bg-slate-400 dark:bg-slate-500"
        />
      ))}
    </div>
  );
}

/* ---------- 500m 펄스 링 ---------- */
function PulseRings({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div
      className={`pointer-events-none absolute flex items-center justify-center ${className ?? ''}`}
      aria-hidden
    >
      {[0, 1, 2].map((i) =>
        reduce ? (
          <span
            key={i}
            className="absolute rounded-full border border-cyan-500/40"
            style={{ width: `${40 + i * 30}%`, height: `${40 + i * 30}%` }}
          />
        ) : (
          <motion.span
            key={i}
            animate={{ scale: [0.3, 1], opacity: [0.5, 0] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              delay: i * 0.8,
              ease: 'easeOut'
            }}
            className="absolute size-full rounded-full border-2 border-cyan-400"
          />
        )
      )}
    </div>
  );
}

/* ---------- 히어로 ---------- */
function HeroPhoneScreen() {
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col bg-white pt-9 dark:bg-slate-950">
      <div className="flex items-center gap-2 border-b border-slate-900/10 px-4 pb-2.5 dark:border-white/10">
        <span className="relative flex size-2">
          {!reduce && (
            <motion.span
              animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-cyan-400"
            />
          )}
          <span className="relative size-2 rounded-full bg-cyan-500" />
        </span>
        <p className="text-[12px] font-bold text-slate-900 dark:text-white">
          홍대입구역
        </p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">
          · 참여 23명
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 overflow-hidden p-3">
        <Bubble
          from="other"
          name="익명·출구9"
          text="2번 출구 버스킹 대박인데??"
        />
        <Bubble
          from="other"
          name="익명·라떼"
          text="9번 출구 쪽 카페 자리 많아요"
        />
        <Bubble
          from="other"
          name="익명·막차"
          text="혹시 지금 2호선 지연인가요"
        />
        <TypingDots />
      </div>
      <div className="flex items-center gap-2 border-t border-slate-900/10 p-3 dark:border-white/10">
        <span className="h-8 flex-1 rounded-full bg-slate-100 px-3 text-[10px] leading-8 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          지금 이 역에 이야기하기…
        </span>
        <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-white">
          <Ico className="size-3.5">{paths.send}</Ico>
        </span>
      </div>
    </div>
  );
}

function Hero({ project }: { project: Project }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  return (
    <section
      ref={ref}
      className="relative overflow-hidden px-6 pb-24 pt-32"
    >
      {/* 도시 그리드 배경 */}
      <div
        className="pointer-events-none absolute inset-0 text-slate-900 opacity-[0.06] dark:text-white"
        style={{
          backgroundImage:
            'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />
      <div className="pointer-events-none absolute -right-24 top-32 size-96 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-400">
            {project.category} · {project.status}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            이 역,{' '}
            <span className="bg-gradient-to-r from-cyan-500 to-cyan-300 bg-clip-text text-transparent">
              지금
            </span>{' '}
            무슨 일?
          </h1>
          <p className="mt-6 max-w-md leading-relaxed text-slate-600 dark:text-slate-400">
            지하철역 반경 500m, 같은 공간에 있는 사람들과 익명으로 나누는
            실시간 대화.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <AccentButton
              href="#loca-register"
              from={project.accent.from}
              to={project.accent.to}
              glow={project.accent.glow}
            >
              사전 등록하기
            </AccentButton>
            <GhostButton href="#loca-stations">내 역 미리 찾기</GhostButton>
          </div>
        </motion.div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
          className="relative mx-auto"
        >
          <motion.div
            style={reduce ? undefined : { y: phoneY }}
            className="relative"
          >
            <PulseRings className="inset-0 -m-16" />
            <PhoneFrame className="relative w-[270px]">
              <HeroPhoneScreen />
            </PhoneFrame>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- 1. 문제: 노선 위 스치는 익명 dot ---------- */
function ProblemSection() {
  const reduce = useReducedMotion();
  const dots = [
    { y: 44, delay: 0, dir: 1, tone: 'fill-slate-400 dark:fill-slate-500' },
    { y: 44, delay: 1.2, dir: -1, tone: 'fill-slate-400 dark:fill-slate-500' },
    { y: 44, delay: 2.4, dir: 1, tone: 'fill-cyan-500' },
    { y: 44, delay: 3.4, dir: -1, tone: 'fill-slate-400 dark:fill-slate-500' },
    { y: 76, delay: 0.6, dir: -1, tone: 'fill-slate-400 dark:fill-slate-500' },
    { y: 76, delay: 1.8, dir: 1, tone: 'fill-slate-400 dark:fill-slate-500' },
    { y: 76, delay: 3, dir: 1, tone: 'fill-cyan-500' },
    { y: 76, delay: 4.2, dir: -1, tone: 'fill-slate-400 dark:fill-slate-500' }
  ];
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Problem"
        title="매일 스치는 사람들, 대화는 0"
        sub="같은 시간, 같은 역. 그런데 아무 연결도 없죠."
      />
      <Reveal className="mx-auto mt-12 max-w-3xl">
        <div className={`${card} overflow-hidden p-6`}>
          <svg viewBox="0 0 400 120" className="w-full" aria-hidden>
            <path
              d="M10 44 H390"
              className="stroke-slate-300 dark:stroke-slate-700"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M10 76 H390"
              className="stroke-slate-300 dark:stroke-slate-700"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {[60, 200, 340].map((x) => (
              <g key={x}>
                <circle
                  cx={x}
                  cy="44"
                  r="7"
                  className="fill-white stroke-slate-400 dark:fill-slate-900 dark:stroke-slate-500"
                  strokeWidth="2.5"
                />
                <circle
                  cx={x}
                  cy="76"
                  r="7"
                  className="fill-white stroke-slate-400 dark:fill-slate-900 dark:stroke-slate-500"
                  strokeWidth="2.5"
                />
              </g>
            ))}
            {dots.map((d, i) => (
              <motion.circle
                key={i}
                cy={d.y}
                cx={d.dir === 1 ? 20 : 380}
                r="5"
                className={d.tone}
                animate={
                  reduce
                    ? undefined
                    : { x: d.dir === 1 ? [0, 360, 0] : [0, -360, 0] }
                }
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: d.delay
                }}
                style={reduce ? { x: 40 + i * 40 } : undefined}
              />
            ))}
          </svg>
          <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            오늘도 홍대입구역에서 스쳐 간 사람 —{' '}
            <span className="font-bold text-cyan-600 dark:text-cyan-400">
              <CountUp target={38200} />명
            </span>
          </p>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- 2. 시그니처 B: 500m 반경 펄스 ---------- */
function RadiusSection() {
  const reduce = useReducedMotion();
  const mapRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: mapRef,
    offset: ['start end', 'center center']
  });
  const radiusScale = useTransform(scrollYProgress, [0, 1], [0.55, 1]);
  const users = [
    { left: '26%', top: '30%' },
    { left: '68%', top: '24%' },
    { left: '76%', top: '58%' },
    { left: '34%', top: '68%' },
    { left: '58%', top: '76%' },
    { left: '20%', top: '50%' }
  ];
  return (
    <section className="px-6 py-24">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <div
            ref={mapRef}
            className={`${card} relative mx-auto aspect-square max-w-sm overflow-hidden shadow-lg`}
          >
            {/* 지도 도로 */}
            <div className="absolute inset-0 bg-cyan-50/60 dark:bg-slate-900">
              <div className="absolute left-1/4 top-0 h-full w-3 -rotate-12 bg-slate-200/80 dark:bg-slate-800" />
              <div className="absolute left-2/3 top-0 h-full w-2 rotate-6 bg-slate-200/80 dark:bg-slate-800" />
              <div className="absolute left-0 top-1/3 h-3 w-full rotate-3 bg-slate-200/80 dark:bg-slate-800" />
              <div className="absolute left-0 top-3/4 h-2 w-full -rotate-6 bg-slate-200/80 dark:bg-slate-800" />
            </div>
            {/* 최대 반경 점선 + 라벨 */}
            <div className="absolute left-1/2 top-1/2 size-[78%] -translate-x-1/2 -translate-y-1/2">
              <motion.div
                style={reduce ? undefined : { scale: radiusScale }}
                className="size-full rounded-full border-2 border-dashed border-cyan-500/50"
              />
            </div>
            <span className="absolute left-1/2 top-[8%] -translate-x-1/2 rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-bold text-white">
              500m
            </span>
            <PulseRings className="left-1/2 top-1/2 size-[78%] -translate-x-1/2 -translate-y-1/2" />
            {/* 역 심볼 */}
            <span className="absolute left-1/2 top-1/2 z-10 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg ring-4 ring-white dark:ring-slate-950">
              <Ico className="size-4">{paths.pin}</Ico>
            </span>
            {/* 유저 dot */}
            {users.map((u, i) => (
              <motion.span
                key={i}
                animate={reduce ? undefined : { opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                className="absolute size-2.5 rounded-full bg-cyan-500 ring-2 ring-white dark:ring-slate-950"
                style={{ left: u.left, top: u.top }}
              />
            ))}
          </div>
        </Reveal>
        <div>
          <Head
            align="left"
            eyebrow="Hyperlocal"
            title="딱 500m, 지금 여기의 이야기"
            sub="범위가 좁을수록 이야기는 진해집니다. 역을 중심으로 한 반경 500m — 지금 같은 공간에 있는 사람들만 입장할 수 있어요."
          />
          <ul className="mt-8 space-y-3">
            {[
              'GPS 기반 자동 입장 · 퇴장',
              '역마다 열리는 단 하나의 라운지',
              '지금 이 순간의 이야기만'
            ].map((t, i) => (
              <Reveal key={t} delay={0.1 + i * 0.08} y={16}>
                <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <span className="size-1.5 rounded-full bg-cyan-500" />
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

/* ---------- 3. 시그니처 A: 채팅 버블 순차 등장 ---------- */
const CHAT: {
  from: 'other' | 'me' | 'system';
  name?: string;
  text: string;
}[] = [
  { from: 'other', name: '익명·출구9', text: '지금 개찰구 앞 붕어빵 트럭 왔어요' },
  { from: 'other', name: '익명·라떼', text: '실화냐 몇 번 출구요' },
  { from: 'other', name: '익명·막차', text: '3번이요 줄 벌써 김' },
  { from: 'me', text: '가는 중ㅋㅋ' },
  { from: 'system', text: '익명·붕어빵 님이 입장했습니다' }
];

function LiveChatSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();
  const [count, setCount] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setCount(CHAT.length);
      return;
    }
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const step = (i: number) => {
      if (cancelled || i >= CHAT.length) return;
      if (CHAT[i].from === 'other') setTyping(true);
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          setTyping(false);
          setCount(i + 1);
          timers.push(setTimeout(() => step(i + 1), 300));
        }, 800)
      );
    };
    step(0);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduce]);

  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Live"
        title="대화는 이렇게 흘러갑니다"
        sub="붕어빵 트럭 하나로 역 전체가 들썩이는 곳. 그게 Loca입니다."
      />
      <div ref={ref} className="mt-12 flex justify-center">
        <PhoneFrame className="w-[280px]">
          <div className="flex h-full flex-col bg-white pt-9 dark:bg-slate-950">
            <div className="flex items-center gap-2 border-b border-slate-900/10 px-4 pb-2.5 dark:border-white/10">
              <span className="size-2 rounded-full bg-cyan-500" />
              <p className="text-[12px] font-bold text-slate-900 dark:text-white">
                홍대입구역
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                · 참여 24명
              </p>
            </div>
            <div className="flex flex-1 flex-col justify-end gap-2.5 overflow-hidden p-3 pb-4">
              {CHAT.slice(0, count).map((m, i) => (
                <motion.div
                  key={i}
                  initial={
                    reduce ? false : { opacity: 0, y: 12, scale: 0.9 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Bubble from={m.from} name={m.name} text={m.text} />
                </motion.div>
              ))}
              <AnimatePresence>
                {typing && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TypingDots />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-2 border-t border-slate-900/10 p-3 dark:border-white/10">
              <span className="h-8 flex-1 rounded-full bg-slate-100 px-3 text-[10px] leading-8 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                메시지 보내기…
              </span>
              <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-white">
                <Ico className="size-3.5">{paths.send}</Ico>
              </span>
            </div>
          </div>
        </PhoneFrame>
      </div>
    </section>
  );
}

/* ---------- 4. 익명성 ---------- */
const SAFETY = [
  { icon: paths.eyeOff, title: '실명 · 프로필 불필요', desc: '닉네임도 사진도 없이. 오늘의 익명 이름으로 가볍게 참여하세요.' },
  { icon: paths.shield, title: '역을 벗어나면 자동 퇴장', desc: '반경 500m를 벗어나는 순간 대화방에서 조용히 나가집니다.' },
  { icon: paths.clock, title: '대화는 24시간 후 소멸', desc: '기록이 남지 않는 대화. 지금 이 순간에만 존재합니다.' }
];

function SafetySection() {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Anonymous"
        title="부담 없이, 익명으로"
        sub="연결은 가볍게, 흔적은 남기지 않게. Loca의 세 가지 원칙."
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
        {SAFETY.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.1}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: EASE }}
              className={`${card} h-full p-6 shadow-sm`}
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                <Ico className="size-5">{s.icon}</Ico>
              </span>
              <p className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                {s.title}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {s.desc}
              </p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- 5. 어디서나: 역 칩 ---------- */
const STATIONS = [
  { name: '강남', n: 412 },
  { name: '홍대입구', n: 289 },
  { name: '성수', n: 175 },
  { name: '잠실', n: 143 },
  { name: '여의도', n: 128 },
  { name: '건대입구', n: 117 },
  { name: '신촌', n: 98 },
  { name: '서울역', n: 95 },
  { name: '판교', n: 86 },
  { name: '합정', n: 74 },
  { name: '이태원', n: 63 },
  { name: '노량진', n: 51 }
];

function StationsSection() {
  const reduce = useReducedMotion();
  return (
    <section id="loca-stations" className="px-6 py-24">
      <Head
        eyebrow="Everywhere"
        title="당신의 역은 이미 열려 있어요"
        sub="지금 이 순간에도 역마다 대화가 흐르고 있습니다."
      />
      <div className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-3">
        {STATIONS.map((s, i) => (
          <motion.button
            key={s.name}
            type="button"
            initial={reduce ? false : { opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            whileHover={{ y: -3 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
            className="flex cursor-pointer items-baseline gap-2 rounded-full border border-slate-900/10 bg-white/70 px-4 py-2 transition-colors hover:border-cyan-500/60 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-cyan-400/60"
          >
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {s.name}
            </span>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
              <CountUp target={s.n} duration={1} />명
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

/* ---------- 6. 최종 CTA ---------- */
function FinalCta({ project }: { project: Project }) {
  const reduce = useReducedMotion();
  return (
    <section
      id="loca-register"
      className="relative overflow-hidden px-6 py-28"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/15 blur-3xl" />
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative mx-auto max-w-xl text-center"
      >
        <div className="relative mx-auto size-12">
          <PulseRings className="inset-0 -m-4" />
          <span className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-400 text-white shadow-lg">
            <Ico className="size-6">{paths.pin}</Ico>
          </span>
        </div>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          다음 출근길,{' '}
          <span className="bg-gradient-to-r from-cyan-500 to-cyan-300 bg-clip-text text-transparent">
            대화
          </span>
          가 기다립니다
        </h2>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          출시와 동시에 당신의 역이 열립니다. 가장 먼저 입장해 보세요.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <AccentButton
            from={project.accent.from}
            to={project.accent.to}
            glow={project.accent.glow}
          >
            사전 등록하기
          </AccentButton>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            iOS · Android · Flutter 크로스플랫폼
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

export default function LocaLanding({ project }: { project: Project }) {
  return (
    <div className="overflow-x-clip bg-slate-50 text-slate-900 dark:bg-[#050810] dark:text-white">
      <Hero project={project} />
      <ProblemSection />
      <RadiusSection />
      <LiveChatSection />
      <SafetySection />
      <StationsSection />
      <FinalCta project={project} />
      <LandingFooter project={project} />
    </div>
  );
}
