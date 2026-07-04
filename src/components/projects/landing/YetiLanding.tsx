'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';

import { FiLock } from '@react-icons/all-files/fi/FiLock';
import { FiSend } from '@react-icons/all-files/fi/FiSend';
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform
} from 'framer-motion';

import type { Project } from '@/data/projects';
import { EASE, Reveal } from './shared';

const SNAP = [0.83, 0, 0.17, 1] as const;
const HARD = 'shadow-[4px_4px_0_#0284C7] dark:shadow-[4px_4px_0_#0EA5E9]';
const HARD_HOVER = 'hover:shadow-[8px_8px_0_#0284C7] dark:hover:shadow-[8px_8px_0_#0EA5E9]';
const PIXEL_SHADOW = '[text-shadow:4px_4px_0_#0284C7] dark:[text-shadow:4px_4px_0_#0EA5E9]';
const SKY = 'text-sky-600 dark:text-sky-400';
const OVERLINE = `font-mono text-xs font-bold uppercase tracking-[0.3em] ${SKY}`;
const CARD = 'border-2 border-sky-900/20 bg-white p-6 dark:border-sky-200/20 dark:bg-slate-900/70';

const qx = (t: number) => (1 - t) ** 2 * 60 + 2 * (1 - t) * t * 400 + t * t * 740;
const qy = (t: number) => (1 - t) ** 2 * 300 + 2 * (1 - t) * t * -40 + t * t * 280;

const FLAKES = [
  { x: '6%', d: 0, du: 7 }, { x: '18%', d: 2.2, du: 9 }, { x: '31%', d: 1.1, du: 8 }, { x: '47%', d: 3.4, du: 7.5 },
  { x: '59%', d: 0.6, du: 9.5 }, { x: '72%', d: 2.8, du: 7 }, { x: '86%', d: 1.7, du: 8.5 }, { x: '94%', d: 0.2, du: 10 }
];

const HUD_STATS = [
  { label: 'TOTAL SUPPLY', value: '1B' }, { label: 'LP BURNED', value: '100%' },
  { label: 'TAX', value: '0/0' }, { label: 'HOLDERS', value: '4,209' }
];

const LEVELS = [
  { lv: 'LEVEL 1', title: '토큰 런칭', desc: 'Pump.fun 공정 런칭 · LP 소각 완료', state: 'clear' },
  { lv: 'LEVEL 2', title: '커뮤니티 확장', desc: '홀더 밈 대회 · X 스페이스 · 텔레그램 성장', state: 'clear' },
  { lv: 'LEVEL 3', title: '거래소 상장', desc: 'DEX 유동성 심화 · CEX 상장 논의', state: 'now' },
  { lv: 'LEVEL 4', title: '게임 리메이크 · NFT', desc: '그 시절 펭귄 날리기, 온체인으로 부활', state: 'locked' }
] as const;

function PixelButton({ href, children, small }: { href: string; children: ReactNode; small?: boolean }) {
  return (
    <span className="relative inline-block">
      <span aria-hidden className="absolute inset-0 translate-x-1 translate-y-1 bg-sky-800 dark:bg-sky-950" />
      <motion.a
        href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
        whileTap={{ x: 4, y: 4 }}
        className={`relative inline-flex items-center gap-2 border-2 border-sky-800 bg-sky-500 font-mono font-bold uppercase tracking-wider text-white dark:border-sky-300 ${small ? 'h-10 px-4 text-xs' : 'h-12 px-6 text-sm'}`}
      >
        {children}
      </motion.a>
    </span>
  );
}

