'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import type { Project } from '@/data/projects';
import { cn } from '@/utils/style';
import { AccentButton, EASE, GhostButton, Reveal } from './shared';

/* ---------- 인스타그램 그라디언트 상수 ---------- */
const IG_FROM = '#E1306C';
const IG_TO = '#F77737';
const igGradient = {
  backgroundImage: `linear-gradient(90deg, ${IG_FROM}, ${IG_TO})`
};

const card =
  'rounded-2xl border border-slate-900/10 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]';

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
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
  cpu: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
    </>
  ),
  layers: (
    <>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  rss: (
    <>
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="8 12 11 15 16 9" />
    </>
  ),
  send: (
    <>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-pink-600 dark:text-pink-400">
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

/* ---------- 히어로: 터미널 퀵스타트 ---------- */
const TERMINAL_LINES = [
  { prompt: true, text: 'uv sync' },
  { prompt: true, text: 'uv run pipeline init' },
  { prompt: true, text: 'uv run pipeline run --fixture fixtures/releases.json' },
  { prompt: false, text: '✓ 4 sources → 12 items → 6 cards rendered' },
  { prompt: false, text: 'review 대기 — 승인 후에만 게시됩니다' }
];

function TerminalBlock() {
  const reduce = useReducedMotion();
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-900/15 bg-slate-950 shadow-2xl dark:border-white/10">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
        <span className="size-2.5 rounded-full bg-pink-500" />
        <span className="size-2.5 rounded-full bg-orange-400" />
        <span className="size-2.5 rounded-full bg-slate-600" />
        <p className="ml-2 text-[11px] font-medium text-slate-400">
          instagram_pipeline — zsh
        </p>
      </div>
      <div className="space-y-2 px-4 py-4 font-mono text-[12px] leading-relaxed sm:text-[13px]">
        {TERMINAL_LINES.map((line, i) => (
          <motion.p
            key={i}
            initial={reduce ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: reduce ? 0.01 : 0.4,
              delay: reduce ? 0 : 0.5 + i * 0.35,
              ease: EASE
            }}
            className={cn(
              'break-all',
              line.prompt ? 'text-slate-200' : 'text-emerald-400'
            )}
          >
            {line.prompt && (
              <span className="mr-2 select-none text-pink-400">$</span>
            )}
            {line.text}
          </motion.p>
        ))}
        <p className="flex items-center text-slate-200">
          <span className="mr-2 select-none text-pink-400">$</span>
          {reduce ? (
            <span className="inline-block h-4 w-2 bg-slate-400" aria-hidden />
          ) : (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
              className="inline-block h-4 w-2 bg-slate-400"
              aria-hidden
            />
          )}
        </p>
      </div>
    </div>
  );
}

