'use client';

import { Fragment, useRef, useState } from 'react';
import Link from 'next/link';

import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { FiClock } from '@react-icons/all-files/fi/FiClock';
import { FiCloudOff } from '@react-icons/all-files/fi/FiCloudOff';
import { FiCpu } from '@react-icons/all-files/fi/FiCpu';
import { FiDatabase } from '@react-icons/all-files/fi/FiDatabase';
import { FiDownload } from '@react-icons/all-files/fi/FiDownload';
import { FiEdit3 } from '@react-icons/all-files/fi/FiEdit3';
import { FiFileText } from '@react-icons/all-files/fi/FiFileText';
import { FiMonitor } from '@react-icons/all-files/fi/FiMonitor';
import { FiX } from '@react-icons/all-files/fi/FiX';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue
} from 'framer-motion';

import type { Project } from '@/data/projects';
import { WindowFrame } from './DeviceFrames';
import { AccentButton, CountUp, EASE, GhostButton, Reveal } from './shared';

const CARD =
  'rounded-2xl bg-white p-6 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-white/10';
const OVERLINE = 'text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500';

const FEED = [
  { time: '09:12', title: 'VS Code — toris-blog', meta: '47분 집중', dot: 'bg-indigo-500', dashed: false },
  { time: '10:03', title: '클립보드 복사', meta: '“framer-motion stagger”', dot: 'bg-violet-500', dashed: false },
  { time: '10:41', title: '스크린샷 캡처 — Figma', meta: '이미지 1장', dot: 'bg-sky-500', dashed: false },
  { time: '11:00', title: '유휴 12분', meta: '자리 비움', dot: 'bg-slate-400', dashed: true }
];

const TL_ITEMS = [
  { time: '09:12', title: 'VS Code — toris-blog', meta: '47분 집중', dot: 'bg-indigo-500' },
  { time: '10:03', title: '클립보드 복사', meta: '“framer-motion stagger”', dot: 'bg-violet-500' },
  { time: '10:41', title: '스크린샷 캡처 — Figma', meta: '이미지 1장', dot: 'bg-sky-500' },
  { time: '11:00', title: '유휴 12분', meta: '자리 비움', dot: 'bg-slate-400' },
  { time: '11:12', title: 'Figma — 랜딩 시안 리뷰', meta: '32분 집중', dot: 'bg-indigo-500' }
];

const PROBLEMS = [
  { icon: FiEdit3, title: '수동 기록은 밀린다', desc: '타이머를 켜고 끄는 것도 일입니다. 기록은 결국 밀리고, 하루는 그대로 사라집니다.' },
  { icon: FiCloudOff, title: '클라우드는 불안하다', desc: '내 작업 내역이 남의 서버에 쌓인다면? 업무 로그는 가장 민감한 개인 데이터입니다.' },
  { icon: FiClock, title: '회고할 근거가 없다', desc: '“오늘 뭐 했지?”에 어제도, 지난주도 답할 수 없다면 개선도 시작되지 않습니다.' }
];

const HOURS = [6, 8, 10, 14, 22, 38, 70, 88, 62, 90, 84, 48, 28, 64, 82, 92, 74, 56, 34, 20, 14, 10, 8, 6];
const FOCUS = new Set([6, 7, 9, 10, 14, 15, 16]);

function WordStagger({ text, reduce, delay = 0, className }: { text: string; reduce: boolean; delay?: number; className?: string }) {
  return (
    <span className={className}>
      {text.split(' ').map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: delay + i * 0.06, ease: EASE }}
          className="inline-block"
        >
          {w}{' '}
        </motion.span>
      ))}
    </span>
  );
}

function MiniRing({ value }: { value: number }) {
  const c = 2 * Math.PI * 40;
  return (
    <svg viewBox="0 0 100 100" width={30} height={30} className="-rotate-90" aria-hidden>
      <circle cx="50" cy="50" r="40" fill="none" strokeWidth="12" className="stroke-slate-200 dark:stroke-white/10" />
      <circle cx="50" cy="50" r="40" fill="none" strokeWidth="12" strokeLinecap="round" stroke="#6366F1" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
    </svg>
  );
}

