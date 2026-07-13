'use client';

import { forwardRef, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform
} from 'framer-motion';
import { FiArrowRight } from '@react-icons/all-files/fi/FiArrowRight';
import { FiArrowUpRight } from '@react-icons/all-files/fi/FiArrowUpRight';
import { FiGithub } from '@react-icons/all-files/fi/FiGithub';
import { FiHeart } from '@react-icons/all-files/fi/FiHeart';
import RepositoryAtlas from '@/components/projects/RepositoryAtlas';
import { githubRepositories } from '@/data/githubRepositories';
import {
  moreProjects,
  projects,
  type Project,
  type ProjectTag
} from '@/data/projects';
import { cn } from '@/utils/style';

/** Expo-out — Apple 스타일 감속 이징 */
const EASE = [0.16, 1, 0.3, 1] as const;

const MARQUEE_ITEMS = [
  '한붓길 정원',
  '밈캐치',
  'asyncraft',
  'TorisUI',
  '21n Apps',
  'SnapMate',
  'Bubble Bible',
  '동네 칠하기 대작전',
  '청년머니가이드',
  '별빛 온실',
  '30초 배구왕',
  'toris-docs',
  'Product Growth Skills',
  'Next.js',
  'React',
  'TypeScript',
  'Rust',
  'Tauri',
  'Flutter',
  'React Native',
  'Python',
  'Solana',
  'Supabase',
  'Firebase',
  'Local LLM'
];

/** 필터 탭 순서 (데이터에 존재하는 태그만 렌더) */
const FILTER_ORDER: ProjectTag[] = [
  'Company',
  'Personal',
  'Web3',
  'Mobile',
  'Frontend',
  'Fullstack'
];

/* -------------------------------- 상태 배지 -------------------------------- */

const STATUS_STYLE: Record<Project['status'], { dot: string; text: string }> = {
  '운영 중': {
    dot: 'bg-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-300'
  },
  '개발 중': {
    dot: 'bg-amber-400',
    text: 'text-amber-600 dark:text-amber-300'
  },
  출시: { dot: 'bg-sky-400', text: 'text-sky-600 dark:text-sky-300' }
};

function StatusBadge({ status }: { status: Project['status'] }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {status}
    </span>
  );
}

/* ---------------------------------- Hero ---------------------------------- */

