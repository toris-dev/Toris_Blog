'use client';

import { cn } from '@/utils/style';
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import {
  FaCloudUploadAlt,
  FaCode,
  FaCodeBranch,
  FaDatabase,
  FaNodeJs,
  FaServer,
  MdPhoneIphone,
  SiNextDotJs,
  SiReact,
  SiTailwindcss,
  SiTypescript
} from '@/components/icons';
import type { IconKey } from './content';
import { EASE } from './shared';

/** IconKey → SVG 아이콘 컴포넌트 매핑 (이모지 대신 벡터 아이콘 사용) */
const ICONS: Record<IconKey, React.ComponentType<{ className?: string }>> = {
  nextjs: SiNextDotJs,
  react: SiReact,
  typescript: SiTypescript,
  node: FaNodeJs,
  nest: FaServer,
  reactnative: MdPhoneIphone,
  postgres: FaDatabase,
  aws: FaCloudUploadAlt,
  tailwind: SiTailwindcss,
  javascript: FaCode
};

export function TechIcon({
  icon,
  className
}: {
  icon: IconKey;
  className?: string;
}) {
  const Cmp = ICONS[icon] ?? FaCodeBranch;
  return <Cmp className={className} />;
}

/**
 * 스크롤 진입 시 페이드/슬라이드 인. reduced-motion이면 즉시 표시(0ms).
 * 콘텐츠는 항상 최종 상태로 도달하므로 모션 없이도 사용 가능.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 32
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={
        reduce ? { duration: 0 } : { duration: 0.6, delay, ease: EASE }
      }
    >
      {children}
    </motion.div>
  );
}

/** 섹션 상단의 eyebrow 라벨 + 제목 */
export function SceneHeading({
  eyebrow,
  title,
  description,
  className
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('max-w-2xl', className)}>
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-primary">
        <span className="size-1.5 rounded-full bg-primary" aria-hidden />
        {eyebrow}
      </span>
      <h2 className="mt-4 text-balance break-keep text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-pretty break-keep text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}

/** 기술 태그 칩 */
export function Chip({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-border bg-foreground/5 px-2.5 py-1 text-xs font-medium text-foreground/80',
        className
      )}
    >
      {children}
    </span>
  );
}
