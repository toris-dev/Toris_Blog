'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiActivity } from '@react-icons/all-files/fi/FiActivity';
import { FiArrowLeft } from '@react-icons/all-files/fi/FiArrowLeft';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { FiCode } from '@react-icons/all-files/fi/FiCode';
import { FiCopy } from '@react-icons/all-files/fi/FiCopy';
import { FiGithub } from '@react-icons/all-files/fi/FiGithub';
import { FiLayers } from '@react-icons/all-files/fi/FiLayers';
import { FiPackage } from '@react-icons/all-files/fi/FiPackage';
import { FiShield } from '@react-icons/all-files/fi/FiShield';
import { FiZap } from '@react-icons/all-files/fi/FiZap';
import type { Project } from '@/data/projects';
import { EASE, Reveal } from './shared';

const PRIMITIVES = [
  {
    id: 'retry',
    label: 'retry',
    problem: '간헐적 실패',
    code: `const user = await retry(
  () => fetchUser(id),
  {
    retries: 4,
    minDelay: 120,
    jitter: true,
    signal
  }
);`
  },
  {
    id: 'timeout',
    label: 'withTimeout',
    problem: '끝나지 않는 작업',
    code: `const response = await withTimeout(
  signal => fetch(url, { signal }),
  5_000
);`
  },
  {
    id: 'limit',
    label: 'asyncMap',
    problem: '과도한 병렬 처리',
    code: `const pages = await asyncMap(
  urls,
  url => fetch(url),
  { concurrency: 4, settled: true }
);`
  },
  {
    id: 'memoize',
    label: 'memoize',
    problem: '중복 호출 폭주',
    code: `const getUser = memoize(
  id => api.fetchUser(id),
  { ttl: 60_000, maxSize: 500 }
);

// 10 calls → 1 request`
  }
] as const;

