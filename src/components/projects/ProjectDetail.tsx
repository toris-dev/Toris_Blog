'use client';

import { useRef, type ComponentType } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform
} from 'framer-motion';
import { FiActivity } from '@react-icons/all-files/fi/FiActivity';
import { FiArrowLeft } from '@react-icons/all-files/fi/FiArrowLeft';
import { FiArrowRight } from '@react-icons/all-files/fi/FiArrowRight';
import { FiAward } from '@react-icons/all-files/fi/FiAward';
import { FiBarChart2 } from '@react-icons/all-files/fi/FiBarChart2';
import { FiBookOpen } from '@react-icons/all-files/fi/FiBookOpen';
import { FiCamera } from '@react-icons/all-files/fi/FiCamera';
import { FiCheckSquare } from '@react-icons/all-files/fi/FiCheckSquare';
import { FiCloud } from '@react-icons/all-files/fi/FiCloud';
import { FiCpu } from '@react-icons/all-files/fi/FiCpu';
import { FiCreditCard } from '@react-icons/all-files/fi/FiCreditCard';
import { FiDollarSign } from '@react-icons/all-files/fi/FiDollarSign';
import { FiDownload } from '@react-icons/all-files/fi/FiDownload';
import { FiGithub } from '@react-icons/all-files/fi/FiGithub';
import { FiGlobe } from '@react-icons/all-files/fi/FiGlobe';
import { FiHeart } from '@react-icons/all-files/fi/FiHeart';
import { FiLayers } from '@react-icons/all-files/fi/FiLayers';
import { FiList } from '@react-icons/all-files/fi/FiList';
import { FiMap } from '@react-icons/all-files/fi/FiMap';
import { FiMapPin } from '@react-icons/all-files/fi/FiMapPin';
import { FiMessageCircle } from '@react-icons/all-files/fi/FiMessageCircle';
import { FiMonitor } from '@react-icons/all-files/fi/FiMonitor';
import { FiPlay } from '@react-icons/all-files/fi/FiPlay';
import { FiSend } from '@react-icons/all-files/fi/FiSend';
import { FiShield } from '@react-icons/all-files/fi/FiShield';
import { FiSmartphone } from '@react-icons/all-files/fi/FiSmartphone';
import { FiTrendingUp } from '@react-icons/all-files/fi/FiTrendingUp';
import { FiUsers } from '@react-icons/all-files/fi/FiUsers';
import { FiVideo } from '@react-icons/all-files/fi/FiVideo';
import { FiZap } from '@react-icons/all-files/fi/FiZap';
import type { Project } from '@/data/projects';

const EASE = [0.16, 1, 0.3, 1] as const;

type FeatureIcon = ComponentType<{
  className?: string;
  'aria-hidden'?: boolean;
}>;

const FEATURE_ICONS: Record<string, FeatureIcon> = {
  activity: FiActivity,
  award: FiAward,
  book: FiBookOpen,
  camera: FiCamera,
  chart: FiBarChart2,
  check: FiCheckSquare,
  cloud: FiCloud,
  cpu: FiCpu,
  dollar: FiDollarSign,
  download: FiDownload,
  gamepad: FiPlay,
  globe: FiGlobe,
  heart: FiHeart,
  layers: FiLayers,
  list: FiList,
  map: FiMap,
  message: FiMessageCircle,
  monitor: FiMonitor,
  pin: FiMapPin,
  rocket: FiSend,
  shield: FiShield,
  smartphone: FiSmartphone,
  trending: FiTrendingUp,
  users: FiUsers,
  video: FiVideo,
  wallet: FiCreditCard,
  zap: FiZap
};

interface ProjectDetailProps {
  project: Project;
  prev: Project;
  next: Project;
}

