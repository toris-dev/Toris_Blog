'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { AiFillGithub, FaArrowRight } from '@/components/icons';
import { moreProjects, projects } from '@/data/projects';
import { EASE } from '../shared';
import { Chip, Reveal, SceneHeading } from '../ui';

export default function ProjectShowcaseScene() {
  const reduce = useReducedMotion();

  return (
    <section
      className="relative px-4 py-24 sm:py-32"
      aria-label="개인 프로젝트"
      style={{ perspective: '1200px' }}
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SceneHeading
            eyebrow="Personal Projects"
            title={
              <>
                {projects.length + moreProjects.length}개의 개인 프로젝트,{' '}
                <span className="text-accent">직접 만든 것들</span>
              </>
            }
            description="여행 플랫폼부터 데스크톱 도구, AI 파이프라인, Web3까지 — 아이디어를 실제 제품으로 옮긴 기록."
          />
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <motion.article
              key={p.slug}
              initial={{ opacity: 0, y: reduce ? 0 : 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, delay: (i % 3) * 0.08, ease: EASE }}
              className="group relative h-full [transform-style:preserve-3d]"
            >
              <Link
                href={`/projects/${p.slug}`}
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/70 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-foreground/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {/* 액센트 배너 */}
                <div
                  className="relative h-24 w-full"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${p.accent.from}, ${p.accent.to})`
                  }}
                >
                  <div className="absolute inset-0 bg-slate-950/10" />
                  <span className="absolute bottom-2 right-3 text-[11px] font-semibold uppercase tracking-wider text-white/80">
                    {p.category}
                  </span>
                  <div
                    className="absolute -bottom-6 left-4 size-12 rounded-xl blur-xl transition-opacity duration-300 group-hover:opacity-100"
                    style={{ backgroundColor: p.accent.glow, opacity: 0.6 }}
                    aria-hidden
                  />
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {p.status}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {p.tagline}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.tech.slice(0, 4).map((t) => (
                      <Chip key={t}>{t}</Chip>
                    ))}
                    {p.tech.length > 4 && (
                      <Chip className="text-muted-foreground">+{p.tech.length - 4}</Chip>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-5 text-xs text-muted-foreground/70">
                    <span className="inline-flex items-center gap-1.5">
                      <AiFillGithub className="size-4" />
                      {p.year}
                    </span>
                    <FaArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        {/* 보조 프로젝트 (GitHub 링크) */}
        <Reveal className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {moreProjects.map((p) => (
            <a
              key={p.name}
              href={p.github}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-foreground/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <AiFillGithub className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  {p.name}
                </span>
                <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
                  {p.description}
                </span>
                <span className="mt-1.5 block text-[11px] font-medium text-muted-foreground/70">
                  {p.tech}
                </span>
              </span>
            </a>
          ))}
        </Reveal>

        <Reveal className="mt-12 flex justify-center">
          <Link
            href="/projects"
            className="group inline-flex items-center gap-2 rounded-full border border-border bg-foreground/5 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            모든 프로젝트 보기
            <FaArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