function Hero({ project }: { project: Project }) {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-32">
      {/* 그리드 배경 */}
      <div
        className="pointer-events-none absolute inset-0 text-slate-900 opacity-[0.05] dark:text-white"
        style={{
          backgroundImage:
            'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-24 size-96 rounded-full bg-pink-500/15 blur-3xl dark:bg-pink-500/20" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full bg-orange-400/15 blur-3xl dark:bg-orange-400/20" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div className="flex flex-wrap gap-2">
            {[project.status, project.year, project.category].map((pill) => (
              <span
                key={pill}
                className="rounded-full border border-pink-600/25 bg-pink-500/10 px-3 py-1 text-[11px] font-bold text-pink-700 dark:border-pink-400/25 dark:bg-pink-400/10 dark:text-pink-300"
              >
                {pill}
              </span>
            ))}
          </div>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            Instagram Pipeline
            <span
              className="mt-2 block bg-clip-text text-3xl text-transparent sm:text-4xl lg:text-5xl"
              style={igGradient}
            >
              AI 릴리즈 뉴스를 카드뉴스로
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
            <GhostButton href="#pipeline-flow">파이프라인 보기</GhostButton>
          </div>
        </motion.div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
        >
          <TerminalBlock />
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- 1. 문제 → 목표 ---------- */
const VENDORS = ['Claude', 'Codex', 'Grok', 'Gemini'];

function ProblemSection() {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Problem → Goal"
        title="매일 4곳을 좇는 대신, 승인 한 번"
        sub="AI 벤더 4곳의 릴리즈 소식을 매일 직접 확인하고, 요약하고, 카드로 만들고, 올리는 일 — 사람이 반복하기엔 너무 비싼 루프입니다."
      />
      <Reveal className="mx-auto mt-12 max-w-3xl">
        <div className={cn(card, 'p-6 sm:p-8')}>
          <div className="flex flex-wrap justify-center gap-2.5">
            {VENDORS.map((v) => (
              <span
                key={v}
                className="rounded-full border border-slate-900/10 bg-slate-900/5 px-4 py-1.5 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                {v}
              </span>
            ))}
          </div>
          <p className="mt-6 text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Instagram Pipeline은{' '}
            <span className="font-bold text-slate-900 dark:text-white">
              수집 → 요약 → 디자인 → 게시
            </span>
            의 전 과정을 자동화하고, 사람에게는 단 하나의 결정만 남깁니다 —{' '}
            <span
              className="bg-clip-text font-bold text-transparent"
              style={igGradient}
            >
              게시할까, 말까.
            </span>
          </p>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- 2. 핵심 기능 ---------- */
function FeaturesSection({ project }: { project: Project }) {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Features"
        title="도구답게, 정밀하게"
        sub="수집 전략부터 게시 안전장치까지 — 파이프라인의 네 기둥."
      />
      <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2">
        {project.features.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.08}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: EASE }}
              className={cn(
                card,
                'h-full p-6 shadow-sm transition-shadow duration-300 hover:shadow-[0_16px_48px_rgba(225,48,108,0.22)] dark:hover:shadow-[0_16px_48px_rgba(247,119,55,0.18)]'
              )}
            >
              <span
                className="flex size-10 items-center justify-center rounded-xl text-white"
                style={igGradient}
              >
                <Ico className="size-5">{paths[f.icon] ?? paths.globe}</Ico>
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

/* ---------- 3. 파이프라인 플로우 (센터피스) ---------- */
const STAGES = [
  { icon: 'rss', title: '수집', desc: 'RSS · poll · scrape' },
  { icon: 'cpu', title: 'LLM 요약·스코어', desc: '중요도 0~100' },
  { icon: 'image', title: '카드 렌더', desc: 'Playwright JPEG' },
  { icon: 'check', title: '승인', desc: 'review 갤러리' },
  { icon: 'send', title: '게시', desc: 'Instagram · Threads' }
];

function Connector() {
  const reduce = useReducedMotion();
  return (
    <div
      className="flex items-center justify-center py-1 lg:flex-1 lg:px-1 lg:py-0"
      aria-hidden
    >
      {/* 모바일: 세로 점선 */}
      <motion.span
        className="block h-9 w-0.5 lg:hidden"
        style={{
          backgroundImage: `repeating-linear-gradient(180deg, ${IG_FROM} 0 5px, transparent 5px 11px)`
        }}
        animate={reduce ? undefined : { backgroundPositionY: ['0px', '11px'] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      />
      {/* 데스크톱: 가로 점선 */}
      <motion.span
        className="hidden h-0.5 w-full lg:block"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, ${IG_FROM} 0 5px, transparent 5px 11px)`
        }}
        animate={reduce ? undefined : { backgroundPositionX: ['0px', '11px'] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

function StageNode({
  stage,
  index
}: {
  stage: (typeof STAGES)[number];
  index: number;
}) {
  return (
    <Reveal delay={index * 0.1} y={20} className="w-full lg:w-auto lg:flex-1">
      <div className={cn(card, 'relative px-4 py-5 text-center shadow-sm')}>
        <span
          className="absolute -top-2.5 left-1/2 flex size-5 -translate-x-1/2 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={igGradient}
        >
          {index + 1}
        </span>
        <span
          className="mx-auto flex size-11 items-center justify-center rounded-xl text-white"
          style={igGradient}
        >
          <Ico className="size-5">{paths[stage.icon]}</Ico>
        </span>
        <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
          {stage.title}
        </p>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          {stage.desc}
        </p>
      </div>
    </Reveal>
  );
}

const MOCK_CARDS = [
  {
    title: 'Claude 4.6 릴리즈 요약',
    sub: '컨텍스트 확장 · 에이전트 개선',
    rotate: -6,
    z: 'z-10'
  },
  {
    title: 'Codex 업데이트 브리핑',
    sub: 'CLI 워크플로 강화',
    rotate: 0,
    z: 'z-20'
  },
  {
    title: 'Gemini 주간 하이라이트',
    sub: '멀티모달 성능 향상',
    rotate: 6,
    z: 'z-10'
  }
];

function MockCarousel() {
  return (
    <Reveal delay={0.15} className="mt-16">
      <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
        렌더 결과 미리보기
      </p>
      <div className="mt-8 flex items-center justify-center">
        {MOCK_CARDS.map((c, i) => (
          <motion.div
            key={c.title}
            whileHover={{ y: -8 }}
            transition={{ duration: 0.25, ease: EASE }}
            className={cn(
              'relative w-40 shrink-0 overflow-hidden rounded-xl border border-slate-900/10 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900 sm:w-48',
              c.z,
              i !== 0 && '-ml-10 sm:-ml-8'
            )}
            style={{ rotate: c.rotate }}
          >
            <div className="h-2" style={igGradient} />
            <div className="flex aspect-square flex-col justify-between p-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-pink-600 dark:text-pink-400">
                  AI Release News
                </p>
                <p className="mt-2 text-sm font-extrabold leading-snug text-slate-900 dark:text-white">
                  {c.title}
                </p>
                <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {c.sub}
                </p>
              </div>
              <p className="border-t border-slate-900/10 pt-2 text-[8px] font-semibold text-slate-400 dark:border-white/10 dark:text-slate-500">
                비공식 요약 · Unofficial
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </Reveal>
  );
}

function PipelineFlowSection() {
  return (
    <section id="pipeline-flow" className="scroll-mt-24 px-6 py-24">
      <Head
        eyebrow="Pipeline"
        title="다섯 단계, 하나의 흐름"
        sub="수집부터 게시까지 — 각 단계는 독립적으로 실행·검증할 수 있고, 게시는 승인 뒤에만 일어납니다."
      />
      <div className="mx-auto mt-14 flex max-w-5xl flex-col items-stretch lg:flex-row lg:items-center">
        {STAGES.map((stage, i) => (
          <div
            key={stage.title}
            className="contents"
          >
            {i > 0 && <Connector />}
            <StageNode stage={stage} index={i} />
          </div>
        ))}
      </div>
      <MockCarousel />
    </section>
  );
}

/* ---------- 4. 안전 · 엔지니어링 ---------- */
const SAFETY = [
  {
    icon: 'shield',
    title: '승인 모드 기본 (게시 opt-in)',
    desc: 'review가 기본값. 게시는 명시적 플래그로만 — 실수로 올라가는 카드는 없습니다.'
  },
  {
    icon: 'database',
    title: '토큰은 SQLite credentials (.env 아님)',
    desc: '액세스 토큰을 .env 대신 SQLite credentials 테이블에 저장해 유출 표면을 줄입니다.'
  },
  {
    icon: 'bell',
    title: 'R2 TTL 삭제 · 소스 열화 경보',
    desc: '렌더 산출물은 R2에서 TTL로 자동 삭제, 수집 소스가 오래 조용하면 stale 경보를 울립니다.'
  }
];

function SafetySection() {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Safety"
        title="자동화보다 먼저, 안전장치"
        sub="게시 자동화 도구가 반드시 갖춰야 할 세 가지 원칙."
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
        {SAFETY.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.1}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: EASE }}
              className={cn(card, 'h-full p-6 shadow-sm')}
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-pink-500/15 text-pink-600 dark:bg-pink-400/15 dark:text-pink-400">
                <Ico className="size-5">{paths[s.icon]}</Ico>
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

/* ---------- 5. 기술 스택 ---------- */
const STACK_GROUPS = [
  { label: 'Runtime', chips: ['Python', 'uv'] },
  { label: '렌더', chips: ['Playwright'] },
  { label: 'LLM', chips: ['Claude CLI (구독 로그인 · API 키 불필요)'] },
  { label: '배포', chips: ['Meta Graph API', 'Threads'] },
  { label: '저장', chips: ['Cloudflare R2', 'SQLite'] }
];

function TechSection() {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Stack"
        title="로컬에서 완결되는 스택"
        sub="서버 없이, API 키 없이 — 내 머신에서 끝까지 도는 파이프라인."
      />
      <div className="mx-auto mt-12 max-w-3xl space-y-4">
        {STACK_GROUPS.map((g, i) => (
          <Reveal key={g.label} delay={i * 0.06} y={16}>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-5">
              <p className="w-24 shrink-0 text-xs font-bold uppercase tracking-[0.18em] text-pink-600 dark:text-pink-400">
                {g.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {g.chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-slate-900/10 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-pink-500/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-pink-400/50"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- 6. 최종 CTA ---------- */
function FinalCta({ project }: { project: Project }) {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden px-6 py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/10 blur-3xl dark:bg-pink-500/15" />
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative mx-auto max-w-xl text-center"
      >
        <span
          className="mx-auto flex size-12 items-center justify-center rounded-2xl text-white shadow-lg"
          style={igGradient}
        >
          <Ico className="size-6">{paths.send}</Ico>
        </span>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          다음 릴리즈는{' '}
          <span className="bg-clip-text text-transparent" style={igGradient}>
            파이프라인
          </span>
          이 정리합니다
        </h2>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          코드 전체가 공개되어 있습니다. 클론해서 나만의 뉴스 채널을
          자동화해 보세요.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
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
            className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-500 dark:text-slate-400 dark:hover:text-white"
          >
            다른 프로젝트 보기 →
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

export default function InstaPipelineLanding({
  project
}: {
  project: Project;
}) {
  return (
    <div className="overflow-x-clip bg-slate-50 text-slate-900 dark:bg-[#0a0508] dark:text-white">
      <Hero project={project} />
      <ProblemSection />
      <FeaturesSection project={project} />
      <PipelineFlowSection />
      <SafetySection />
      <TechSection />
      <FinalCta project={project} />
      <LandingFooter project={project} />
    </div>
  );
}
