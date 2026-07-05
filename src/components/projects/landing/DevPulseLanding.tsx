'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { FiCopy } from '@react-icons/all-files/fi/FiCopy';
import { FiCpu } from '@react-icons/all-files/fi/FiCpu';
import { FiDollarSign } from '@react-icons/all-files/fi/FiDollarSign';
import { FiFileText } from '@react-icons/all-files/fi/FiFileText';
import { FiFilm } from '@react-icons/all-files/fi/FiFilm';
import { FiFilter } from '@react-icons/all-files/fi/FiFilter';
import { FiGithub } from '@react-icons/all-files/fi/FiGithub';
import { FiGlobe } from '@react-icons/all-files/fi/FiGlobe';
import { FiLayout } from '@react-icons/all-files/fi/FiLayout';
import { FiPlay } from '@react-icons/all-files/fi/FiPlay';
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
import { TerminalFrame } from './DeviceFrames';
import { AccentButton, CountUp, EASE, GhostButton, Reveal } from './shared';

const CARD =
  'rounded-2xl bg-white p-6 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-white/10';
const OVERLINE = 'font-mono text-xs font-semibold uppercase tracking-[0.2em] text-green-600 dark:text-green-400';
const CMD = '$ devpulse run --daily';

const LOGS = [
  { delay: 0.5, spin: false, name: 'crawl', detail: '12 sources · 47 articles', time: '(3.2s)' },
  { delay: 0.9, spin: false, name: 'dedupe', detail: '47 → 18 unique', time: '(0.4s)' },
  { delay: 1.3, spin: true, name: 'summarize', detail: 'qwen2.5:14b · 18/18 done', time: '(41s)' },
  { delay: 2.1, spin: false, name: 'cards', detail: '18 cards rendered → ./out/cards', time: '(6.1s)' },
  { delay: 2.6, spin: false, name: 'video', detail: '1080x1920 · 58s · h264', time: '(22s)' }
];

const CHORES = [
  { icon: FiGlobe, title: '뉴스 소스 순회', desc: '매일 아침 12개 사이트를 직접 돌며 눈으로 고르는 시간.' },
  { icon: FiFilter, title: '중복 거르기', desc: '같은 소식이 제목만 바꿔 47번. 손으로 지우는 반복 작업.' },
  { icon: FiFileText, title: '요약 작성', desc: '기사마다 3줄 요약을 직접 쓰다 보면 오전이 사라집니다.' },
  { icon: FiLayout, title: '카드 · 영상 제작', desc: '디자인 툴 열고, 자막 얹고, 렌더링 기다리고 — 또 한 시간.' }
];

const NODES = [
  { icon: FiGlobe, label: 'Crawl', caption: '47개 기사 수집' },
  { icon: FiFilter, label: 'Dedupe', caption: '중복 제거' },
  { icon: FiCpu, label: 'Summarize', caption: '로컬 요약 중' },
  { icon: FiLayout, label: 'Design', caption: '카드 디자인' },
  { icon: FiFilm, label: 'Render', caption: 'mp4 렌더' }
];

const STAGE_DETAILS = [
  { title: 'Crawl', desc: '12개 뉴스 소스를 순회하며 오늘의 기사를 수집합니다.', metric: '12 sources · 47 articles' },
  { title: 'Dedupe', desc: '제목만 바꾼 중복 기사를 자동으로 걸러냅니다.', metric: '47 → 18 unique' },
  { title: 'Summarize', desc: 'API 비용 없이 로컬 LLM이 3줄 요약을 작성합니다.', metric: 'qwen2.5:14b · 로컬 추론' },
  { title: 'Design', desc: '요약을 카드뉴스 템플릿에 자동으로 배치합니다.', metric: '18 cards · 브랜드 템플릿' },
  { title: 'Render', desc: '자막을 얹은 숏폼 비디오를 렌더링합니다.', metric: '1080×1920 · 58s · h264' }
];

const NEWS = [
  { tag: 'React', title: 'React 20 RC, 컴파일러 기본 탑재' },
  { tag: 'AI', title: 'qwen2.5 로컬 벤치마크 총정리' },
  { tag: 'Web', title: 'CSS if() 함수, 마침내 확정' }
];

function LogLine({ log, reduce, spinDone }: { log: (typeof LOGS)[number]; reduce: boolean; spinDone: boolean }) {
  const ok = !log.spin || spinDone;
  return (
    <motion.p
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduce ? 0 : log.delay, duration: 0.25 }}
      className="flex gap-2 whitespace-nowrap text-slate-300"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={ok ? 'ok' : 'spin'}
          initial={reduce ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          className={ok ? 'text-green-400' : 'text-slate-400'}
        >
          {ok ? '✔' : '⠋'}
        </motion.span>
      </AnimatePresence>
      <span className="w-24 text-slate-100">{log.name}</span>
      <span className="flex-1">{log.detail}</span>
      <span className="text-slate-500">{log.time}</span>
    </motion.p>
  );
}