const FLOW = ['circuitBreaker', 'retry', 'withTimeout', 'asyncMap'];
const STATS = [
  ['0', 'runtime dependencies'],
  ['10', 'async primitives'],
  ['2', 'ESM + CJS outputs'],
  ['100%', 'typed surface']
];

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard?.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      aria-label={label}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? 'done' : 'copy'}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          className={copied ? 'text-emerald-300' : undefined}
        >
          {copied ? <FiCheck aria-hidden /> : <FiCopy aria-hidden />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function NetworkOrb({ reduce }: { reduce: boolean }) {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[460px]"
      aria-hidden
    >
      {[92, 70, 48].map((size, i) => (
        <motion.div
          key={size}
          className="absolute left-1/2 top-1/2 rounded-full border border-cyan-300/15"
          style={{
            width: `${size}%`,
            height: `${size}%`,
            x: '-50%',
            y: '-50%'
          }}
          animate={reduce ? undefined : { rotate: i % 2 ? -360 : 360 }}
          transition={{
            duration: 20 + i * 7,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          <span className="absolute left-1/2 top-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_24px_rgba(103,232,249,0.9)]" />
          <span className="absolute bottom-[12%] right-[8%] size-2 rounded-full bg-violet-400 shadow-[0_0_20px_rgba(167,139,250,0.9)]" />
        </motion.div>
      ))}
      <motion.div
        animate={
          reduce
            ? undefined
            : {
                scale: [1, 1.05, 1],
                filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)']
              }
        }
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-1/2 top-1/2 flex size-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[2rem] border border-white/15 bg-slate-950/80 shadow-[0_0_80px_rgba(34,211,238,0.24)] backdrop-blur-xl"
      >
        <FiZap className="text-cyan-300" size={28} />
        <span className="mt-2 font-mono text-sm font-bold text-white">
          asyncraft
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
          resilience core
        </span>
      </motion.div>
    </div>
  );
}

function PrimitiveLab({ reduce }: { reduce: boolean }) {
  const [active, setActive] =
    useState<(typeof PRIMITIVES)[number]['id']>('retry');
  const selected =
    PRIMITIVES.find((item) => item.id === active) ?? PRIMITIVES[0];

  return (
    <section
      id="lab"
      className="border-y border-white/10 bg-white/[0.025] px-5 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
            Primitive lab
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            문제를 고르면, 조합할 코드가 보입니다.
          </h2>
          <p className="mt-5 leading-relaxed text-slate-400">
            서로 다른 라이브러리를 붙이는 대신 같은 규칙과 같은 취소 모델을
            공유하는 프리미티브를 선택하세요.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div
            role="tablist"
            aria-label="asyncraft 프리미티브"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"
          >
            {PRIMITIVES.map((item, index) => {
              const isActive = item.id === selected.id;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(item.id)}
                  whileHover={reduce ? undefined : { x: 6 }}
                  className={`flex items-center justify-between rounded-2xl border px-5 py-4 text-left transition ${
                    isActive
                      ? 'border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_30px_rgba(34,211,238,0.1)]'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                  }`}
                >
                  <span>
                    <span className="font-mono text-xs text-slate-500">
                      0{index + 1}
                    </span>
                    <span className="ml-4 font-mono font-semibold text-white">
                      {item.label}
                    </span>
                  </span>
                  <span
                    className={`text-xs ${isActive ? 'text-cyan-200' : 'text-slate-500'}`}
                  >
                    {item.problem}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#070B16] shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
              <span className="size-2.5 rounded-full bg-rose-400" />
              <span className="size-2.5 rounded-full bg-amber-300" />
              <span className="size-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 font-mono text-xs text-slate-500">
                resilient-request.ts
              </span>
              <span className="ml-auto">
                <CopyButton
                  value={selected.code}
                  label={`${selected.label} 예제 복사`}
                />
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.pre
                key={selected.id}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.24 }}
                className="min-h-[330px] overflow-x-auto p-6 font-mono text-sm leading-7 text-slate-300 sm:p-8"
              >
                <code>
                  <span className="text-violet-300">import</span> {'{ '}
                  {selected.label}
                  {' }'} <span className="text-violet-300">from</span>{' '}
                  <span className="text-emerald-300">
                    &apos;asyncraft&apos;
                  </span>
                  ;{`\n\n`}
                  {selected.code}
                </code>
              </motion.pre>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function CompositionSection({ reduce }: { reduce: boolean }) {
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(-1);

  useEffect(() => {
    if (!running) return;
    const timers = FLOW.map((_, i) =>
      window.setTimeout(() => setStage(i), 350 + i * 430)
    );
    timers.push(
      window.setTimeout(() => setRunning(false), 350 + FLOW.length * 430)
    );
    return () => timers.forEach(window.clearTimeout);
  }, [running]);

  const run = () => {
    setStage(-1);
    setRunning(true);
  };

  return (
    <section className="px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
            Composable by design
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            한 번의 요청, 네 겹의 안전망.
          </h2>
        </Reveal>
        <div className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-5 sm:p-8">
          <div className="grid gap-3 md:grid-cols-4">
            {FLOW.map((item, i) => {
              const done = stage >= i;
              return (
                <motion.div
                  key={item}
                  animate={done && !reduce ? { y: [0, -5, 0] } : undefined}
                  className={`relative rounded-2xl border p-5 transition-colors ${done ? 'border-cyan-300/40 bg-cyan-300/10' : 'border-white/10 bg-slate-950/45'}`}
                >
                  <span className="font-mono text-[10px] text-slate-500">
                    LAYER 0{i + 1}
                  </span>
                  <p
                    className={`mt-2 font-mono text-sm font-semibold ${done ? 'text-cyan-200' : 'text-slate-300'}`}
                  >
                    {item}
                  </p>
                  <span
                    className={`absolute right-4 top-4 size-2 rounded-full ${done ? 'bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,1)]' : 'bg-slate-700'}`}
                  />
                </motion.div>
              );
            })}
          </div>
          <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
            <p className="font-mono text-sm text-slate-400">
              {stage === FLOW.length - 1 ? (
                <span className="text-emerald-300">
                  ✓ request completed in 1.82s
                </span>
              ) : running ? (
                `running ${FLOW[Math.max(stage + 1, 0)]}...`
              ) : (
                '$ compose resilient request'
              )}
            </p>
            <button
              type="button"
              onClick={run}
              disabled={running}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-slate-950 transition hover:scale-[1.03] disabled:cursor-wait disabled:opacity-60"
            >
              <FiActivity aria-hidden /> {running ? 'Running...' : 'Run flow'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AsyncraftLanding({ project }: { project: Project }) {
  const reduce = useReducedMotion() ?? false;

  return (
    <div className="min-h-dvh overflow-x-clip bg-[#040711] pt-24 text-white selection:bg-cyan-300 selection:text-slate-950">
      <section className="relative overflow-hidden px-5 pb-24 pt-14 sm:pb-32 sm:pt-20">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]"
        />
        <div
          aria-hidden
          className="absolute left-[10%] top-0 size-[32rem] rounded-full bg-cyan-400/10 blur-[120px]"
        />
        <div
          aria-hidden
          className="absolute right-[8%] top-1/4 size-[30rem] rounded-full bg-violet-500/10 blur-[120px]"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
              >
                <FiArrowLeft aria-hidden /> All projects
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.65, ease: EASE }}
              className="mt-10 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-4 py-2 font-mono text-xs text-cyan-200"
            >
              <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />{' '}
              npm · v0.2.0 · zero dependencies
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.75, ease: EASE }}
              className="mt-7 text-5xl font-bold tracking-[-0.055em] sm:text-7xl lg:text-8xl"
            >
              Async flows,
              <span className="block bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-transparent">
                crafted to survive.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.7, ease: EASE }}
              className="mt-7 max-w-xl text-lg leading-relaxed text-slate-400"
            >
              실패·지연·중복·폭주를 다루는 TypeScript 비동기 프리미티브. 작게
              가져오고, 원하는 순서로 조합하고, 어디서든 취소하세요.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.65, ease: EASE }}
              className="mt-9 flex flex-wrap gap-3"
            >
              <a
                href="https://www.npmjs.com/package/asyncraft"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-7 text-sm font-bold text-slate-950 shadow-[0_12px_50px_rgba(34,211,238,0.23)] transition hover:scale-[1.03]"
              >
                <FiPackage aria-hidden /> View on npm
              </a>
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 text-sm font-semibold transition hover:bg-white/10"
              >
                <FiGithub aria-hidden /> GitHub
              </a>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="mt-7 flex max-w-lg items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 py-2.5 pl-4 pr-2 font-mono text-sm text-slate-300"
            >
              <span className="text-cyan-300">$</span>
              <span className="flex-1">npm install asyncraft</span>
              <CopyButton
                value="npm install asyncraft"
                label="설치 명령어 복사"
              />
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.18, duration: 0.9, ease: EASE }}
          >
            <NetworkOrb reduce={reduce} />
          </motion.div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] px-5 py-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-4">
          {STATS.map(([value, label]) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-white sm:text-3xl">
                {value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <PrimitiveLab reduce={reduce} />

      <section className="px-5 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-2xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
              Built-in guarantees
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              가벼운 패키지, 무겁게 검증된 동작.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              [
                FiShield,
                'Leak-free cancellation',
                '작업이 끝나거나 중단되면 모든 타이머와 AbortSignal 리스너를 정리합니다.'
              ],
              [
                FiLayers,
                'Stable ordering',
                '동시 실행 중에도 asyncMap 결과는 항상 입력 순서를 보존합니다.'
              ],
              [
                FiCode,
                'Typed failures',
                'TimeoutError·RetryError·CircuitOpenError를 명확하게 구분하고 원인을 보존합니다.'
              ]
            ].map(([Icon, title, desc], i) => {
              const CardIcon = Icon as typeof FiShield;
              return (
                <motion.article
                  key={String(title)}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.6, ease: EASE }}
                  whileHover={reduce ? undefined : { y: -6 }}
                  className="rounded-3xl border border-white/10 bg-white/[0.035] p-7"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300/20 to-violet-400/20 text-cyan-200">
                    <CardIcon size={22} />
                  </span>
                  <h3 className="mt-6 text-lg font-bold">{String(title)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">
                    {String(desc)}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <CompositionSection reduce={reduce} />

      <section className="px-5 py-28 text-center sm:py-36">
        <Reveal className="relative mx-auto max-w-3xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-cyan-400/10 via-white/[0.04] to-violet-500/10 px-6 py-16 sm:px-12">
          <div
            aria-hidden
            className="absolute inset-x-1/4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
          />
          <FiZap className="mx-auto text-cyan-300" size={30} />
          <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">
            비동기 흐름의 기본 장비를 하나로.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-slate-400">
            제로 의존성, 완전한 타입, 취소 가능한 모든 대기. 지금 사용하는
            프로젝트에 바로 추가해 보세요.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="https://www.npmjs.com/package/asyncraft"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-bold text-slate-950 transition hover:scale-[1.03]"
            >
              <FiPackage /> Install asyncraft
            </a>
            <Link
              href="/projects"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-7 text-sm font-semibold transition hover:bg-white/5"
            >
              More projects
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
