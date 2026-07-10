'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiArrowLeft } from '@react-icons/all-files/fi/FiArrowLeft';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { FiChevronRight } from '@react-icons/all-files/fi/FiChevronRight';
import { FiCode } from '@react-icons/all-files/fi/FiCode';
import { FiGithub } from '@react-icons/all-files/fi/FiGithub';
import { FiLayers } from '@react-icons/all-files/fi/FiLayers';
import { FiMoon } from '@react-icons/all-files/fi/FiMoon';
import { FiPackage } from '@react-icons/all-files/fi/FiPackage';
import { FiSliders } from '@react-icons/all-files/fi/FiSliders';
import { FiSun } from '@react-icons/all-files/fi/FiSun';
import { FiZap } from '@react-icons/all-files/fi/FiZap';
import type { Project } from '@/data/projects';
import { EASE, Reveal } from './shared';

const COMPONENTS = [
  'Button',
  'Card',
  'Input',
  'Tabs',
  'Dialog',
  'Toast',
  'Dropdown',
  'Slider'
];
const ACCENTS = [
  { name: 'violet', value: '#A855F7', to: '#EC4899' },
  { name: 'cyan', value: '#22D3EE', to: '#3B82F6' },
  { name: 'lime', value: '#A3E635', to: '#14B8A6' }
];

const METRICS = [
  ['30+', 'components'],
  ['100%', 'keyboard ready'],
  ['0', 'theme lock-in'],
  ['4×', 'quality gates']
];