function Hero({ project, reduce }: { project: Project; reduce: boolean }) {
  const [spinDone, setSpinDone] = useState(false);
  useEffect(() => {
    if (reduce) {
      setSpinDone(true);
      return;
    }
    const t = setTimeout(() => setSpinDone(true), 2100);
    return () => clearTimeout(t);
  }, [reduce]);
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[460px] w-[820px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${project.accent.glow}, transparent)` }}
      />
      <div className="relative mx-auto max-w-4xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          <span className="block whitespace-pre font-mono text-green-600 dark:text-green-400">
            {reduce
              ? CMD
              : CMD.split('').map((ch, i) => (
                  <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + i * 0.045, duration: 0.01 }}>
                    {ch}
                  </motion.span>
                ))}
            <motion.span
              aria-hidden
              animate={reduce ? { opacity: 1 } : { opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: reduce ? 0 : Infinity }}
              className="ml-1 inline-block h-[0.9em] w-[0.5ch] translate-y-1 bg-green-500"
            />
          </span>
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.3, duration: 0.6, ease: EASE }}
            className="mt-4 block text-2xl sm:text-4xl"
          >
            뉴스 수집부터 비디오까지, 로컬 LLM 하나로.
          </motion.span>
        </h1>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.5, duration: 0.6, ease: EASE }}
          className="mx-auto mt-6 max-w-xl text-slate-600 dark:text-slate-300"
        >
          API 비용 없이 크롤링 → 요약 → 카드뉴스 → 숏폼 렌더링을 완전 자동화하는 파이프라인.
        </motion.p>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.7, duration: 0.5, ease: EASE }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <AccentButton href={project.github} from={project.accent.from} to={project.accent.to} glow={project.accent.glow}>
            <FiGithub aria-hidden />
            GitHub에서 시작하기
          </AccentButton>
          <GhostButton href="#pipeline">파이프라인 보기</GhostButton>
        </motion.div>
      </div>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.2, duration: 0.7, ease: EASE }}
        className="relative mx-auto mt-14 max-w-2xl"
      >
        <TerminalFrame title="zsh — devpulse">
          <div className="max-h-[52vh] space-y-1.5 overflow-x-auto text-left">
            <p className="text-slate-100">
              <span className="text-green-400">$</span> devpulse run --daily
            </p>
            {LOGS.map((log) => (
              <LogLine key={log.name} log={log} reduce={reduce} spinDone={spinDone} />
            ))}
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 3.2, duration: 0.25 }}
              className="pt-1 text-slate-300"
            >
              ✨ done — total cost:{' '}
              <motion.span
                animate={
                  reduce
                    ? undefined
                    : { textShadow: ['0 0 0px rgba(74,222,128,0)', '0 0 18px rgba(74,222,128,0.9)', '0 0 0px rgba(74,222,128,0)'] }
                }
                transition={{ delay: 3.4, duration: 1.1, times: [0, 0.35, 1] }}
                className="font-bold text-green-400"
              >
                $0.00
              </motion.span>
            </motion.p>
          </div>
        </TerminalFrame>
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
            매일 뉴스 정리에 쓰는 시간, 그리고 API 청구서
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CHORES.map((c, i) => (
            <motion.div
              key={c.title}
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: EASE }}
              whileHover={reduce ? undefined : { y: -6 }}
              className={`${CARD} p-5`}
            >
              <c.icon aria-hidden size={22} className="text-slate-400" />
              <h3 className="mt-3 text-sm font-semibold">{c.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{c.desc}</p>
            </motion.div>
          ))}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, delay: 0.4, ease: EASE }}
            whileHover={reduce ? undefined : { y: -6 }}
            className="rounded-2xl bg-rose-50 p-5 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:ring-rose-500/30"
          >
            <FiDollarSign aria-hidden size={22} className="text-rose-500" />
            <h3 className="mt-3 text-sm font-semibold text-rose-600 dark:text-rose-400">GPT-4o 월 $84</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-rose-600/80 dark:text-rose-300/80">
              자동화해도 API로 돌리면 청구서가 자랍니다. 요약 한 번에 토큰 비용.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PipeLink({ progress, i, reduce }: { progress: MotionValue<number>; i: number; reduce: boolean }) {
  const len = useTransform(progress, [i / 5 + 0.04, (i + 1) / 5], [0, 1]);
  const style = { pathLength: reduce ? 1 : len };
  return (
    <>
      <svg aria-hidden className="hidden h-2 min-w-8 flex-1 md:block" viewBox="0 0 100 8" preserveAspectRatio="none">
        <line x1="0" y1="4" x2="100" y2="4" strokeWidth="2" className="stroke-slate-200 dark:stroke-white/10" />
        <motion.line x1="0" y1="4" x2="100" y2="4" stroke="#22C55E" strokeWidth="2" style={style} />
      </svg>
      <svg aria-hidden className="mx-auto block h-8 w-2 md:hidden" viewBox="0 0 8 100" preserveAspectRatio="none">
        <line x1="4" y1="0" x2="4" y2="100" strokeWidth="2" className="stroke-slate-200 dark:stroke-white/10" />
        <motion.line x1="4" y1="0" x2="4" y2="100" stroke="#22C55E" strokeWidth="2" style={style} />
      </svg>
    </>
  );
}

function PipelineSection({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setStep(Math.max(0, Math.min(4, Math.floor(v * 5)))));
  const active = reduce ? 4 : step;
  return (
    <section id="pipeline" ref={ref} className={reduce ? 'relative' : 'relative h-[220vh]'}>
      <div
        className={
          reduce
            ? 'relative mx-auto flex max-w-5xl flex-col justify-center px-6 py-28'
            : 'sticky top-0 mx-auto flex h-screen max-w-5xl flex-col justify-center px-6'
        }
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 text-slate-900 opacity-[0.04] dark:text-white"
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
        <div className="text-center">
          <p className={OVERLINE}>Pipeline</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">스크롤하는 동안, 하루치가 끝납니다</h2>
        </div>
        <div className="relative mx-auto mt-10 w-full max-w-3xl">
          <div className="flex items-center justify-between font-mono text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <span>Pipeline</span>
            <span className="tabular-nums">STAGE {active + 1}/5</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <motion.div
              style={{ scaleX: reduce ? 1 : scrollYProgress }}
              className="size-full origin-left rounded-full bg-green-500"
            />
          </div>
        </div>
        <div className="mt-10 flex flex-col md:flex-row md:items-center">
          {NODES.map((n, i) => (
            <Fragment key={n.label}>
              <motion.div
                animate={{ scale: !reduce && i === active ? 1.06 : 1 }}
                transition={{ duration: 0.3, ease: EASE }}
                className={`flex items-center gap-3 rounded-2xl border px-5 py-4 transition-colors duration-300 md:flex-col md:gap-2 md:px-6 ${
                  i <= active
                    ? 'border-green-500/60 bg-green-500/10 text-green-700 dark:text-green-400'
                    : 'border-slate-200 bg-white text-slate-400 dark:border-white/10 dark:bg-slate-900/60'
                }`}
              >
                <n.icon aria-hidden size={22} />
                <span className="font-mono text-sm font-semibold">{n.label}</span>
              </motion.div>
              {i < 4 && <PipeLink progress={scrollYProgress} i={i} reduce={reduce} />}
            </Fragment>
          ))}
        </div>
        <div className="mx-auto mt-10 w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: EASE }}
              className={`${CARD} p-5`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-mono text-sm font-bold text-green-600 dark:text-green-400">
                  {STAGE_DETAILS[active].title}
                </h3>
                <span className="whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">
                  {STAGE_DETAILS[active].metric}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {STAGE_DETAILS[active].desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function CostSection({ reduce }: { reduce: boolean }) {
  return (
    <section className="border-y border-slate-200 bg-white/60 px-6 py-28 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-4xl">
        <Reveal className="text-center">
          <p className={OVERLINE}>Cost</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">같은 결과물, 청구서만 다릅니다</h2>
        </Reveal>
        <Reveal delay={0.12} className="mt-12">
          <div className={CARD}>
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-baseline justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">OpenAI API</span>
                  <CountUp target={84} prefix="$" suffix="/mo" className="font-mono font-bold text-slate-500 dark:text-slate-400" />
                </div>
                <motion.div
                  initial={reduce ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 1, ease: EASE }}
                  className="h-4 w-full origin-left rounded-full bg-slate-300 dark:bg-slate-600"
                />
              </div>
              <div>
                <div className="mb-2 flex items-baseline justify-between text-sm">
                  <span className="font-semibold text-green-700 dark:text-green-400">devPulse</span>
                  <CountUp target={0} prefix="$" suffix="/mo" className="font-mono font-bold text-green-600 dark:text-green-400" />
                </div>
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={reduce ? false : { scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 1, delay: 0.3, ease: EASE }}
                    className="h-4 w-[6%] origin-left rounded-full bg-gradient-to-r from-green-500 to-green-400"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">전기세 조금</span>
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {['Ollama', 'qwen2.5', '프라이버시 유출 0'].map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-green-600/30 bg-green-500/10 px-3 py-1 font-mono text-xs text-green-700 dark:text-green-400"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function GallerySection({ reduce }: { reduce: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <Reveal className="text-center">
        <p className={OVERLINE}>Output</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">아침 7시, 이미 만들어져 있는 것들</h2>
      </Reveal>
      <div className="mt-14 grid items-center gap-12 md:grid-cols-2">
        <Reveal>
          <motion.div initial="rest" whileHover={reduce ? undefined : 'spread'} animate="rest" className="relative mx-auto h-80 w-64">
            {NEWS.map((n, i) => (
              <motion.div
                key={n.tag}
                variants={{
                  rest: { rotate: (i - 1) * 6, x: (i - 1) * 20 },
                  spread: { rotate: (i - 1) * 14, x: (i - 1) * 64 }
                }}
                transition={{ duration: 0.4, ease: EASE }}
                style={{ zIndex: i }}
                className="absolute inset-x-6 top-4 flex aspect-[9/16] flex-col justify-between rounded-2xl border border-white/10 bg-[#0B1120] p-4 shadow-xl"
              >
                <span className="w-fit rounded-full bg-green-500/15 px-2.5 py-0.5 font-mono text-[10px] text-green-400">{n.tag}</span>
                <div>
                  <p className="text-sm font-bold leading-snug text-white">{n.title}</p>
                  <p className="mt-2 font-mono text-[10px] text-slate-500">devPulse Daily · #142</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">카드뉴스 18장 — 호버로 펼쳐보기</p>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B1120] shadow-xl">
            <div className="flex aspect-video items-center justify-center">
              <motion.span
                whileHover={reduce ? undefined : { scale: 1.1 }}
                className="flex size-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/40"
              >
                <FiPlay aria-hidden size={22} className="ml-1" />
              </motion.span>
            </div>
            <div className="flex items-center gap-3 border-t border-white/10 px-4 py-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={reduce ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 1.2, ease: EASE }}
                  className="h-full w-1/3 origin-left rounded-full bg-green-500"
                />
              </div>
              <span className="font-mono text-xs text-slate-400">0:58 · 1080x1920 · h264</span>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">숏폼 비디오까지 자동 렌더링</p>
        </Reveal>
      </div>
    </section>
  );
}

function CronSection({ reduce }: { reduce: boolean }) {
  return (
    <section className="border-t border-slate-200 bg-white/60 px-6 py-28 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <p className={OVERLINE}>Automation</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">자는 동안 파이프라인이 돈다</h2>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-white/10 bg-[#0B1120] p-6 text-left font-mono text-sm">
            <p className="text-slate-500"># crontab -e</p>
            <p className="mt-2 whitespace-nowrap text-slate-200">
              <span className="text-green-400">0 7 * * *</span> devpulse run --daily && devpulse publish
              <motion.span
                aria-hidden
                animate={reduce ? { opacity: 1 } : { opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: reduce ? 0 : Infinity }}
                className="ml-1 inline-block h-[1em] w-[0.5ch] translate-y-0.5 bg-green-500"
              />
            </p>
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            한 줄이면 끝. 아침 7시, 커피를 내리는 사이 오늘의 카드뉴스가 도착합니다.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function FinalCta({ project, reduce }: { project: Project; reduce: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText('git clone https://github.com/toris-dev/devPulse');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <section className="relative overflow-hidden px-6 py-32 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${project.accent.glow}, transparent)` }}
      />
      <Reveal className="relative">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">오늘 밤부터 돌려보세요</h2>
        <div className="mx-auto mt-8 flex max-w-xl items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#0B1120] py-3 pl-5 pr-2 font-mono text-sm text-slate-200">
          <span className="text-green-400">$</span>
          <span className="whitespace-nowrap">git clone github.com/toris-dev/devPulse</span>
          <motion.button
            type="button"
            onClick={copy}
            whileTap={reduce ? undefined : { scale: 0.92 }}
            className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-colors hover:bg-white/10"
            aria-label="클론 명령어 복사"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={copied ? 'ok' : 'copy'}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                className={copied ? 'text-green-400' : undefined}
              >
                {copied ? <FiCheck aria-hidden /> : <FiCopy aria-hidden />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
        <div className="mt-8 flex justify-center">
          <AccentButton href={project.github} from={project.accent.from} to={project.accent.to} glow={project.accent.glow}>
            <FiGithub aria-hidden />
            GitHub에서 시작하기
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

export default function DevPulseLanding({ project }: { project: Project }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <div className="overflow-x-clip bg-slate-50 pt-24 text-slate-900 dark:bg-[#050810] dark:text-white">
      <Hero project={project} reduce={reduce} />
      <ProblemSection reduce={reduce} />
      <PipelineSection reduce={reduce} />
      <CostSection reduce={reduce} />
      <GallerySection reduce={reduce} />
      <CronSection reduce={reduce} />
      <FinalCta project={project} reduce={reduce} />
      <MiniFooter project={project} />
    </div>
  );
}
