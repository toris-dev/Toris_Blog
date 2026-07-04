'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform
} from 'framer-motion';
import { FiArrowRight } from '@react-icons/all-files/fi/FiArrowRight';
import { FiArrowUpRight } from '@react-icons/all-files/fi/FiArrowUpRight';
import { FiGithub } from '@react-icons/all-files/fi/FiGithub';
import { moreProjects, projects, type Project } from '@/data/projects';
import { cn } from '@/utils/style';

/** Expo-out — Apple 스타일 감속 이징 */
const EASE = [0.16, 1, 0.3, 1] as const;

const MARQUEE_ITEMS = [
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

/* ---------------------------------- Hero ---------------------------------- */

function AmbientBackground() {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-40 -top-40 size-[34rem] rounded-full opacity-30 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #6366F1, transparent 70%)' }}
        animate={reduce ? undefined : { x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-40 top-1/4 size-[30rem] rounded-full opacity-25 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #F43F5E, transparent 70%)' }}
        animate={reduce ? undefined : { x: [0, -50, 0], y: [0, 60, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 size-[28rem] rounded-full opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #22C55E, transparent 70%)' }}
        animate={reduce ? undefined : { x: [0, 40, 0], y: [0, -50, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* 미세 그리드 텍스처 */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
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
      className="relative flex min-h-[92dvh] flex-col items-center justify-center px-4"
    >
      <AmbientBackground />
      <motion.div style={{ y, opacity }} className="relative z-10 mx-auto max-w-5xl text-center">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-widest text-slate-300 backdrop-blur-md"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          PERSONAL PROJECTS
        </motion.span>

        <h1 className="mt-8 text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
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
          className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg"
        >
          여행 플랫폼부터 데스크톱 도구, AI 파이프라인, Web3까지 —
          만들고 싶은 것을 직접 만드는 풀스택 개발자의 실험실입니다.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85, ease: EASE }}
          className="mt-10 flex flex-wrap items-center justify-center gap-8 sm:gap-14"
        >
          {[
            { value: `${projects.length + moreProjects.length}+`, label: '프로젝트' },
            { value: '4', label: '플랫폼 (Web · Desktop · Mobile · CLI)' },
            { value: '5', label: '주력 언어' }
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold tabular-nums text-white sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* 스크롤 힌트 */}
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
          className="flex h-10 w-6 items-start justify-center rounded-full border border-white/20 p-1.5"
        >
          <div className="h-2 w-1 rounded-full bg-white/50" />
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
      className="relative overflow-hidden border-y border-white/5 bg-white/[0.02] py-5"
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
            className="flex items-center gap-10 text-sm font-medium tracking-widest text-slate-600"
          >
            {item}
            <span className="size-1 rounded-full bg-slate-700" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* -------------------------------- Bento Card ------------------------------- */

function TiltCard({ project, index }: { project: Project; index: number }) {
  const reduce = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 200, damping: 24 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 200, damping: 24 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 7);
    rotateX.set(-py * 7);
  };

  const handleLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const spanClass = {
    lg: 'md:col-span-4',
    md: 'md:col-span-3',
    sm: 'md:col-span-2'
  }[project.span];

  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.08, ease: EASE }}
      className={cn('col-span-1 md:col-span-2', spanClass)}
      style={{ perspective: 1200 }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        whileTap={{ scale: 0.98 }}
        className="group relative h-full"
      >
        <Link
          href={`/projects/${project.slug}`}
          aria-label={`${project.name} 프로젝트 자세히 보기`}
          className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md transition-colors duration-300 hover:border-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-400"
        >
          {/* 호버 시 액센트 글로우 */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background: `radial-gradient(600px circle at 50% 0%, ${project.accent.glow}, transparent 60%)`
            }}
          />

          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <Image
              src={project.image}
              alt={`${project.name} 프로젝트 미리보기`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, transparent 30%, rgba(5,8,16,0.55) 75%, rgba(5,8,16,0.92) 100%)`
              }}
            />
            <span
              className="absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide text-white"
              style={{
                background: `linear-gradient(90deg, ${project.accent.from}, ${project.accent.to})`
              }}
            >
              {project.category}
            </span>
          </div>

          <div className="relative flex flex-1 flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-bold text-white">{project.name}</h3>
              <FiArrowUpRight
                aria-hidden
                className="mt-1 size-5 shrink-0 text-slate-500 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
              />
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">
              {project.tagline}
            </p>
            <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
              {project.tech.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-300"
                >
                  {t}
                </span>
              ))}
              <span className="ml-auto text-[11px] tabular-nums text-slate-600">
                {project.year}
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------ More Projects ------------------------------ */

function MoreProjects() {
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
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
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
            className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors duration-300 hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-400"
          >
            <div>
              <div className="flex items-center gap-2 font-semibold text-white">
                <FiGithub aria-hidden className="size-4 text-slate-500" />
                {p.name}
              </div>
              <p className="mt-1.5 text-sm text-slate-400">{p.description}</p>
              <span className="mt-2 inline-block text-[11px] font-medium tracking-wide text-slate-600">
                {p.tech}
              </span>
            </div>
            <FiArrowUpRight
              aria-hidden
              className="size-5 shrink-0 text-slate-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
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
        className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-6 py-16 text-center backdrop-blur-md sm:px-16"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(500px circle at 50% 120%, rgba(99,102,241,0.25), transparent 70%)'
          }}
        />
        <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">
          함께 만들고 싶은 것이 있나요?
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-slate-400">
          새로운 아이디어, 협업 제안, 기술 이야기 — 무엇이든 환영합니다.
        </p>
        <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/contact"
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-slate-950 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
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
            className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
          >
            <FiGithub aria-hidden className="size-4" />
            GitHub
          </a>
        </div>
      </motion.div>
    </section>
  );
}

/* --------------------------------- Export ---------------------------------- */

export default function ProjectsLanding() {
  return (
    <div className="min-h-dvh bg-[#050810] text-white">
      <Hero />
      <TechMarquee />
      <section className="mx-auto max-w-6xl px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-12 flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Featured Projects
            </h2>
            <p className="mt-3 text-slate-400">
              각 프로젝트를 클릭하면 전용 랜딩 페이지로 이동합니다.
            </p>
          </div>
          <span className="text-sm tabular-nums text-slate-600">
            {String(projects.length).padStart(2, '0')} PROJECTS
          </span>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-6">
          {projects.map((project, i) => (
            <TiltCard key={project.slug} project={project} index={i} />
          ))}
        </div>
      </section>
      <MoreProjects />
      <BottomCta />
    </div>
  );
}