function ToriMark() {
  return (
    <div
      className="relative flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-[0_12px_45px_rgba(168,85,247,0.25)] backdrop-blur-xl"
      aria-label="TorisUI"
    >
      <span className="bg-gradient-to-br from-violet-300 to-pink-300 bg-clip-text text-2xl font-black text-transparent">
        T
      </span>
      <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-[#070510] bg-cyan-300" />
    </div>
  );
}

function HeroPreview({ reduce }: { reduce: boolean }) {
  const [activeTab, setActiveTab] = useState<'Design' | 'Code'>('Design');
  const [enabled, setEnabled] = useState(true);
  const [toast, setToast] = useState(false);

  const showToast = () => {
    setToast(true);
    window.setTimeout(() => setToast(false), 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.24, duration: 0.9, ease: EASE }}
      className="relative mx-auto w-full max-w-[560px]"
      style={{ perspective: 1000 }}
    >
      <div
        aria-hidden
        className="absolute -inset-16 rounded-full bg-violet-500/20 blur-[90px]"
      />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#100D1C]/80 p-3 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-rose-400" />
            <span className="size-2.5 rounded-full bg-amber-300" />
            <span className="size-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
            Live preview
          </span>
        </div>

        <div className="relative overflow-hidden rounded-[1.45rem] border border-white/10 bg-gradient-to-br from-[#1A1530] to-[#090712] p-5 sm:p-7">
          <div
            className="flex rounded-xl bg-black/25 p-1"
            role="tablist"
            aria-label="프리뷰 모드"
          >
            {(['Design', 'Code'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className="relative flex-1 rounded-lg px-3 py-2 text-xs font-semibold"
              >
                {activeTab === tab && (
                  <motion.span
                    layoutId="hero-preview-tab"
                    className="absolute inset-0 rounded-lg bg-white/10"
                    transition={{ duration: reduce ? 0 : 0.25 }}
                  />
                )}
                <span
                  className={`relative ${activeTab === tab ? 'text-white' : 'text-white/40'}`}
                >
                  {tab}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'Design' ? (
              <motion.div
                key="design"
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-full bg-violet-400/15 px-2.5 py-1 text-[10px] font-bold text-violet-200">
                      PRO PLAN
                    </span>
                    <h3 className="mt-4 text-xl font-bold">
                      Build without friction.
                    </h3>
                    <p className="mt-2 text-sm text-white/45">
                      Accessible components with a soft-glass soul.
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={enabled}
                    onClick={() => setEnabled((value) => !value)}
                    className={`relative h-7 w-12 rounded-full p-1 transition-colors ${enabled ? 'bg-violet-500' : 'bg-white/15'}`}
                  >
                    <motion.span
                      layout
                      className="block size-5 rounded-full bg-white shadow"
                      animate={{ x: enabled ? 20 : 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 450,
                        damping: 30
                      }}
                    />
                  </button>
                </div>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: enabled ? '76%' : '32%' }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-400 to-pink-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={showToast}
                  className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-sm font-bold shadow-[0_10px_35px_rgba(168,85,247,0.28)] transition hover:brightness-110 active:scale-[0.98]"
                >
                  Launch experience <FiChevronRight aria-hidden />
                </button>
              </motion.div>
            ) : (
              <motion.pre
                key="code"
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-5 min-h-[240px] overflow-x-auto rounded-2xl border border-white/10 bg-[#070510] p-5 font-mono text-xs leading-6 text-slate-300"
              >
                <code>
                  <span className="text-pink-300">import</span>{' '}
                  {'{ Button, Card }'}{' '}
                  <span className="text-pink-300">from</span>{' '}
                  <span className="text-emerald-300">
                    &apos;@toris-dev/ui&apos;
                  </span>
                  ;{`\n\n`}
                  <span className="text-violet-300">&lt;Card</span> interactive
                  <span className="text-violet-300">&gt;</span>
                  {`\n  `}
                  <span className="text-violet-300">&lt;Button</span> variant=
                  <span className="text-emerald-300">&quot;glow&quot;</span>
                  <span className="text-violet-300">&gt;</span>
                  {`\n    `}Launch experience{`\n  `}
                  <span className="text-violet-300">&lt;/Button&gt;</span>
                  {`\n`}
                  <span className="text-violet-300">&lt;/Card&gt;</span>
                </code>
              </motion.pre>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                className="absolute bottom-6 right-6 flex items-center gap-3 rounded-xl border border-emerald-300/20 bg-[#111827]/95 px-4 py-3 text-xs shadow-2xl"
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-emerald-400 text-slate-950">
                  <FiCheck />
                </span>
                Experience launched
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function Playground({ reduce }: { reduce: boolean }) {
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [radius, setRadius] = useState(24);
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  const foreground = isDark ? '#FFFFFF' : '#18181B';
  const muted = isDark ? '#A1A1AA' : '#52525B';
  const surface = isDark ? '#11111A' : '#FFFFFF';
  const canvas = isDark ? '#09090F' : '#F4F4F5';

  return (
    <section
      id="playground"
      className="border-y border-white/10 bg-white/[0.025] px-5 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-pink-300">
            Token playground
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            당신의 제품처럼 보이게.
          </h2>
          <p className="mt-5 leading-relaxed text-white/50">
            색상, 라운딩, 테마를 바꿔도 컴포넌트의 상태·접근성·상호작용은 그대로
            유지됩니다.
          </p>
        </Reveal>

        <div className="mt-12 grid overflow-hidden rounded-[2rem] border border-white/10 bg-[#0C0A14] lg:grid-cols-[280px_1fr]">
          <aside className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2 text-sm font-bold">
              <FiSliders className="text-violet-300" /> Theme controls
            </div>
            <div className="mt-7">
              <p className="text-xs font-semibold text-white/40">Accent</p>
              <div className="mt-3 flex gap-2">
                {ACCENTS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setAccent(color)}
                    aria-label={`${color.name} 액센트`}
                    aria-pressed={accent.name === color.name}
                    className={`size-9 rounded-full border-2 p-1 transition ${accent.name === color.name ? 'border-white' : 'border-transparent'}`}
                  >
                    <span
                      className="block size-full rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${color.value}, ${color.to})`
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
            <label
              className="mt-7 block text-xs font-semibold text-white/40"
              htmlFor="radius-control"
            >
              Radius{' '}
              <span className="float-right font-mono text-white/70">
                {radius}px
              </span>
            </label>
            <input
              id="radius-control"
              type="range"
              min="8"
              max="32"
              value={radius}
              onChange={(event) => setRadius(Number(event.target.value))}
              className="mt-3 w-full accent-violet-400"
            />
            <div className="mt-7">
              <p className="text-xs font-semibold text-white/40">Mode</p>
              <div className="mt-3 grid grid-cols-2 rounded-xl bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => setIsDark(false)}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold ${!isDark ? 'bg-white text-slate-950' : 'text-white/40'}`}
                >
                  <FiSun /> Light
                </button>
                <button
                  type="button"
                  onClick={() => setIsDark(true)}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold ${isDark ? 'bg-white/10 text-white' : 'text-white/40'}`}
                >
                  <FiMoon /> Dark
                </button>
              </div>
            </div>
            <div className="mt-8 border-t border-white/10 pt-5 font-mono text-[10px] leading-5 text-white/35">
              --tori-accent: {accent.value};<br />
              --tori-radius: {radius}px;
              <br />
              --tori-mode: {isDark ? 'dark' : 'light'};
            </div>
          </aside>

          <div
            className="min-h-[500px] p-4 sm:p-8"
            style={{ backgroundColor: canvas, color: foreground }}
          >
            <motion.div
              layout
              transition={{ duration: reduce ? 0 : 0.25 }}
              className="mx-auto max-w-xl border p-6 shadow-2xl"
              style={{
                borderRadius: radius,
                backgroundColor: surface,
                borderColor: isDark ? '#FFFFFF18' : '#18181B18'
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span
                    className="text-xs font-bold"
                    style={{ color: accent.value }}
                  >
                    WORKSPACE
                  </span>
                  <h3 className="mt-2 text-2xl font-bold">Creative systems</h3>
                </div>
                <div className="flex -space-x-2">
                  {['T', 'O', '+3'].map((item, i) => (
                    <span
                      key={item}
                      className="flex size-9 items-center justify-center rounded-full border-2 text-[10px] font-bold"
                      style={{
                        backgroundColor: i === 0 ? accent.value : surface,
                        borderColor: surface,
                        color: i === 0 ? '#fff' : muted
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className="mt-7 flex gap-1 border-b"
                style={{ borderColor: isDark ? '#FFFFFF14' : '#18181B14' }}
                role="tablist"
                aria-label="카드 탭"
              >
                {['Overview', 'Activity', 'Settings'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    className="relative px-3 py-3 text-xs font-semibold"
                    style={{ color: activeTab === tab ? foreground : muted }}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.span
                        layoutId="playground-tab"
                        className="absolute inset-x-1 bottom-0 h-0.5 rounded-full"
                        style={{ backgroundColor: accent.value }}
                      />
                    )}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-7 grid gap-3 sm:grid-cols-2"
                >
                  <div
                    className="border p-4"
                    style={{
                      borderRadius: Math.max(10, radius - 8),
                      borderColor: isDark ? '#FFFFFF14' : '#18181B14'
                    }}
                  >
                    <p className="text-xs" style={{ color: muted }}>
                      {activeTab} score
                    </p>
                    <p className="mt-2 text-3xl font-bold">
                      84
                      <span className="text-sm" style={{ color: muted }}>
                        /100
                      </span>
                    </p>
                    <div
                      className="mt-4 h-1.5 rounded-full"
                      style={{
                        backgroundColor: isDark ? '#FFFFFF14' : '#18181B14'
                      }}
                    >
                      <div
                        className="h-full w-[84%] rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${accent.value}, ${accent.to})`
                        }}
                      />
                    </div>
                  </div>
                  <div
                    className="border p-4"
                    style={{
                      borderRadius: Math.max(10, radius - 8),
                      borderColor: isDark ? '#FFFFFF14' : '#18181B14'
                    }}
                  >
                    <p className="text-xs" style={{ color: muted }}>
                      Status
                    </p>
                    <p className="mt-3 flex items-center gap-2 text-sm font-semibold">
                      <span className="size-2 rounded-full bg-emerald-400" />{' '}
                      All systems fluid
                    </p>
                    <button
                      type="button"
                      className="mt-4 h-8 rounded-lg px-3 text-xs font-bold text-white"
                      style={{
                        background: `linear-gradient(90deg, ${accent.value}, ${accent.to})`
                      }}
                    >
                      View details
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComponentCloud({ reduce }: { reduce: boolean }) {
  return (
    <section className="px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl text-center">
        <Reveal>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
            A growing system
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            기본기를 반복해서 만들지 마세요.
          </h2>
        </Reveal>
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {COMPONENTS.map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, scale: 0.86 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.45, ease: EASE }}
              whileHover={reduce ? undefined : { y: -5, scale: 1.03 }}
              className="rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-3 text-sm font-semibold text-white/70 shadow-[0_14px_40px_rgba(0,0,0,0.15)]"
            >
              <span className="mr-2 text-violet-300">&lt;/&gt;</span>
              {name}
            </motion.div>
          ))}
        </div>
        <Reveal delay={0.1} className="mt-8 text-sm text-white/35">
          그리고 Accordion, Sheet, Popover, Rating, Pagination, Breadcrumb,
          EmptyState…
        </Reveal>
      </div>
    </section>
  );
}

export default function TorisUiLanding({ project }: { project: Project }) {
  const reduce = useReducedMotion() ?? false;

  return (
    <div className="min-h-dvh overflow-x-clip bg-[#070510] pt-24 text-white selection:bg-pink-400 selection:text-slate-950">
      <section className="relative overflow-hidden px-5 pb-24 pt-14 sm:pb-32 sm:pt-20">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(196,181,253,0.4)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        />
        <motion.div
          aria-hidden
          animate={reduce ? undefined : { x: [0, 60, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-40 -top-28 size-[34rem] rounded-full bg-violet-600/20 blur-[130px]"
        />
        <motion.div
          aria-hidden
          animate={reduce ? undefined : { x: [0, -50, 0], y: [0, 60, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-40 top-1/4 size-[32rem] rounded-full bg-pink-600/15 blur-[130px]"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
              >
                <FiArrowLeft /> All projects
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.65, ease: EASE }}
              className="mt-10 flex items-center gap-4"
            >
              <ToriMark />
              <div>
                <p className="font-bold">TorisUI Kit</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
                  React interface system
                </p>
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.75, ease: EASE }}
              className="mt-8 text-5xl font-bold tracking-[-0.055em] sm:text-7xl lg:text-8xl"
            >
              Interfaces that
              <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
                feel alive.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.7, ease: EASE }}
              className="mt-7 max-w-xl text-lg leading-relaxed text-white/50"
            >
              모던하고 유연하며 접근 가능한 React UI 시스템. 인터랙션의 디테일은
              이미 완성되어 있으니, 당신은 제품의 차이에 집중하세요.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.65, ease: EASE }}
              className="mt-9 flex flex-wrap gap-3"
            >
              <a
                href="https://www.npmjs.com/package/@toris-dev/ui"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-7 text-sm font-bold shadow-[0_14px_55px_rgba(168,85,247,0.3)] transition hover:scale-[1.03]"
              >
                <FiPackage /> Install UI
              </a>
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 text-sm font-semibold transition hover:bg-white/10"
              >
                <FiGithub /> GitHub
              </a>
            </motion.div>
          </div>
          <HeroPreview reduce={reduce} />
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] px-5 py-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-4">
          {METRICS.map(([value, label]) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold sm:text-3xl">{value}</p>
              <p className="mt-1 text-xs text-white/35">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-2xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
              Product principles
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              예쁜 상태를 넘어, 모든 상태를 설계합니다.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: FiLayers,
                title: 'Composable',
                desc: '작은 컴포넌트를 조합해 복잡한 제품 흐름까지. 스타일과 구조를 강요하지 않습니다.'
              },
              {
                icon: FiZap,
                title: 'Interactive',
                desc: 'hover·focus·loading·error·reduced-motion까지 제품다운 반응을 기본값으로 제공합니다.'
              },
              {
                icon: FiCheck,
                title: 'Accessible',
                desc: '키보드 탐색, focus trap, ARIA 관계와 forced-colors 대응을 테스트 가능한 계약으로 관리합니다.'
              }
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.6, ease: EASE }}
                whileHover={reduce ? undefined : { y: -6 }}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.075] to-white/[0.025] p-7"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-violet-400/15 text-violet-200">
                  <Icon size={22} />
                </span>
                <h3 className="mt-6 text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/45">
                  {desc}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <Playground reduce={reduce} />
      <ComponentCloud reduce={reduce} />

      <section className="px-5 pb-32 pt-12 text-center sm:pb-40">
        <Reveal className="relative mx-auto max-w-3xl overflow-hidden rounded-[2.75rem] border border-white/10 bg-gradient-to-br from-violet-500/15 via-white/[0.05] to-pink-500/15 px-6 py-16 sm:px-12">
          <div
            aria-hidden
            className="absolute inset-x-1/4 top-0 h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent"
          />
          <ToriMark />
          <h2 className="mt-7 text-3xl font-bold tracking-tight sm:text-5xl">
            Build fluid. Ship with confidence.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-white/45">
            30개 이상의 컴포넌트와 검증된 품질 게이트를 당신의 다음 React 제품에
            가져오세요.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="https://www.npmjs.com/package/@toris-dev/ui"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-bold text-slate-950 transition hover:scale-[1.03]"
            >
              <FiPackage /> npm install
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
