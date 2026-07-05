'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRef } from 'react';
import {
  FaArrowRight,
  FaBlog,
  FaFolderOpen,
  FaUser,
  IoIosArrowDown,
  SiNextDotJs,
  SiReact,
  SiTypescript
} from '@/components/icons';
import { EASE, useIsDesktop, useMouseParallax } from '../shared';

interface HeroSceneProps {
  postCount: number;
  projectCount: number;
}

const CTAS = [
  { href: '/posts', label: 'View Blog', Icon: FaBlog, primary: true },
  { href: '/projects', label: 'View Projects', Icon: FaFolderOpen, primary: false },
  { href: '/about', label: 'About Me', Icon: FaUser, primary: false }
];

export default function HeroScene({ postCount, projectCount }: HeroSceneProps) {
  const reduce = useReducedMotion();
  const isDesktop = useIsDesktop();
  const parallaxEnabled = isDesktop && !reduce;
  const mouse = useMouseParallax(parallaxEnabled);

  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -80]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0]);

  // 마우스 위치(-1..1)를 각 레이어의 px 이동으로 변환
  const shift = (depth: number) => ({
    x: mouse.x * depth,
    y: mouse.y * depth
  });

  return (
    <section
      ref={ref}
      className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 pb-16 pt-24 sm:pt-28"
      style={{ perspective: '1200px' }}
      aria-label="Toris Dev Universe 소개"
    >
      {/* 배경: 방사형 글로우 + 그리드 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute right-1/4 top-2/3 size-[28rem] rounded-full bg-fuchsia-600/10 blur-[120px]" />
      </div>

      {/* 떠다니는 3D 카드 (데스크톱 전용, 장식이므로 aria-hidden) */}
      <div
        className="pointer-events-none absolute inset-0 hidden lg:block"
        aria-hidden
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* 터미널 창 */}
        <motion.div
          className="absolute left-[8%] top-[24%] w-64 rounded-xl border border-white/10 bg-slate-900/70 p-3 shadow-2xl backdrop-blur"
          animate={shift(28)}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
          style={{ rotateY: 14, rotateX: 6 }}
        >
          <div className="mb-2 flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400/80" />
            <span className="size-2.5 rounded-full bg-amber-400/80" />
            <span className="size-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300">
            <span className="text-fuchsia-400">const</span> dev ={' '}
            <span className="text-emerald-300">&apos;토리스&apos;</span>
            {'\n'}
            <span className="text-fuchsia-400">await</span> ship(blog, projects)
          </pre>
        </motion.div>

        {/* 블로그 카드 */}
        <motion.div
          className="absolute right-[9%] top-[22%] w-56 rounded-xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl backdrop-blur"
          animate={shift(-34)}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
          style={{ rotateY: -16, rotateX: 6 }}
        >
          <div className="flex items-center gap-2 text-indigo-300">
            <FaBlog className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Latest
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-white">
            {postCount}편의 기술 기록
          </p>
          <p className="mt-1 text-xs text-slate-400">
            학습 · 빌드 · 디버깅 · 배포까지
          </p>
        </motion.div>

        {/* 스택 아이콘 */}
        <motion.div
          className="absolute bottom-[16%] left-[16%] flex gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 shadow-2xl backdrop-blur"
          animate={shift(40)}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        >
          <SiNextDotJs className="size-6 text-white" />
          <SiReact className="size-6 text-sky-400" />
          <SiTypescript className="size-6 text-blue-400" />
        </motion.div>
      </div>

      {/* 중앙 콘텐츠 */}
      <motion.div
        className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <motion.span
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-indigo-200"
        >
          Full-Stack Developer · {projectCount}+ Projects
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: reduce ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
          className="mt-6 bg-gradient-to-br from-white via-indigo-100 to-indigo-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl md:text-7xl"
        >
          Toris Dev Universe
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: reduce ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
          className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300 sm:text-xl"
        >
          풀스택 웹 개발자 토리스의 기술 블로그.
          <br className="hidden sm:block" />
          <span className="text-slate-400">
            React, Next.js, TypeScript로 만드는 모던 웹 개발 이야기.
          </span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {CTAS.map(({ href, label, Icon, primary }) => (
            <Link
              key={href}
              href={href}
              className={
                primary
                  ? 'group inline-flex items-center gap-2 rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-colors hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300'
                  : 'group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300'
              }
            >
              <Icon className="size-4" />
              {label}
              <FaArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </motion.div>
      </motion.div>

      {/* 스크롤 인디케이터 */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        aria-hidden
      >
        <IoIosArrowDown className="size-6 motion-safe:animate-bounce" />
      </motion.div>
    </section>
  );
}
