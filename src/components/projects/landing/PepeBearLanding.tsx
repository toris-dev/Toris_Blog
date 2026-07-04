'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { FiAward } from '@react-icons/all-files/fi/FiAward';
import { FiTrendingUp } from '@react-icons/all-files/fi/FiTrendingUp';
import { FiZap } from '@react-icons/all-files/fi/FiZap';
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform
} from 'framer-motion';

import type { Project } from '@/data/projects';
import { BrowserFrame } from './DeviceFrames';
import { AccentButton, EASE, GhostButton, Reveal } from './shared';

const CARD =
  'rounded-2xl bg-emerald-50/60 p-6 ring-1 ring-emerald-900/10 dark:bg-slate-900/60 dark:ring-white/10';
const OVERLINE =
  'text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400';
const GRAD = 'bg-gradient-to-r from-emerald-500 to-lime-400';
const ACCENT_TEXT = 'text-emerald-600 dark:text-emerald-400';
const ONCE = { once: true, amount: 0.5 } as const;

const CANDLES = [38, 52, 44, 66, 58, 74, 62, 82, 70, 92, 78, 96, 84, 72, 88, 64, 76, 94, 86, 98];

const STATS = [
  { label: '홀더', base: 12847, step: 1, fmt: (n: number) => n.toLocaleString() }, { label: '24h 볼륨', base: 1200000, step: 1000, fmt: (n: number) => `$${(n / 1e6).toFixed(2)}M` }, { label: '업적 해금', base: 38412, step: 1, fmt: (n: number) => n.toLocaleString() }
];

const START_ROWS = [
  { id: 'whale.sol', score: 2410000 }, { id: 'bearmaxi', score: 1870000 },
  { id: 'moonboy_', score: 942000 }, { id: 'hodlqueen', score: 618000 },
  { id: 'anon4821', score: 337000 }
];
const fmtScore = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : `${Math.round(n / 1e3)}K`);

const PHASES = [
  { pos: '15%', label: 'Launch', caption: '공정 런칭 · LP 소각' }, { pos: '50%', label: 'Growth', caption: '홀더 10K · CEX 논의' }, { pos: '85%', label: 'Moon', caption: '생태계 확장' }
];

function RocketIcon() {
  return (
    <svg aria-hidden width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function LiveStat({ stat, reduce }: { stat: (typeof STATS)[number]; reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const [val, setVal] = useState(reduce ? stat.base : 0);
  const [settled, setSettled] = useState(reduce);
  useEffect(() => {
    if (!inView || settled) return;
    if (reduce) {
      setVal(stat.base); setSettled(true); return;
    }
    const controls = animate(0, stat.base, {
      duration: 1.4,
      ease: EASE,
      onUpdate: (v) => setVal(Math.round(v)),
      onComplete: () => setSettled(true)
    });
    return () => controls.stop();
  }, [inView, settled, reduce, stat.base]);
  useEffect(() => {
    if (!inView || !settled || reduce) return;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      t = setTimeout(() => {
        setVal((v) => v + Math.ceil(Math.random() * 12) * stat.step);
        tick();
      }, 8000 + Math.random() * 7000);
    };
    tick();
    return () => clearTimeout(t);
  }, [inView, settled, reduce, stat.step]);
  return (
    <div ref={ref} className="rounded-2xl bg-white/70 px-5 py-4 ring-1 ring-emerald-900/10 backdrop-blur dark:bg-white/5 dark:ring-white/10">
      <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
      <p className="mt-1 overflow-hidden text-2xl font-bold tabular-nums">
        <motion.span
          key={settled ? val : 'counting'} className="inline-block"
          initial={settled && !reduce ? { y: 10, opacity: 0.3 } : false}
          animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3, ease: EASE }}
        >
          {stat.fmt(val)}
        </motion.span>
      </p>
    </div>
  );
}

