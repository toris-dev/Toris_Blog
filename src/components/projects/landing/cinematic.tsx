'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type CSSProperties, type ReactNode } from 'react';
import type { Project } from '@/data/projects';
import { AccentButton, GhostButton, Reveal } from './shared';
import type { CinematicTheme } from './themes';

export interface CinematicLandingProps {
  project: Project;
  eyebrow: string;
  title: string;
  thesis: string;
  theme: CinematicTheme;
  proof: readonly string[];
  signature: ReactNode;
  gallery?: readonly { src: string; alt: string; portrait?: boolean }[];
}

export function SignatureFrame({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className="relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-white/10 p-5 sm:p-8"
    >
      {children}
    </section>
  );
}

export function CinematicGallery({
  images
}: {
  images: NonNullable<CinematicLandingProps['gallery']>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {images.map((image) => (
        <SafeProjectImage key={image.src} {...image} />
      ))}
    </div>
  );
}

export function SafeProjectImage({
  src,
  alt,
  portrait = false
}: {
  src: string;
  alt: string;
  portrait?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} 이미지 대체 그래픽`}
        className="grid min-h-56 place-items-center rounded-3xl bg-white/10 px-6 text-center"
      >
        {alt}
      </div>
    );
  }

  return (
    <div
      className={
        portrait
          ? 'relative aspect-[706/1600] overflow-hidden rounded-3xl'
          : 'relative aspect-video overflow-hidden rounded-3xl'
      }
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 90vw, 33vw"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function CinematicLanding({
  project,
  eyebrow,
  title,
  thesis,
  theme,
  proof,
  signature,
  gallery
}: CinematicLandingProps) {
  const vars = {
    '--cinema-bg': theme.background,
    '--cinema-surface': theme.surface,
    '--cinema-page-ink': theme.pageInk,
    '--cinema-page-muted': theme.pageMuted,
    '--cinema-surface-ink': theme.surfaceInk,
    '--cinema-surface-muted': theme.surfaceMuted,
    '--cinema-accent': theme.accent,
    '--cinema-accent-2': theme.accent2,
    '--cinema-page-accent-text': theme.pageAccentText,
    '--cinema-surface-accent-text': theme.surfaceAccentText,
    '--cinema-primary-bg': theme.primaryBackground,
    '--cinema-primary-ink': theme.primaryInk
  } as CSSProperties;

  return (
    <main
      data-testid="cinematic-project"
      data-cinematic-project={project.slug}
      style={vars}
      className="min-h-screen overflow-hidden bg-[var(--cinema-bg)] text-[var(--cinema-page-ink)]"
    >
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6">
        <Link href="/projects" className="min-h-11 py-3 text-sm">
          ← PROJECTS
        </Link>
        <span className="truncate text-sm font-semibold">{project.name}</span>
        <span className="font-mono text-xs tracking-[0.2em]">
          {project.year} · {project.status}
        </span>
      </header>

      <section className="mx-auto grid min-h-[78dvh] max-w-7xl items-center gap-10 px-5 py-14 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <p className="font-mono text-xs tracking-[0.24em] text-[var(--cinema-page-accent-text)]">
            {eyebrow}
          </p>
          <h1 className="mt-5 text-5xl font-black leading-[0.96] -tracking-wider sm:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--cinema-page-muted)]">
            {thesis}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <AccentButton
              href={project.github}
              from={theme.primaryBackground}
              to={theme.primaryBackground}
              glow={project.accent.glow}
              foreground={theme.primaryInk}
            >
              {project.ctaLabel ?? '프로젝트 보기'}
            </AccentButton>
            <GhostButton
              href="#proof"
              style={{
                color: 'var(--cinema-page-ink)',
                borderColor:
                  'color-mix(in srgb, var(--cinema-page-ink) 35%, transparent)',
                backgroundColor:
                  'color-mix(in srgb, var(--cinema-page-ink) 8%, transparent)'
              }}
            >
              설계 근거
            </GhostButton>
          </div>
        </Reveal>
        <Reveal delay={0.12}>{signature}</Reveal>
      </section>

      <section id="proof" className="mx-auto max-w-7xl px-5 py-24">
        <div className="grid gap-4 md:grid-cols-3">
          {proof.map((item, index) => (
            <Reveal key={item} delay={index * 0.06}>
              <article className="min-h-40 rounded-3xl bg-[var(--cinema-surface)] p-6 text-[var(--cinema-surface-ink)]">
                <span className="font-mono text-xs text-[var(--cinema-surface-accent-text)]">
                  0{index + 1}
                </span>
                <h2 className="mt-4 text-xl font-bold">{item}</h2>
              </article>
            </Reveal>
          ))}
        </div>
        {gallery ? (
          <div className="mt-16">
            <CinematicGallery images={gallery} />
          </div>
        ) : null}
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24">
        <h2 className="text-3xl font-black">제품 흐름과 구현 경계</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {project.features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-3xl bg-[var(--cinema-surface)] p-6 text-[var(--cinema-surface-ink)]"
            >
              <h3 className="text-lg font-bold">{feature.title}</h3>
              <p className="mt-3 leading-7 text-[var(--cinema-surface-muted)]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
        <ul aria-label="기술 스택" className="mt-8 flex flex-wrap gap-2">
          {project.tech.map((item) => (
            <li
              key={item}
              className="border-current/20 rounded-full border px-4 py-2 font-mono text-xs"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-white/10 px-5 py-12 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--cinema-page-muted)]">
          {project.description}
        </p>
        <Link
          href="/projects"
          aria-label="프로젝트 목록으로 돌아가기"
          className="min-h-11 shrink-0 py-3"
        >
          모든 프로젝트 보기 →
        </Link>
      </footer>
    </main>
  );
}