function PenguinScene({ reduce }: { reduce: boolean }) {
  const [runId, setRunId] = useState(0);
  const [landed, setLanded] = useState(reduce);
  const [score, setScore] = useState(reduce ? 322.5 : 0);
  const t = useMotionValue(reduce ? 1 : 0);
  const px = useTransform(t, qx);
  const py = useTransform(t, qy);
  const rot = useTransform(t, (v) => v * 720);
  useEffect(() => {
    if (reduce) return;
    setLanded(false);
    setScore(0);
    t.set(0);
    const controls = animate(t, 1, {
      duration: 1.4, ease: [0.3, 0.9, 0.6, 1],
      onComplete: () => {
        setLanded(true);
        animate(0, 322.5, { duration: 0.8, ease: EASE, onUpdate: (v) => setScore(v) });
      }
    });
    return () => controls.stop();
  }, [runId, reduce, t]);
  return (
    <div className={`relative border-4 border-sky-900/20 bg-gradient-to-b from-sky-100 to-white dark:border-sky-200/20 dark:from-[#0a2440] dark:to-[#04101c] ${HARD}`}>
      <motion.div animate={landed && !reduce ? { x: [0, -4, 4, -2, 0] } : { x: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between border-b-2 border-sky-900/10 px-4 py-2 font-mono text-[11px] font-bold tracking-widest dark:border-sky-200/10 sm:text-sm">
          <span className={SKY}>
            SCORE <span className="tabular-nums">{score.toFixed(1)}m</span>
          </span>
          <span className="text-slate-500 dark:text-slate-400">BEST 1,337m · ×3</span>
        </div>
        <svg viewBox="0 0 800 340" className="max-h-[42vh] w-full" role="img" aria-label="펭귄 발사 장면">
          <path d="M0,300 Q200,260 420,300 T800,290 V340 H0 Z" className="fill-sky-200/70 dark:fill-sky-900/40" />
          <path d="M0,316 Q260,286 520,316 T800,310 V340 H0 Z" className="fill-white dark:fill-sky-950/60" />
          <defs>
            <clipPath id="yeti-traj">
              <motion.rect x="0" y="0" height="340" style={{ width: px }} />
            </clipPath>
          </defs>
          <path
            d="M60,300 Q400,-40 740,280" fill="none" strokeWidth="3" strokeDasharray="7 9"
            className="stroke-sky-500" clipPath="url(#yeti-traj)"
          />
          <g className="fill-slate-700 dark:fill-slate-200">
            <rect x="30" y="250" width="16" height="52" />
            <rect x="18" y="262" width="40" height="14" />
          </g>
          <motion.g style={{ x: px, y: py }}>
            <motion.g style={{ rotate: rot }}>
              <rect x="-14" y="-16" width="28" height="30" rx="2" className="fill-slate-900 dark:fill-slate-100" />
              <rect x="-8" y="-8" width="16" height="20" className="fill-white dark:fill-slate-800" />
              <rect x="-16" y="-4" width="6" height="12" className="fill-slate-900 dark:fill-slate-100" />
              <rect x="10" y="-4" width="6" height="12" className="fill-slate-900 dark:fill-slate-100" />
              <rect x="-4" y="-14" width="4" height="4" className="fill-white dark:fill-slate-900" />
              <rect x="-2" y="-4" width="10" height="5" className="fill-orange-400" />
            </motion.g>
          </motion.g>
          {landed && !reduce &&
            [0, 1, 2, 3, 4, 5].map((i) => {
              const a = (i / 6) * Math.PI * 2;
              return (
                <motion.rect
                  key={`${runId}-${i}`} width="6" height="6" className="fill-sky-300"
                  initial={{ x: 737, y: 277, opacity: 1 }}
                  animate={{ x: 737 + Math.cos(a) * 38, y: 277 + Math.sin(a) * 24 - 12, opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              );
            })}
        </svg>
      </motion.div>
      {!reduce && (
        <button
          type="button" onClick={() => setRunId((v) => v + 1)}
          className="absolute bottom-3 right-3 border-2 border-sky-800 bg-white px-3 py-1.5 font-mono text-[11px] font-bold uppercase text-sky-700 transition-transform hover:-translate-y-0.5 dark:border-sky-300 dark:bg-slate-900 dark:text-sky-300"
        >
          다시 날리기
        </button>
      )}
    </div>
  );
}

function Hero({ reduce }: { reduce: boolean }) {
  const { scrollY } = useScroll();
  const hillA = useTransform(scrollY, [0, 600], [0, 40]);
  const hillB = useTransform(scrollY, [0, 600], [0, 90]);
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-16">
      {!reduce &&
        FLAKES.map((f, i) => (
          <motion.span
            key={i} aria-hidden style={{ left: f.x }}
            animate={{ y: ['-5vh', '110vh'] }}
            transition={{ duration: f.du, delay: f.d, repeat: Infinity, ease: 'linear' }}
            className="pointer-events-none absolute top-0 z-10 size-1.5 bg-sky-200 dark:bg-white/60"
          />
        ))}
      <motion.div aria-hidden style={reduce ? undefined : { y: hillA }} className="pointer-events-none absolute inset-x-0 bottom-0">
        <svg viewBox="0 0 800 120" preserveAspectRatio="none" className="h-28 w-full">
          <path d="M0,120 L0,70 Q200,20 420,66 T800,60 L800,120 Z" className="fill-sky-100 dark:fill-sky-950/50" />
        </svg>
      </motion.div>
      <motion.div aria-hidden style={reduce ? undefined : { y: hillB }} className="pointer-events-none absolute inset-x-0 bottom-0">
        <svg viewBox="0 0 800 90" preserveAspectRatio="none" className="h-20 w-full">
          <path d="M0,90 L0,52 Q260,10 540,50 T800,44 L800,90 Z" className="fill-sky-200/80 dark:fill-sky-900/40" />
        </svg>
      </motion.div>
      <div className="relative mx-auto max-w-4xl text-center">
        <h1 className={`font-mono text-4xl font-black uppercase leading-tight tracking-[0.08em] sm:text-6xl ${PIXEL_SHADOW}`}>
          {['PENGUIN', 'GO', 'FLY.'].map((w, i) => (
            <motion.span
              key={w} initial={reduce ? false : { scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.1 + i * 0.14, ease: SNAP }}
              className="mx-1.5 inline-block sm:mx-2.5"
            >
              {w}
            </motion.span>
          ))}
        </h1>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: EASE }}
          className="mx-auto mt-6 max-w-xl text-slate-600 dark:text-slate-300"
        >
          펭귄을 날려버리던 2004년 그 게임, Solana 밈코인으로 부활했다.
        </motion.p>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.72, ease: EASE }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <PixelButton href="https://pump.fun">Pump.fun에서 $YETI 받기</PixelButton>
          <a
            href="#roadmap"
            className="inline-flex h-12 items-center border-2 border-slate-400 px-6 font-mono text-sm font-bold uppercase tracking-wider text-slate-700 transition-colors hover:border-sky-500 hover:text-sky-600 dark:border-slate-500 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:text-sky-300"
          >
            로드맵 보기
          </a>
        </motion.div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
          className="relative mx-auto mt-14 max-w-3xl"
        >
          <PenguinScene reduce={reduce} />
        </motion.div>
      </div>
    </section>
  );
}

