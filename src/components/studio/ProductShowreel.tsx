'use client';

import { FaArrowRight } from '@/components/icons';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring
} from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState, type KeyboardEvent, type PointerEvent } from 'react';

const ENTER_EASE = [0.23, 1, 0.32, 1] as const;
const reelProjects = [
  {
    number: '01',
    slug: '21n-apps',
    name: '예쁜계약',
    kind: 'B2B2C 전자계약 플랫폼',
    image: '/images/projects/21n-apps/cover.svg',
    imageFit: 'cover',
    background: 'var(--toris-color-graphite)'
  },
  {
    number: '02',
    slug: 'snapmate',
    name: 'SnapMate',
    kind: '모바일 사진 공유 앱',
    image: '/images/projects/snapmate/feature.png',
    imageFit: 'cover',
    background: 'var(--toris-color-ink)'
  },
  {
    number: '04',
    slug: 'love-trip',
    name: 'LOVETRIP',
    kind: '여행 설계 웹 플랫폼',
    image: '/images/projects/love-trip.png',
    imageFit: 'cover',
    background: 'var(--toris-color-ink)'
  },
  {
    number: '06',
    slug: 'toris-blog',
    name: 'TORIS Archive',
    kind: '콘텐츠·신뢰 플랫폼',
    image: '/images/projects/toris-blog.png',
    imageFit: 'cover',
    background: 'var(--toris-color-ink)'
  }
] as const;
const availableProjects = reelProjects.filter(Boolean);

export default function ProductShowreel() {
  'use no memo';

  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 260, damping: 28 });
  const rotateY = useSpring(rawRotateY, { stiffness: 260, damping: 28 });

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;

    rawRotateY.set(pointerX * 5);
    rawRotateX.set(pointerY * -5);
  };

  const resetTilt = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % availableProjects.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex =
        (index - 1 + availableProjects.length) % availableProjects.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = availableProjects.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    setActiveIndex(nextIndex);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [nextIndex]?.focus();
  };

  return (
    <div className="relative" role="region" aria-label="대표 프로젝트 쇼릴">
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduceMotion ? 0 : 0.32,
          delay: reduceMotion ? 0 : 0.08,
          ease: ENTER_EASE
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        style={{ rotateX, rotateY, transformPerspective: 1200 }}
        className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[var(--toris-border)] bg-[var(--toris-surface)] shadow-[var(--toris-shadow-md)] will-change-transform"
      >
        <div className="absolute inset-x-0 top-0 z-20 flex h-11 items-center justify-between border-b border-[var(--toris-border)] bg-[var(--toris-color-ink)] px-4 text-[var(--toris-color-mist)]">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[var(--toris-color-forge-red)]" />
            <span className="size-2 rounded-full bg-[var(--toris-system)]" />
            <span className="size-2 rounded-full bg-[var(--toris-signal)]" />
          </div>
          <p className="font-mono text-[11px] font-bold tracking-widest text-white/70">
            TORIS LAB / SHIPPED SYSTEMS
          </p>
        </div>

        {availableProjects.map((project, index) => {
          const isActive = index === activeIndex;

          return (
            <motion.div
              key={project.slug}
              id={`showreel-panel-${project.slug}`}
              role="tabpanel"
              aria-labelledby={`showreel-tab-${project.slug}`}
              initial={false}
              animate={{
                opacity: isActive ? 1 : 0,
                scale: isActive || reduceMotion ? 1 : 1.025
              }}
              transition={{
                duration: reduceMotion ? 0 : 0.24,
                ease: ENTER_EASE
              }}
              aria-hidden={!isActive}
              hidden={!isActive}
              className={`absolute inset-0 pt-11 ${isActive ? 'pointer-events-auto' : 'pointer-events-none'}`}
              style={{ backgroundColor: project.background }}
            >
              <Image
                src={project.image}
                alt={`${project.name} 프로젝트 화면`}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 46vw"
                className={
                  project.imageFit === 'contain'
                    ? 'object-contain'
                    : 'object-cover'
                }
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, var(--toris-color-ink), transparent 62%)'
                }}
              />

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-5 text-white sm:p-7">
                <div>
                  <p className="font-mono text-[11px] font-bold tracking-widest text-white/75">
                    {project.kind}
                  </p>
                  <p className="mt-2 text-2xl font-black tracking-[-0.035em] sm:text-3xl">
                    {project.name}
                  </p>
                </div>
                <Link
                  href={`/projects/${project.slug}`}
                  tabIndex={isActive ? 0 : -1}
                  className="group flex size-11 shrink-0 items-center justify-center rounded-full border border-white/40 bg-[var(--toris-color-ink)] transition duration-200 hover:border-[var(--toris-signal)] hover:bg-[var(--toris-signal)] hover:text-[var(--toris-on-signal)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--toris-focus)] active:scale-[0.97]"
                  aria-label={`${project.name} 프로젝트 보기`}
                >
                  <FaArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </motion.div>
          );
        })}

        <div className="absolute left-4 top-16 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-[var(--toris-color-ink)] px-3 py-1.5 font-mono text-[11px] font-bold tracking-widest text-white/80">
          <span className="size-1.5 rounded-full bg-[var(--toris-signal)]" />
          Build verified
        </div>

        <div className="absolute right-4 top-16 z-20 font-mono text-[11px] font-bold tracking-widest text-white/75">
          {String(activeIndex + 1).padStart(2, '0')} /{' '}
          {String(availableProjects.length).padStart(2, '0')}
        </div>
      </motion.div>

      <div
        className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
        role="tablist"
        aria-label="대표 프로젝트 선택"
        aria-orientation="horizontal"
      >
        {availableProjects.map((project, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={project.slug}
              id={`showreel-tab-${project.slug}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`showreel-panel-${project.slug}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className="relative min-h-16 cursor-pointer overflow-hidden rounded-xl border border-[var(--toris-border)] bg-[var(--toris-surface)] p-3 text-left transition-colors duration-200 hover:border-[var(--toris-system)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--toris-focus)]"
            >
              {isActive ? (
                reduceMotion ? (
                  <span
                    data-reduced-motion="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--toris-signal)]"
                  />
                ) : (
                  <motion.span
                    layoutId="showreel-active"
                    data-reduced-motion="false"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--toris-signal)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )
              ) : null}
              <span className="block font-mono text-[11px] font-bold tracking-widest text-[var(--toris-ink-muted)]">
                Work {project.number}
              </span>
              <span className="mt-1 block truncate text-xs font-bold text-[var(--toris-ink)]">
                {project.name}
              </span>
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        현재 선택된 프로젝트:{' '}
        {availableProjects[activeIndex]?.name ?? availableProjects[0]?.name}
      </p>
    </div>
  );
}