export default function ProjectDetail({
  project,
  prev,
  next
}: ProjectDetailProps) {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);
  const glowOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);

  const statusColor =
    project.status === '운영 중'
      ? 'bg-emerald-400'
      : project.status === '출시'
        ? 'bg-sky-400'
        : 'bg-amber-400';

  return (
    <div className="min-h-dvh bg-[#050810] text-white">
      {/* ------------------------------- Hero ------------------------------- */}
      <section ref={heroRef} className="relative overflow-hidden px-4 pb-16 pt-28 sm:pt-32">
        <motion.div
          aria-hidden
          style={{ opacity: glowOpacity }}
          className="pointer-events-none absolute inset-0"
        >
          <div
            className="absolute -top-1/3 left-1/2 size-[42rem] -translate-x-1/2 rounded-full opacity-30 blur-[140px]"
            style={{
              background: `radial-gradient(circle, ${project.accent.from}, transparent 70%)`
            }}
          />
        </motion.div>

        <div className="relative z-10 mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <Link
              href="/projects"
              className="group inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
            >
              <FiArrowLeft
                aria-hidden
                className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5"
              />
              모든 프로젝트
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <span
              className="rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide text-white"
              style={{
                background: `linear-gradient(90deg, ${project.accent.from}, ${project.accent.to})`
              }}
            >
              {project.category}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-medium text-slate-300">
              <span className={`size-1.5 rounded-full ${statusColor}`} />
              {project.status}
            </span>
            <span className="text-xs tabular-nums text-slate-500">
              {project.year}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 32, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl"
          >
            {project.name}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.32, ease: EASE }}
            className="mt-5 max-w-2xl text-xl leading-relaxed text-slate-300 sm:text-2xl"
          >
            {project.tagline}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.42, ease: EASE }}
            className="mt-6 max-w-3xl leading-relaxed text-slate-400"
          >
            {project.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.52, ease: EASE }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: `linear-gradient(90deg, ${project.accent.from}, ${project.accent.to})`,
                boxShadow: `0 8px 32px ${project.accent.glow}`
              }}
            >
              <FiGithub aria-hidden className="size-4" />
              GitHub에서 보기
            </a>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center rounded-full border border-white/15 bg-white/5 px-7 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
            >
              프로젝트 문의
            </Link>
          </motion.div>
        </div>

        {/* 스크린샷 — 글래스 프레임 + 패럴랙스 */}
        <motion.div
          style={{ y: imageY }}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: EASE }}
          className="relative z-10 mx-auto mt-16 max-w-5xl"
        >
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-2 backdrop-blur-md sm:p-3">
            <div className="flex items-center gap-1.5 px-3 pb-2 pt-1 sm:px-4">
              <span className="size-2.5 rounded-full bg-[#FF5F57]" />
              <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="size-2.5 rounded-full bg-[#28C840]" />
              <span className="ml-3 hidden truncate rounded-md bg-white/5 px-3 py-0.5 text-[11px] text-slate-500 sm:block">
                github.com/toris-dev/{project.github.split('/').pop()}
              </span>
            </div>
            <div className="relative aspect-[2/1] overflow-hidden rounded-2xl">
              <Image
                src={project.image}
                alt={`${project.name} 저장소 미리보기`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ----------------------------- Features ----------------------------- */}
      <section className="mx-auto max-w-5xl px-4 py-24">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-3xl font-bold tracking-tight sm:text-4xl"
        >
          핵심 기능
        </motion.h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {project.features.map((feature, i) => {
            const Icon = FEATURE_ICONS[feature.icon] ?? FiZap;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: EASE }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors duration-300 hover:border-white/20"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(420px circle at 20% 0%, ${project.accent.glow}, transparent 65%)`
                  }}
                />
                <div
                  className="relative flex size-11 items-center justify-center rounded-xl text-white"
                  style={{
                    background: `linear-gradient(135deg, ${project.accent.from}, ${project.accent.to})`
                  }}
                >
                  <Icon aria-hidden className="size-5" />
                </div>
                <h3 className="relative mt-5 font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ---------------------------- Tech & Meta ---------------------------- */}
      <section className="mx-auto max-w-5xl px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]"
        >
          <div className="grid divide-y divide-white/5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { label: '플랫폼', value: project.platform },
              { label: '상태', value: project.status },
              { label: '연도', value: project.year }
            ].map((meta) => (
              <div key={meta.label} className="p-6">
                <div className="text-xs font-medium uppercase tracking-widest text-slate-500">
                  {meta.label}
                </div>
                <div className="mt-2 font-semibold text-white">{meta.value}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 p-6">
            <div className="text-xs font-medium uppercase tracking-widest text-slate-500">
              기술 스택
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.tech.map((t) => (
                <span
                  key={t}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* --------------------------- Prev / Next Nav -------------------------- */}
      <section className="mx-auto max-w-5xl px-4 pb-32">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { p: prev, dir: '이전 프로젝트', align: 'left' as const },
            { p: next, dir: '다음 프로젝트', align: 'right' as const }
          ].map(({ p, dir, align }) => (
            <motion.div
              key={dir}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <Link
                href={`/projects/${p.slug}`}
                className={`group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors duration-300 hover:border-white/25 ${
                  align === 'right' ? 'items-end text-right' : ''
                }`}
              >
                <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-slate-500">
                  {align === 'left' && (
                    <FiArrowLeft
                      aria-hidden
                      className="size-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
                    />
                  )}
                  {dir}
                  {align === 'right' && (
                    <FiArrowRight
                      aria-hidden
                      className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  )}
                </span>
                <span className="mt-3 text-xl font-bold text-white">
                  {p.name}
                </span>
                <span className="mt-1 line-clamp-1 text-sm text-slate-400">
                  {p.tagline}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