function RetroSection({ reduce }: { reduce: boolean }) {
  return (
    <section className="border-y-2 border-sky-900/10 bg-white/60 px-6 py-28 dark:border-sky-200/10 dark:bg-white/[0.02]">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <Reveal>
          <p className={OVERLINE}>2004 — Flash</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">쉬는 시간마다 펭귄을 날렸다</h2>
          <p className="mt-4 max-w-md text-slate-600 dark:text-slate-400">
            컴퓨터실 구석, 친구들과 최고 기록을 겨루던 그 화면. 예티가 배트를 휘두르면 교실이 떠나가라
            웃었다. 그 기억을 가진 사람이라면, 이미 홀더입니다.
          </p>
        </Reveal>
        <motion.div
          initial={reduce ? false : { scaleY: 0.005, opacity: 0.4 }}
          whileInView={{ scaleY: 1, opacity: 1 }} viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: EASE }}
          className={`relative aspect-[4/3] overflow-hidden border-4 border-slate-700 bg-gradient-to-b from-sky-200 to-sky-50 dark:from-[#0a2a4a] dark:to-[#06182b] ${HARD}`}
        >
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            whileInView={reduce ? { opacity: 1 } : { opacity: [0, 1, 0] }}
            viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="pointer-events-none absolute inset-0 z-10 bg-white/70"
          />
          <svg viewBox="0 0 400 300" className="size-full">
            <rect x="0" y="250" width="400" height="50" className="fill-white dark:fill-sky-950" />
            <g className="fill-slate-100 stroke-slate-500" strokeWidth="2">
              <rect x="40" y="150" width="52" height="72" />
              <rect x="52" y="122" width="28" height="28" />
            </g>
            <rect x="60" y="132" width="5" height="5" className="fill-slate-800" />
            <rect x="72" y="132" width="5" height="5" className="fill-slate-800" />
            <rect x="88" y="150" width="56" height="10" transform="rotate(-38 88 155)" className="fill-amber-700" />
            <g transform="translate(210 190)">
              <rect x="-10" y="-12" width="20" height="22" className="fill-slate-900" />
              <rect x="-5" y="-6" width="10" height="14" className="fill-white" />
              <rect x="-2" y="-2" width="8" height="4" className="fill-orange-400" />
            </g>
            <text x="270" y="60" className="fill-slate-600 font-mono dark:fill-slate-300" fontSize="18">322.5m</text>
          </svg>
          <div
            aria-hidden className="pointer-events-none absolute inset-0"
            style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0 1px, transparent 1px 3px)' }}
          />
        </motion.div>
      </div>
    </section>
  );
}