function Hero({ project, reduce }: { project: Project; reduce: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const chartY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: EASE }
  });
  return (
    <section ref={ref} className="relative overflow-hidden px-6 pb-24 pt-16">
      <motion.div aria-hidden style={reduce ? undefined : { y: chartY }} className="pointer-events-none absolute inset-x-0 bottom-0 opacity-5">
        <svg viewBox="0 0 800 240" className="h-64 w-full text-emerald-500" preserveAspectRatio="none">
          {CANDLES.map((h, i) => (
            <g key={i} fill="currentColor">
              <rect x={i * 40 + 14} y={240 - h * 2.2} width="12" height={h * 1.4} />
              <rect x={i * 40 + 19} y={240 - h * 2.2 - 24} width="2" height={h * 1.4 + 48} />
            </g>
          ))}
        </svg>
      </motion.div>
      <div className="relative mx-auto max-w-4xl text-center">
        <h1 className="text-5xl font-black tracking-tight sm:text-7xl md:text-8xl">
          {['HODL.', 'LAUGH.', 'MOON.'].map((w, i) => (
            <motion.span
              key={w}
              initial={reduce ? false : { opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, delay: i * 0.12, ease: EASE }}
              className={`mx-2 inline-block ${w === 'MOON.' ? `${GRAD} bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(132,204,22,0.45)]` : ''}`}
            >
              {w}
            </motion.span>
          ))}
        </h1>
        <motion.p {...rise(0.4)} className="mx-auto mt-6 max-w-xl text-slate-600 dark:text-slate-300">
          포인트 얻고, 업적 깨고, 레벨업하는 게임화된 Solana 밈코인 커뮤니티.
        </motion.p>
        <motion.div {...rise(0.5)} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <span className="relative inline-flex">
            {!reduce && (
              <motion.span
                aria-hidden className="pointer-events-none absolute inset-0 rounded-full border-2 border-emerald-400"
                animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
            <AccentButton href="https://pump.fun" from={project.accent.from} to={project.accent.to} glow={project.accent.glow}>
              $PEPEBEAR 받으러 가기
            </AccentButton>
          </span>
          <GhostButton href="#leaderboard">$PEPEBEAR 차트 보기</GhostButton>
        </motion.div>
        <motion.div {...rise(0.6)} className="mx-auto mt-12 max-w-2xl">
          <p className={`mb-3 flex items-center justify-center gap-2 text-xs font-semibold ${ACCENT_TEXT}`}>
            <motion.span
              aria-hidden className="size-2 rounded-full bg-emerald-500"
              animate={reduce ? undefined : { opacity: [1, 0.3, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
            />
            LIVE
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STATS.map((s) => (
              <LiveStat key={s.label} stat={s} reduce={reduce} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ProblemSection({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const grayScale = useTransform(scrollYProgress, [0.2, 0.6], [1, 0.92]);
  const grayOpacity = useTransform(scrollYProgress, [0.2, 0.6], [1, 0.55]);
  const colorY = useTransform(scrollYProgress, [0.2, 0.6], [48, 0]);
  const colorScale = useTransform(scrollYProgress, [0.2, 0.6], [0.96, 1.02]);
  return (
    <section ref={ref} className="border-y border-emerald-900/10 bg-white/60 px-6 py-28 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className={OVERLINE}>Problem</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">차트만 보는 홀딩은 지루하다</h2>
        </Reveal>
        <div className="mt-12 grid items-center gap-8 md:grid-cols-2">
          <motion.div
            style={reduce ? undefined : { scale: grayScale, opacity: grayOpacity }}
            className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 grayscale dark:bg-slate-900/60 dark:ring-white/10"
          >
            <p className="text-sm font-semibold text-slate-500">여느 포트폴리오 앱</p>
            {[64, 40, 52].map((w, i) => (
              <div key={i} className="mt-4 flex items-center justify-between">
                <div className="h-3 rounded bg-slate-300 dark:bg-slate-600" style={{ width: `${w}%` }} />
                <span className="text-xs font-semibold text-slate-400">-3.2%</span>
              </div>
            ))}
            <p className="mt-6 text-xs text-slate-400">숫자가 빨간 날엔, 열어볼 이유가 없다.</p>
          </motion.div>
          <motion.div
            style={reduce ? undefined : { y: colorY, scale: colorScale }}
            className="relative rounded-2xl bg-white p-6 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/30 dark:bg-slate-900"
          >
            <p className={`text-sm font-semibold ${GRAD} bg-clip-text text-transparent`}>PEPEBear</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="font-semibold">Lv.7 Bear Cub</span>
              <span className={`font-bold ${ACCENT_TEXT}`}>+250 pt</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <div className={`h-full w-3/4 rounded-full ${GRAD}`} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Diamond Paws', 'First HODL', 'Meme Lord'].map((b) => (
                <span key={b} className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {b}
                </span>
              ))}
            </div>
            <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">참여할수록 쌓이고, 열어볼수록 재밌다.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Leaderboard({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [rows, setRows] = useState(START_ROWS);
  const [risen, setRisen] = useState<string | null>(null);
  const rowsRef = useRef(START_ROWS);
  useEffect(() => { rowsRef.current = rows; }, [rows]);
  useEffect(() => {
    if (!inView || reduce) return;
    const iv = setInterval(() => {
      const prev = rowsRef.current;
      const j = 1 + Math.floor(Math.random() * (prev.length - 1));
      const next = [...prev];
      const riser = { ...next[j], score: Math.round(next[j - 1].score * (1.01 + Math.random() * 0.05)) };
      next[j] = next[j - 1];
      next[j - 1] = riser;
      setRows(next);
      setRisen(riser.id);
    }, 6000);
    return () => clearInterval(iv);
  }, [inView, reduce]);
  useEffect(() => {
    if (!risen) return;
    const t = setTimeout(() => setRisen(null), 1000); return () => clearTimeout(t);
  }, [risen]);
  return (
    <section id="leaderboard" className="mx-auto max-w-3xl scroll-mt-24 px-6 py-28">
      <Reveal className="text-center">
        <p className={OVERLINE}>Live Leaderboard</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">지금 이 순간의 홀더 랭킹</h2>
        <p className="mx-auto mt-4 max-w-md text-slate-600 dark:text-slate-400">
          순위는 살아 움직입니다. 다음에 올라가는 이름이 당신일 수도.
        </p>
      </Reveal>
      <BrowserFrame url="pepebear.app/leaderboard" className="mt-12">
        <div ref={ref} className="space-y-2 p-4 sm:p-5">
          {rows.map((r, i) => (
            <motion.div
              key={r.id} layout transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className={`flex items-center gap-4 rounded-2xl px-5 py-4 ring-1 transition-colors duration-1000 ${
                risen === r.id
                  ? 'bg-emerald-500/15 ring-emerald-500/40'
                  : 'bg-white ring-emerald-900/10 dark:bg-slate-900/60 dark:ring-white/10'
              }`}
            >
              <span className={`w-6 text-center font-mono text-sm font-bold ${i === 0 ? ACCENT_TEXT : 'text-slate-400'}`}>
                {i + 1}
              </span>
              <span className="flex-1 truncate font-semibold">{r.id}</span>
              {risen === r.id && (
                <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center">
                  <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" className="fill-emerald-500">
                    <path d="M6 2 11 10H1z" />
                  </svg>
                </motion.span>
              )}
              <span className={`font-mono text-sm font-bold tabular-nums ${ACCENT_TEXT}`}>{fmtScore(r.score)} pt</span>
            </motion.div>
          ))}
        </div>
      </BrowserFrame>
    </section>
  );
}

function GamifySection({ reduce }: { reduce: boolean }) {
  return (
    <section className="border-y border-emerald-900/10 bg-white/60 px-6 py-28 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className={OVERLINE}>Game Loop</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">참여 → 포인트 → 업적 · 레벨업</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Reveal>
            <div className={`${CARD} h-full`}>
              <FiZap aria-hidden size={24} className={ACCENT_TEXT} />
              <h3 className="mt-4 text-lg font-semibold">참여하면 쌓인다</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">홀딩, 밈 공유, 커뮤니티 활동 — 전부 포인트.</p>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 12, scale: 0.85 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={ONCE}
                transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.4 }}
                className={`mt-6 inline-flex rounded-full ${GRAD} px-4 py-1.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30`}
              >
                +250 포인트
              </motion.div>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className={`${CARD} relative h-full overflow-hidden`}>
              <FiAward aria-hidden size={24} className={ACCENT_TEXT} />
              <h3 className="mt-4 text-lg font-semibold">업적을 해금한다</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">조건을 채우면 뱃지가 뒤집히며 열립니다.</p>
              <motion.div
                initial={reduce ? false : { rotateY: 180, opacity: 0 }}
                whileInView={{ rotateY: 0, opacity: 1 }} viewport={ONCE}
                transition={{ duration: 0.7, delay: 0.4, ease: EASE }} style={{ transformPerspective: 600 }}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-400"
              >
                <FiAward aria-hidden size={16} />
                Diamond Paws 해금
              </motion.div>
              {!reduce && (
                <motion.div
                  aria-hidden initial={{ opacity: 0 }} whileInView={{ opacity: [0, 0.5, 0] }}
                  viewport={ONCE} transition={{ duration: 0.6, delay: 1.1 }}
                  className="pointer-events-none absolute inset-0 bg-emerald-300"
                />
              )}
            </div>
          </Reveal>
          <Reveal delay={0.24}>
            <div className={`${CARD} h-full`}>
              <FiTrendingUp aria-hidden size={24} className={ACCENT_TEXT} />
              <h3 className="mt-4 text-lg font-semibold">레벨이 오른다</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Bear Cub에서 Moon Bear까지, 홀더의 성장 서사.</p>
              <div className="mt-6 flex items-center gap-3 text-sm font-bold">
                <span>Lv.7</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <motion.div
                    initial={reduce ? false : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={ONCE}
                    transition={{ duration: 1.2, delay: 0.3, ease: EASE }}
                    className={`h-full origin-left rounded-full ${GRAD}`}
                  />
                </div>
                <motion.span
                  initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: 1, scale: 1 }} viewport={ONCE}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: reduce ? 0 : 1.4 }}
                  className={ACCENT_TEXT}
                >
                  Lv.8
                </motion.span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function PhaseSection({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [stage, setStage] = useState(reduce ? 2 : -1);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setStage(v >= 0.85 ? 2 : v >= 0.5 ? 1 : v >= 0.15 ? 0 : -1));
  const shown = reduce ? 2 : stage;
  return (
    <section ref={ref} className={reduce ? 'relative' : 'relative h-[250vh]'}>
      <div
        className={
          reduce
            ? 'mx-auto flex max-w-4xl flex-col justify-center px-6 py-28'
            : 'sticky top-0 mx-auto flex h-screen max-w-4xl flex-col justify-center px-6'
        }
      >
        <div className="text-center">
          <p className={OVERLINE}>Roadmap</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Launch → Growth → Moon</h2>
        </div>
        <div className="relative mt-20">
          <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10" />
          <motion.div style={{ scaleX: reduce ? 1 : scrollYProgress }} className={`absolute inset-0 origin-left rounded-full ${GRAD}`} />
          {PHASES.map((p, i) => (
            <div key={p.label} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: p.pos }}>
              <motion.span
                animate={{ scale: shown >= i ? 1.25 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className={`block size-5 rounded-full border-4 transition-colors duration-300 ${
                  shown >= i ? 'border-emerald-500 bg-lime-300' : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900'
                }`}
              />
              <span className={`absolute left-1/2 top-7 -translate-x-1/2 text-xs font-bold sm:text-sm ${shown >= i ? ACCENT_TEXT : 'text-slate-400'}`}>
                {p.label}
              </span>
            </div>
          ))}
          <motion.div
            aria-hidden className="absolute -top-10 right-0 text-emerald-500"
            animate={shown === 2 ? { opacity: 1, y: -40, rotate: -12 } : { opacity: 0, y: 20, rotate: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <RocketIcon />
            <svg aria-hidden width="24" height="40" viewBox="0 0 24 40" className="mx-auto mt-1 text-lime-400">
              <motion.path
                d="M12 0v36" stroke="currentColor" strokeWidth="2" strokeDasharray="4 5"
                animate={{ pathLength: shown === 2 ? 1 : 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              />
            </svg>
          </motion.div>
        </div>
        <div className="mt-16 h-8 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={shown} initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }} className="text-sm font-semibold text-slate-600 dark:text-slate-300"
            >
              {shown >= 0 ? PHASES[shown].caption : '스크롤해서 여정을 시작하세요'}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

const WALLETS = [
  { name: 'Phantom', d: 'M4 6a8 8 0 0 1 16 0v9a1 1 0 0 1-1.6.8l-1.7-1.3-1.7 1.3a1 1 0 0 1-1.2 0L12 14.5l-1.8 1.3a1 1 0 0 1-1.2 0L7.3 14.5 5.6 15.8A1 1 0 0 1 4 15z' },
  { name: 'Solflare', d: 'M12 3v3m0 12v3m9-9h-3M6 12H3m14.5-6.5-2 2m-7 7-2 2m11 0-2-2m-7-7-2-2M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5z' }
];

function WalletSection({ reduce }: { reduce: boolean }) {
  return (
    <section className="border-t border-emerald-900/10 bg-white/60 px-6 py-28 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <p className={OVERLINE}>Wallet</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">지갑만 있으면 3초 만에 입장</h2>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {WALLETS.map((w, i) => (
            <Reveal key={w.name} delay={i * 0.12}>
              <motion.div whileHover={reduce ? undefined : { y: -6 }} className={`${CARD} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <svg aria-hidden width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={ACCENT_TEXT}>
                    <path d={w.d} />
                  </svg>
                  <span className="font-semibold">{w.name}</span>
                </div>
                <span className={`text-sm font-semibold ${ACCENT_TEXT}`}>원클릭 연결</span>
              </motion.div>
            </Reveal>
          ))}
        </div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={ONCE} transition={{ duration: 0.5, delay: 0.4, ease: EASE }}
          className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 font-mono text-sm text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-400"
        >
          ✓ 7xKp…3Fgh connected
        </motion.div>
      </div>
    </section>
  );
}

const DOTS = [
  { x: '12%', y: '18%', d: 0 }, { x: '82%', y: '12%', d: 0.6 }, { x: '90%', y: '62%', d: 1.2 },
  { x: '8%', y: '70%', d: 0.3 }, { x: '30%', y: '8%', d: 0.9 }, { x: '65%', y: '85%', d: 1.5 }
];

function FinalCta({ project, reduce }: { project: Project; reduce: boolean }) {
  return (
    <section className="relative overflow-hidden px-6 py-32 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(132,204,22,0.4), transparent)' }}
      />
      {!reduce &&
        DOTS.map((p, i) => (
          <motion.span
            key={i} aria-hidden style={{ left: p.x, top: p.y }}
            animate={{ y: [-8, 8, -8], opacity: [0.25, 0.9, 0.25] }}
            transition={{ duration: 3.2, repeat: Infinity, delay: p.d, ease: 'easeInOut' }}
            className={`absolute size-2 rounded-full ${i % 2 ? 'bg-lime-400' : 'bg-emerald-500'}`}
          />
        ))}
      <Reveal className="relative">
        <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
          달까지 같이 갈 사람? <span className={`${GRAD} bg-clip-text text-transparent`}>PEPEBear</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-slate-600 dark:text-slate-400">
          지갑 연결 3초, 첫 업적 해금까지 1분. 지루한 홀딩은 여기서 끝.
        </p>
        <div className="mt-8 flex justify-center">
          <AccentButton href="https://pump.fun" from={project.accent.from} to={project.accent.to} glow={project.accent.glow}>
            $PEPEBEAR 받으러 가기
          </AccentButton>
        </div>
      </Reveal>
    </section>
  );
}

function MiniFooter({ project }: { project: Project }) {
  return (
    <footer className="border-t border-emerald-900/10 px-6 py-10 dark:border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm font-semibold">
          {project.name}{' '}
          <span className="font-normal text-slate-500 dark:text-slate-400">© 2025 toris-dev</span>
        </p>
        <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
          <a href={project.github} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-slate-900 dark:hover:text-white">
            GitHub
          </a>
          <Link href="/projects" className="transition-colors hover:text-slate-900 dark:hover:text-white">
            모든 프로젝트
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function PepeBearLanding({ project }: { project: Project }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <div className="overflow-x-clip bg-slate-50 pt-24 text-slate-900 dark:bg-[#03070a] dark:text-white">
      <Hero project={project} reduce={reduce} />
      <ProblemSection reduce={reduce} />
      <Leaderboard reduce={reduce} />
      <GamifySection reduce={reduce} />
      <PhaseSection reduce={reduce} />
      <WalletSection reduce={reduce} />
      <FinalCta project={project} reduce={reduce} />
      <MiniFooter project={project} />
    </div>
  );
}