function Hero({ project, reduce }: { project: Project; reduce: boolean }) {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[820px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${project.accent.glow}, transparent)` }}
      />
      <div className="relative mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold leading-[1.15] tracking-tight sm:text-6xl">
          <WordStagger text="오늘 하루," reduce={reduce} className="block" />
          <WordStagger
            text="어디에 쓰였을까"
            reduce={reduce}
            delay={0.12}
            className="block bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent"
          />
        </h1>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
          className="mx-auto mt-6 max-w-xl text-base text-slate-600 dark:text-slate-300 sm:text-lg"
        >
          앱 사용·복사·캡처·유휴 시간을 서버 없이 로컬에만 기록하는 개인 활동 일지.
        </motion.p>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <AccentButton href={project.github} from={project.accent.from} to={project.accent.to} glow={project.accent.glow}>
            <FiDownload aria-hidden />
            무료 다운로드
          </AccentButton>
          <GhostButton href="#how">작동 방식 보기</GhostButton>
        </motion.div>
        <motion.ul
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400"
        >
          {['macOS · Windows · Linux', '100% 로컬 저장', '외부 전송 0건'].map((b) => (
            <li key={b} className="flex items-center gap-1.5">
              <FiCheck aria-hidden className="text-indigo-500" /> {b}
            </li>
          ))}
        </motion.ul>
      </div>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 60, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ type: 'spring', duration: 0.8, bounce: 0.25, delay: 0.45 }}
        style={{ transformPerspective: 1200 }}
        className="relative mx-auto mt-14 max-w-3xl"
      >
        <WindowFrame title="TraceDesk — 오늘">
          <div className="flex max-h-[52vh] bg-slate-50 text-left text-xs dark:bg-slate-950">
            <aside className="hidden w-36 shrink-0 border-r border-slate-200 p-3 dark:border-white/10 sm:block">
              {['타임라인', '분석', '모니터', '설정'].map((m, i) => (
                <p
                  key={m}
                  className={
                    i === 0
                      ? 'mb-1 rounded-lg bg-indigo-500/10 px-3 py-2 font-semibold text-indigo-600 dark:text-indigo-400'
                      : 'mb-1 rounded-lg px-3 py-2 text-slate-500 dark:text-slate-400'
                  }
                >
                  {m}
                </p>
              ))}
            </aside>
            <div className="flex-1 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold text-slate-700 dark:text-slate-200">오늘 · 7월 5일</p>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <MiniRing value={87} />
                  오늘 생산성 <b className="text-slate-800 dark:text-white">87점</b>
                </div>
              </div>
              {FEED.map((f) => (
                <div
                  key={f.time}
                  className={`mb-2 flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5 dark:bg-slate-900 ${f.dashed ? 'border-dashed border-slate-300 dark:border-white/15' : 'border-slate-200 dark:border-white/10'}`}
                >
                  <span className={`size-2 shrink-0 rounded-full ${f.dot}`} />
                  <span className="w-9 shrink-0 tabular-nums text-slate-400">{f.time}</span>
                  <span className="truncate font-medium text-slate-700 dark:text-slate-200">{f.title}</span>
                  <span className="ml-auto shrink-0 text-slate-400">{f.meta}</span>
                </div>
              ))}
            </div>
          </div>
        </WindowFrame>
      </motion.div>
    </section>
  );
}

function ProblemSection({ reduce }: { reduce: boolean }) {
  return (
    <section className="border-y border-slate-200 bg-white/60 px-6 py-28 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className={OVERLINE}>Problem</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            기억은 흐릿하고, 타임 트래커는 번거롭다
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: EASE }}
              whileHover={reduce ? undefined : { y: -6 }}
              className={CARD}
            >
              <p.icon aria-hidden size={24} className="text-indigo-500" />
              <h3 className="mt-4 text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TimelineRow({ progress, i, item, reduce }: { progress: MotionValue<number>; i: number; item: (typeof TL_ITEMS)[number]; reduce: boolean }) {
  const start = i * 0.18;
  const opacity = useTransform(progress, [start, start + 0.15], [0, 1]);
  const x = useTransform(progress, [start, start + 0.15], [-16, 0]);
  const scale = useTransform(progress, [start, start + 0.1, start + 0.15], [0, 1.2, 1]);
  return (
    <motion.div style={reduce ? undefined : { opacity, x }} className="relative pb-10 pl-12">
      <motion.span style={reduce ? undefined : { scale }} className={`absolute left-[11px] top-1 size-2.5 rounded-full ${item.dot}`} />
      <p className="text-xs tabular-nums text-slate-400">{item.time}</p>
      <p className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{item.meta}</p>
    </motion.div>
  );
}

function TimelineFillSection({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.4'] });
  const [phase, setPhase] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setPhase(v > 0.5 ? 1 : 0));
  const shownPhase = reduce ? 1 : phase;
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-28">
      <div ref={ref} className="grid gap-14 md:grid-cols-2">
        <div className="self-start md:sticky md:top-32">
          <p className={OVERLINE}>How it works</p>
          <AnimatePresence mode="wait">
            <motion.h2
              key={shownPhase}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -14 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"
            >
              {shownPhase === 0 ? '설치하고, 잊어버리세요.' : '되돌아보면 전부 남아 있습니다.'}
            </motion.h2>
          </AnimatePresence>
          <p className="mt-4 max-w-md text-slate-600 dark:text-slate-400">
            Rust 에이전트가 트레이에 상주하며 앱 포커스, 복사, 캡처, 유휴를 자동으로 수집합니다.
            스크롤한 만큼 타임라인이 채워지듯 — 하루가 그대로 일지가 됩니다.
          </p>
        </div>
        <div className="relative">
          <div className="absolute bottom-2 left-4 top-1 w-px bg-slate-200 dark:bg-white/10" />
          <motion.div
            style={{ scaleY: reduce ? 1 : scrollYProgress }}
            className="absolute bottom-2 left-4 top-1 w-px origin-top bg-gradient-to-b from-indigo-500 to-violet-500"
          />
          {TL_ITEMS.map((item, i) => (
            <TimelineRow key={item.time} progress={scrollYProgress} i={i} item={item} reduce={reduce} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ScoreSection({ reduce }: { reduce: boolean }) {
  const c = 2 * Math.PI * 44;
  return (
    <section className="border-y border-slate-200 bg-white/60 px-6 py-28 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-2">
        <Reveal>
          <p className={OVERLINE}>Productivity</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">숫자로 보는 나의 하루</h2>
          <p className="mt-4 max-w-md text-slate-600 dark:text-slate-400">
            집중 구간과 유휴 구간을 구분해 하루를 하나의 점수로 요약합니다. 주간 리포트와 시간별
            집중도까지, 회고에 필요한 근거가 자동으로 쌓입니다.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {['생산성 점수 & 주간 리포트', '시간별 집중도 히트맵', '유휴 시간 분석'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <FiCheck aria-hidden className="text-indigo-500" /> {t}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.12}>
          <div className={CARD}>
            <div className="relative mx-auto size-44">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" strokeWidth="8" className="stroke-slate-200 dark:stroke-white/10" />
                <motion.circle
                  cx="50" cy="50" r="44" fill="none" strokeWidth="8" strokeLinecap="round"
                  stroke="url(#td-ring)" strokeDasharray={c}
                  initial={{ strokeDashoffset: reduce ? c * 0.13 : c }}
                  whileInView={{ strokeDashoffset: c * 0.13 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 1.2, ease: EASE }}
                />
                <defs>
                  <linearGradient id="td-ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <CountUp target={87} duration={1.2} className="text-4xl font-bold" />
                <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">오늘 생산성 점수</span>
              </div>
            </div>
            <div className="mt-8 flex h-24 items-end gap-1" aria-hidden>
              {HOURS.map((h, i) => (
                <motion.div
                  key={i}
                  initial={reduce ? false : { scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, delay: i * 0.03, ease: EASE }}
                  style={{ height: `${h}%` }}
                  className={`flex-1 origin-bottom rounded-sm ${FOCUS.has(i) ? 'bg-gradient-to-t from-indigo-500 to-violet-500' : 'bg-slate-200 dark:bg-white/10'}`}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-slate-400">
              <span>0시</span> <span>12시</span> <span>23시</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const ARCH_NODES = [
  { icon: FiCpu, label: 'Rust Agent', sub: '백그라운드 수집' },
  { icon: FiDatabase, label: 'SQLite', sub: '내 디스크에만 저장' },
  { icon: FiMonitor, label: 'React UI', sub: '타임라인 · 분석' }
];

function PrivacySection({ reduce }: { reduce: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28 text-center">
      <Reveal>
        <p className={OVERLINE}>Privacy</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          데이터는 이 다이어그램 밖으로 나가지 않습니다
        </h2>
      </Reveal>
      <div className="mt-14 flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-0">
        {ARCH_NODES.map((n, i) => (
          <Fragment key={n.label}>
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: i * 0.35, ease: EASE }}
              className={`${CARD} w-52`}
            >
              <n.icon aria-hidden size={24} className="mx-auto text-indigo-500" />
              <p className="mt-3 font-semibold">{n.label}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{n.sub}</p>
            </motion.div>
            {i < 2 && (
              <>
                <svg aria-hidden className="hidden h-2 w-16 sm:block" viewBox="0 0 64 8">
                  <motion.line
                    x1="0" y1="4" x2="64" y2="4" stroke="#6366F1" strokeWidth="2"
                    initial={{ pathLength: reduce ? 1 : 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.35, ease: EASE }}
                  />
                </svg>
                <motion.span
                  aria-hidden
                  initial={reduce ? false : { scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.35, ease: EASE }}
                  className="h-8 w-0.5 origin-top bg-indigo-500 sm:hidden"
                />
              </>
            )}
          </Fragment>
        ))}
      </div>
      <div className="mx-auto mt-12 flex max-w-md items-center justify-center gap-3">
        <svg aria-hidden className="h-2 w-20" viewBox="0 0 80 8">
          <line x1="0" y1="4" x2="80" y2="4" strokeWidth="2" strokeDasharray="5 5" className="stroke-slate-300 dark:stroke-white/20" />
        </svg>
        <div className="relative rounded-xl border border-dashed border-slate-300 px-5 py-3 text-sm text-slate-400 dark:border-white/20 dark:text-slate-500">
          외부 서버 · 클라우드
          <motion.span
            initial={reduce ? false : { scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 16, delay: reduce ? 0 : 1.1 }}
            className="absolute -right-2.5 -top-2.5 flex size-6 items-center justify-center rounded-full bg-rose-500 text-white"
          >
            <FiX aria-hidden size={14} />
          </motion.span>
        </div>
      </div>
      <Reveal delay={0.2}>
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          외부 전송 0건 — 월별 gzip 아카이브와 보관 기간 설정까지, 전부 로컬에서.
        </p>
      </Reveal>
    </section>
  );
}

function MiniStat({ label, value, reduce }: { label: string; value: number; reduce: boolean }) {
  const c = 2 * Math.PI * 40;
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 100 100" className="size-14 -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r="40" fill="none" strokeWidth="10" className="stroke-slate-200 dark:stroke-white/10" />
        <motion.circle
          cx="50" cy="50" r="40" fill="none" strokeWidth="10" strokeLinecap="round"
          stroke="#8B5CF6" strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c * (1 - value / 100) : c }}
          whileInView={{ strokeDashoffset: c * (1 - value / 100) }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1, ease: EASE }}
        />
      </svg>
      <div>
        <CountUp target={value} suffix="%" className="text-xl font-bold" />
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function ExportSection({ reduce }: { reduce: boolean }) {
  return (
    <section className="border-t border-slate-200 bg-white/60 px-6 py-28 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
        <Reveal>
          <div className={`${CARD} h-full`}>
            <FiFileText aria-hidden size={24} className="text-indigo-500" />
            <h3 className="mt-4 text-xl font-semibold">JSON / CSV 내보내기</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              날짜와 범위를 골라 JSON 또는 Excel 호환 CSV로. 데이터의 주인은 언제나 당신입니다.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {['json', 'csv'].map((ext, i) => (
                <motion.div
                  key={ext}
                  whileHover={reduce ? undefined : { rotate: i === 0 ? -3 : 3, y: -6 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs dark:border-white/10 dark:bg-slate-950"
                >
                  <FiDownload aria-hidden className="text-indigo-500" />
                  activity-2026-07.{ext}
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <div className={`${CARD} h-full`}>
            <FiMonitor aria-hidden size={24} className="text-indigo-500" />
            <h3 className="mt-4 text-xl font-semibold">시스템 모니터 내장</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              CPU · 메모리 · 포트 모니터까지 같은 앱에서. 한국어/English, 라이트/다크 테마 지원.
            </p>
            <div className="mt-6 flex gap-8">
              <MiniStat label="CPU" value={34} reduce={reduce} />
              <MiniStat label="메모리" value={58} reduce={reduce} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FinalCta({ project }: { project: Project }) {
  return (
    <section className="relative overflow-hidden px-6 py-32 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${project.accent.glow}, transparent)` }}
      />
      <Reveal className="relative">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">오늘부터 하루를 기록하세요</h2>
        <p className="mx-auto mt-4 max-w-md text-slate-600 dark:text-slate-400">
          설치 1분, 설정 0분. 내일 아침 첫 회고가 달라집니다.
        </p>
        <div className="mt-8 flex justify-center">
          <AccentButton href={project.github} from={project.accent.from} to={project.accent.to} glow={project.accent.glow}>
            <FiDownload aria-hidden />
            무료 다운로드
          </AccentButton>
        </div>
      </Reveal>
    </section>
  );
}

function MiniFooter({ project }: { project: Project }) {
  return (
    <footer className="border-t border-slate-200 px-6 py-10 dark:border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm font-semibold">
          {project.name}{' '}
          <span className="font-normal text-slate-500 dark:text-slate-400">© 2026 toris-dev</span>
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

export default function TraceDeskLanding({ project }: { project: Project }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <div className="overflow-x-clip bg-slate-50 pt-24 text-slate-900 dark:bg-[#050810] dark:text-white">
      <Hero project={project} reduce={reduce} />
      <ProblemSection reduce={reduce} />
      <TimelineFillSection reduce={reduce} />
      <ScoreSection reduce={reduce} />
      <PrivacySection reduce={reduce} />
      <ExportSection reduce={reduce} />
      <FinalCta project={project} />
      <MiniFooter project={project} />
    </div>
  );
}