function AmbientBackground() {
  const reduce = useReducedMotion();
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <motion.div
        className="absolute -left-40 -top-40 size-[34rem] rounded-full opacity-20 blur-[120px] dark:opacity-30"
        style={{
          background: 'radial-gradient(circle, #6366F1, transparent 70%)'
        }}
        animate={reduce ? undefined : { x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-40 top-1/4 size-[30rem] rounded-full opacity-15 blur-[120px] dark:opacity-25"
        style={{
          background: 'radial-gradient(circle, #F43F5E, transparent 70%)'
        }}
        animate={reduce ? undefined : { x: [0, -50, 0], y: [0, 60, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 size-[28rem] rounded-full opacity-10 blur-[120px] dark:opacity-20"
        style={{
          background: 'radial-gradient(circle, #22C55E, transparent 70%)'
        }}
        animate={reduce ? undefined : { x: [0, 40, 0], y: [0, -50, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-0 text-slate-900 opacity-5 dark:text-white dark:opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
          backgroundSize: '72px 72px'
        }}
      />
    </div>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const words = ['아이디어를', '실험하고,', '제품으로', '만듭니다'];

  return (
    <section
      ref={ref}
      className="relative flex min-h-[90dvh] flex-col items-center justify-center px-4"
    >
      <AmbientBackground />
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 mx-auto max-w-5xl text-center"
      >
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-slate-900/5 px-4 py-1.5 text-xs font-medium tracking-widest text-slate-600 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          PROJECTS
        </motion.span>

        <h1 className="mt-8 text-5xl font-bold leading-[1.08] tracking-tight text-slate-900 dark:text-white sm:text-6xl md:text-7xl lg:text-8xl">
          {words.map((word, i) => (
            <motion.span
              key={word}
              className={cn(
                'inline-block whitespace-pre',
                i === 3 &&
                  'bg-gradient-to-r from-indigo-400 via-rose-400 to-emerald-400 bg-clip-text text-transparent'
              )}
              initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, delay: 0.15 + i * 0.12, ease: EASE }}
            >
              {word}
              {i < words.length - 1 ? ' ' : ''}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
          className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg"
        >
          오픈소스 라이브러리와 디자인 시스템부터 AI 자동화, 모바일, Web3까지 —
          아이디어를 실제로 쓰이는 제품으로 만드는 풀스택 개발자의 실험실입니다.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85, ease: EASE }}
          className="mt-10 flex flex-wrap items-center justify-center gap-8 sm:gap-14"
        >
          {[
            {
              value: `${projects.length + moreProjects.length}+`,
              label: '프로젝트'
            },
            { value: String(githubRepositories.length), label: '공개 저장소' },
            { value: '5', label: '주력 언어' }
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-10 w-6 items-start justify-center rounded-full border border-slate-900/20 p-1.5 dark:border-white/20"
        >
          <div className="h-2 w-1 rounded-full bg-slate-900/40 dark:bg-white/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* --------------------------------- Marquee --------------------------------- */

function TechMarquee() {
  const reduce = useReducedMotion();
  const row = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div
      aria-hidden
      className="relative overflow-hidden border-y border-slate-900/10 bg-slate-900/[0.03] py-5 dark:border-white/5 dark:bg-white/[0.02]"
      style={{
        maskImage:
          'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)'
      }}
    >
      <motion.div
        className="flex w-max gap-10 pr-10"
        animate={reduce ? undefined : { x: ['0%', '-50%'] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
      >
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-10 text-sm font-medium tracking-widest text-slate-600 dark:text-slate-400"
          >
            {item}
            <span className="size-1 rounded-full bg-slate-400 dark:bg-slate-700" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ------------------------------- Project Card ------------------------------ */

const ProjectCard = forwardRef<
  HTMLDivElement,
  { project: Project; index: number }
>(function ProjectCard({ project, index }, ref) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.06, ease: EASE }}
      className="group relative"
    >
      <Link
        href={`/projects/${project.slug}`}
        aria-label={`${project.name} 프로젝트 자세히 보기`}
        className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-900/10 bg-white/70 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-slate-900/20 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:border-white/20"
      >
        {/* 호버 액센트 글로우 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 rounded-3xl opacity-0 ring-1 ring-inset transition-opacity duration-500 group-hover:opacity-100"
          style={{ boxShadow: `inset 0 0 0 1px ${project.accent.glow}` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px z-0 rounded-3xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-60"
          style={{
            background: `radial-gradient(400px circle at 50% 0%, ${project.accent.glow}, transparent 65%)`
          }}
        />

        <div className="relative aspect-[16/9] w-full overflow-hidden">
          {imageFailed ? (
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(145deg, ${project.accent.from}22, ${project.accent.to}55), #0b1020`
              }}
              role="img"
              aria-label={`${project.name} 브랜드 그래픽`}
            >
              <div
                aria-hidden
                className="absolute size-44 rounded-full border border-white/15"
              >
                <motion.span
                  className="absolute left-1/2 top-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ backgroundColor: project.accent.to }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                />
              </div>
              <span className="relative max-w-[80%] break-words text-center font-mono text-xl font-bold tracking-tight text-white/90">
                {project.name}
              </span>
            </div>
          ) : (
            <Image
              src={project.image}
              alt={`${project.name} 서비스 화면 목업`}
              fill
              loading={index === 0 ? 'eager' : 'lazy'}
              onError={() => setImageFailed(true)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          )}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, transparent 45%, rgba(5,8,16,0.35) 80%, rgba(5,8,16,0.8) 100%)'
            }}
          />
          <span
            className="absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm"
            style={{
              background: `linear-gradient(90deg, ${project.accent.from}, ${project.accent.to})`
            }}
          >
            {project.category}
          </span>
          <span className="absolute right-4 top-4">
            <StatusBadge status={project.status} />
          </span>
        </div>

        <div className="relative z-10 flex flex-1 flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
              {project.name}
            </h3>
            <FiArrowUpRight
              aria-hidden
              className="mt-0.5 size-5 shrink-0 text-slate-400 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-900 dark:group-hover:text-white"
            />
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {project.tagline}
          </p>

          {/* 핵심 기능 2개 */}
          <ul className="mt-4 space-y-1.5">
            {project.features.slice(0, 2).map((f) => (
              <li
                key={f.title}
                className="flex items-start gap-2 text-[13px] text-slate-600 dark:text-slate-300"
              >
                <span
                  aria-hidden
                  className="mt-1.5 size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: project.accent.from }}
                />
                <span className="line-clamp-1">{f.title}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-5">
            {project.tech.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-md border border-slate-900/10 bg-slate-900/5 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                {t}
              </span>
            ))}
            <span className="ml-auto text-[11px] tabular-nums text-slate-500 dark:text-slate-600">
              {project.year}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

/* ------------------------------ Filter + Grid ------------------------------ */

function ProjectGallery() {
  const [active, setActive] = useState<'All' | ProjectTag>('All');

  const filters = useMemo<Array<'All' | ProjectTag>>(() => {
    const present = FILTER_ORDER.filter((tag) =>
      projects.some((p) => p.tags.includes(tag))
    );
    return ['All', ...present];
  }, []);

  const visible = useMemo(
    () =>
      active === 'All'
        ? projects
        : projects.filter((p) => p.tags.includes(active)),
    [active]
  );

  return (
    <section id="projects" className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE }}
        className="mb-8 flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Projects
          </h2>
          <p className="mt-3 max-w-lg text-slate-600 dark:text-slate-400">
            각 프로젝트를 클릭하면 전용 랜딩 페이지로 이동합니다. 실제
            서비스처럼 직접 만든 제품들을 둘러보세요.
          </p>
        </div>
        <span className="text-sm tabular-nums text-slate-500">
          {String(visible.length).padStart(2, '0')} / {projects.length}
        </span>
      </motion.div>

      {/* 필터 탭 */}
      <div
        role="tablist"
        aria-label="프로젝트 필터"
        className="mb-10 flex flex-wrap gap-2"
      >
        {filters.map((f) => {
          const selected = active === f;
          const count =
            f === 'All'
              ? projects.length
              : projects.filter((p) => p.tags.includes(f)).length;
          return (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(f)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60',
                selected
                  ? 'border-transparent bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'border-slate-900/10 bg-slate-900/[0.03] text-slate-600 hover:bg-slate-900/[0.06] dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.07]'
              )}
            >
              {f}
              <span
                className={cn(
                  'text-[11px] tabular-nums',
                  selected ? 'opacity-70' : 'text-slate-400 dark:text-slate-500'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <motion.div
        layout
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {visible.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} />
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

/* ------------------------------ More Projects ------------------------------ */

function MoreProjects() {
  if (moreProjects.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pb-28">
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE }}
        className="text-sm font-semibold uppercase tracking-widest text-slate-500"
      >
        그 외 실험들
      </motion.h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {moreProjects.map((p, i) => (
          <motion.a
            key={p.name}
            href={p.github}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
            whileTap={{ scale: 0.98 }}
            className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-900/10 bg-white/70 p-5 shadow-sm transition-colors duration-300 hover:border-slate-900/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:border-white/25"
          >
            <div>
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <FiGithub aria-hidden className="size-4 text-slate-500" />
                {p.name}
              </div>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                {p.description}
              </p>
              <span className="mt-2 inline-block text-[11px] font-medium tracking-wide text-slate-600 dark:text-slate-400">
                {p.tech}
              </span>
            </div>
            <FiArrowUpRight
              aria-hidden
              className="size-5 shrink-0 text-slate-500 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-900 dark:text-slate-600 dark:group-hover:text-white"
            />
          </motion.a>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------- CTA ----------------------------------- */

function BottomCta() {
  return (
    <section className="relative overflow-hidden px-4 pb-32 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] border border-slate-900/10 bg-gradient-to-b from-slate-900/[0.04] to-slate-900/[0.01] px-6 py-16 text-center backdrop-blur-md dark:border-white/10 dark:from-white/[0.06] dark:to-white/[0.02] sm:px-16"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(500px circle at 50% 120%, rgba(99,102,241,0.25), transparent 70%)'
          }}
        />
        <h2 className="relative text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          함께 만들고 싶은 것이 있나요?
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-slate-600 dark:text-slate-400">
          새로운 아이디어, 협업 제안, 기술 이야기 — 무엇이든 환영합니다.
        </p>
        <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/contact"
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-slate-900 px-7 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97] dark:bg-white dark:text-slate-950"
          >
            문의하기
            <FiArrowRight
              aria-hidden
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
          <a
            href="https://github.com/toris-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-900/15 bg-slate-900/5 px-7 text-sm font-semibold text-slate-900 transition-colors duration-200 hover:bg-slate-900/10 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            <FiGithub aria-hidden className="size-4" />
            GitHub
          </a>
        </div>
      </motion.div>
    </section>
  );
}

/* --------------------------------- Support -------------------------------- */

function SupportSection() {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {[12, 28, 47, 68, 84].map((left, index) => (
          <motion.span
            key={left}
            className="absolute bottom-8 size-1.5 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.9)]"
            style={{ left: `${left}%` }}
            animate={
              reduce
                ? undefined
                : {
                    y: [0, -110, -210],
                    x: [0, index % 2 ? 20 : -18, 0],
                    opacity: [0, 1, 0]
                  }
            }
            transition={{
              duration: 4.5 + index * 0.4,
              delay: index * 0.6,
              repeat: Infinity,
              ease: 'easeOut'
            }}
          />
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.75, ease: EASE }}
        className="relative mx-auto grid max-w-5xl overflow-hidden rounded-[2.5rem] border border-amber-300/20 bg-[#17130d] px-6 py-12 text-white shadow-[0_24px_90px_rgba(120,85,20,0.18)] sm:px-12 sm:py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12"
      >
        <div
          aria-hidden
          className="absolute -right-24 -top-24 size-72 rounded-full bg-amber-300/10 blur-[80px]"
        />
        <div className="relative">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-200/70">
            <FiHeart aria-hidden /> Keep the experiments alive
          </div>
          <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
            다음 실험의 작은 요정이 되어주세요.
          </h2>
          <p className="mt-5 max-w-2xl leading-7 text-amber-50/60">
            후원은 도메인, 테스트 기기와 오픈소스 유지 비용에 사용됩니다. 작업을
            유용하게 보셨다면 커피 한 잔으로 다음 프로젝트를 이어갈 수 있습니다.
          </p>
        </div>
        <a
          href="https://fairy.hada.io/@toris-dev"
          target="_blank"
          rel="noopener noreferrer"
          className="relative mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-amber-300 px-7 text-sm font-bold text-[#211708] shadow-[0_12px_40px_rgba(252,211,77,0.22)] transition hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200 lg:mt-0"
        >
          <FiHeart aria-hidden /> 후원으로 응원하기
        </a>
      </motion.div>
    </section>
  );
}

/* --------------------------------- Export ---------------------------------- */

export default function ProjectsLanding() {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-[#050810] dark:text-white">
      <Hero />
      <TechMarquee />
      <ProjectGallery />
      <MoreProjects />
      <RepositoryAtlas />
      <SupportSection />
      <BottomCta />
    </div>
  );
}