function RevivalSection({ reduce }: { reduce: boolean }) {
  return (
    <section className="mx-auto max-w-4xl px-6 py-28 text-center">
      <Reveal>
        <p className={OVERLINE}>Reborn</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">이번엔 블록체인 위에서</h2>
      </Reveal>
      <div className="mt-14 flex items-center justify-center gap-6 sm:gap-10">
        <motion.svg
          initial={reduce ? false : { opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5, ease: EASE }}
          viewBox="0 0 40 40" className="size-16 sm:size-20" aria-label="픽셀 펭귄"
        >
          <rect x="8" y="4" width="24" height="28" className="fill-slate-900 dark:fill-slate-100" />
          <rect x="14" y="12" width="12" height="16" className="fill-white dark:fill-slate-800" />
          <rect x="16" y="16" width="10" height="4" className="fill-orange-400" />
          <rect x="4" y="32" width="12" height="4" className="fill-orange-400" />
          <rect x="24" y="32" width="12" height="4" className="fill-orange-400" />
        </motion.svg>
        <motion.svg
          initial={reduce ? false : { opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.4, delay: 0.3 }}
          viewBox="0 0 24 24" className={`size-8 ${SKY}`} fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden
        >
          <path d="M3 12h16m-6-7 7 7-7 7" />
        </motion.svg>
        <motion.svg
          initial={reduce ? false : { opacity: 0, rotateY: 0 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, rotateY: 360 }}
          viewport={{ once: true, amount: 0.5 }} transition={{ duration: 1, delay: 0.45, ease: EASE }}
          viewBox="0 0 40 40" className="size-16 sm:size-20" aria-label="$YETI 코인"
        >
          <circle cx="20" cy="20" r="18" className="fill-sky-400" />
          <circle cx="20" cy="20" r="13" className="fill-sky-200 dark:fill-sky-300" />
          <text x="20" y="26" textAnchor="middle" fontSize="14" fontWeight="900" className="fill-sky-800 font-mono">Y</text>
        </motion.svg>
      </div>
      <Reveal delay={0.2}>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {['Solana', 'Pump.fun 런칭', '커뮤니티 드리븐'].map((b) => (
            <span key={b} className={`border-2 border-sky-500/40 bg-sky-500/10 px-4 py-1.5 font-mono text-xs font-bold uppercase ${SKY}`}>
              {b}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function ScoreboardSection({ reduce }: { reduce: boolean }) {
  return (
    <section className="border-y-2 border-sky-900/10 bg-white/60 px-6 py-28 dark:border-sky-200/10 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center">
          <p className={OVERLINE}>Tokenomics</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">스코어보드는 이미 채워져 있다</h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {HUD_STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1}>
              <div className={`${CARD} transition-shadow duration-200 ${HARD} ${HARD_HOVER}`}>
                <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-slate-500 dark:text-slate-400">{s.label}</p>
                <span className={`mt-2 flex overflow-hidden font-mono text-2xl font-black tabular-nums sm:text-3xl ${SKY}`}>
                  {s.value.split('').map((ch, j) => (
                    <motion.span
                      key={j} initial={reduce ? false : { y: '105%' }} whileInView={{ y: '0%' }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 0.45, delay: 0.2 + j * 0.07, ease: EASE }}
                      className="inline-block"
                    >
                      {ch}
                    </motion.span>
                  ))}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function RoadmapItem({ level, reduce }: { level: (typeof LEVELS)[number]; reduce: boolean }) {
  const locked = level.state === 'locked';
  return (
    <div className="relative pb-12 pl-14 last:pb-0">
      <span className={`absolute left-2 top-1 size-5 -translate-x-1/2 border-2 ${locked ? 'border-slate-400 bg-slate-200 dark:bg-slate-700' : 'border-sky-600 bg-sky-400'}`} />
      <p className={`font-mono text-xs font-black tracking-[0.25em] ${SKY}`}>{level.lv}</p>
      <div className={`relative mt-2 ${CARD} ${locked ? 'opacity-80' : ''}`}>
        <div className={locked ? 'blur-[2px] grayscale' : ''}>
          <h3 className="text-lg font-bold">{level.title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{level.desc}</p>
        </div>
        {level.state === 'clear' && (
          <>
            <motion.span
              aria-hidden initial={reduce ? false : { opacity: 1, rotate: 0 }}
              whileInView={{ opacity: 0, rotate: -20 }} viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="absolute right-4 top-4 text-slate-400"
            >
              <FiLock size={18} />
            </motion.span>
            <motion.span
              initial={reduce ? false : { scale: 2, opacity: 0, rotate: 0 }}
              whileInView={{ scale: 1, opacity: 1, rotate: -8 }} viewport={{ once: true, amount: 0.7 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: reduce ? 0 : 0.6 }}
              className={`absolute -right-2 -top-3 border-2 border-sky-600 bg-sky-500 px-2.5 py-0.5 font-mono text-xs font-black tracking-widest text-white ${HARD}`}
            >
              CLEAR
            </motion.span>
          </>
        )}
        {level.state === 'now' && (
          <span className="absolute -right-2 -top-3 flex items-center gap-1.5 border-2 border-sky-600 bg-white px-2.5 py-0.5 font-mono text-xs font-black tracking-widest text-sky-700 dark:bg-slate-900 dark:text-sky-300">
            <motion.span
              aria-hidden animate={reduce ? undefined : { opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }} className="size-1.5 bg-sky-500"
            />
            NOW PLAYING
          </span>
        )}
        {locked && (
          <span className="absolute right-4 top-4 flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <FiLock aria-hidden size={18} />
            <motion.span
              animate={reduce ? undefined : { opacity: [1, 0.25, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="font-mono text-[10px] font-black tracking-[0.2em]"
            >
              COMING SOON
            </motion.span>
          </span>
        )}
      </div>
    </div>
  );
}

function RoadmapSection({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.5'] });
  return (
    <section id="roadmap" className="mx-auto max-w-3xl scroll-mt-24 px-6 py-28">
      <Reveal className="text-center">
        <p className={OVERLINE}>Roadmap</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">스테이지를 하나씩 깬다</h2>
      </Reveal>
      <div ref={ref} className="relative mt-14">
        <div className="absolute bottom-4 left-2 top-1 w-1 bg-slate-200 dark:bg-white/10" />
        <motion.div
          style={{ scaleY: reduce ? 1 : scrollYProgress }}
          className="absolute bottom-4 left-2 top-1 w-1 origin-top bg-sky-500"
        />
        {LEVELS.map((lv) => (
          <RoadmapItem key={lv.lv} level={lv} reduce={reduce} />
        ))}
      </div>
    </section>
  );
}

function CommunitySection({ reduce }: { reduce: boolean }) {
  return (
    <section className="border-t-2 border-sky-900/10 bg-white/60 px-6 py-28 dark:border-sky-200/10 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <p className={OVERLINE}>Community</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">같이 날릴 사람 구함</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <PixelButton href="https://x.com" small>
              <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1.6 2H8l4.4 5.9zm-1.1 18h1.7L7.1 3.7H5.3z" />
              </svg>
              X 팔로우
            </PixelButton>
            <PixelButton href="https://t.me" small>
              <FiSend aria-hidden size={14} />
              텔레그램 입장
            </PixelButton>
          </div>
        </Reveal>
        <div className="mt-12 grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Reveal key={i} delay={i * 0.1}>
              <motion.div
                whileHover={reduce ? undefined : { rotate: i === 1 ? -2 : 2, y: -4 }}
                className={`flex aspect-square items-center justify-center border-2 border-sky-900/20 bg-sky-50 dark:border-sky-200/20 dark:bg-sky-950/40 ${HARD}`}
              >
                <svg viewBox="0 0 40 40" className="size-1/2" aria-label={`밈 ${i + 1}`}>
                  <rect x="8" y="6" width="24" height="26" className="fill-slate-900 dark:fill-slate-100" />
                  <rect x="14" y="14" width="12" height="14" className="fill-white dark:fill-slate-800" />
                  <rect x="15" y="17" width="10" height="4" className="fill-orange-400" />
                  <rect x={6 + i * 4} y="34" width="10" height="3" className="fill-sky-400" />
                </svg>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [n, setN] = useState(9);
  useEffect(() => {
    if (reduce) {
      setN(0); return;
    }
    if (!inView || n <= 0) return;
    const t = setTimeout(() => setN((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [inView, n, reduce]);
  return (
    <section className="relative overflow-hidden px-6 py-32 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(14,165,233,0.4), transparent)' }}
      />
      <div ref={ref} className="relative">
        <Reveal>
          <p className={`font-mono text-xl font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400`}>
            GAME OVER?
          </p>
          <h2 className={`mt-4 font-mono text-3xl font-black uppercase tracking-[0.08em] sm:text-5xl ${PIXEL_SHADOW}`}>
            CONTINUE?{' '}
            <span className={`inline-block w-[2ch] text-left tabular-nums ${SKY}`}>{n > 0 ? `${n}…` : 'YES'}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-slate-600 dark:text-slate-400">
            그때 그 펭귄은 아직 날고 있다. 이번 판엔 당신 차례.
          </p>
          <div className="mt-8 flex justify-center">
            <PixelButton href="https://pump.fun">Pump.fun에서 $YETI 받기</PixelButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function MiniFooter({ project }: { project: Project }) {
  return (
    <footer className="border-t-2 border-sky-900/10 px-6 py-10 dark:border-sky-200/10">
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

export default function YetiLanding({ project }: { project: Project }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <div className="overflow-x-clip bg-slate-50 pt-24 text-slate-900 dark:bg-[#04101c] dark:text-white">
      <Hero reduce={reduce} />
      <RetroSection reduce={reduce} />
      <RevivalSection reduce={reduce} />
      <ScoreboardSection reduce={reduce} />
      <RoadmapSection reduce={reduce} />
      <CommunitySection reduce={reduce} />
      <FinalCta reduce={reduce} />
      <MiniFooter project={project} />
    </div>
  );
}
