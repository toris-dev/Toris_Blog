'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowUpRight } from '@react-icons/all-files/fi/FiArrowUpRight';
import { FiFolder } from '@react-icons/all-files/fi/FiFolder';
import { FiTag } from '@react-icons/all-files/fi/FiTag';

const EASE = [0.16, 1, 0.3, 1] as const;

/** 카테고리 카드 액센트 팔레트 (순환) */
const ACCENTS = [
  { from: '#6366F1', to: '#8B5CF6' },
  { from: '#F43F5E', to: '#FB7185' },
  { from: '#22C55E', to: '#4ADE80' },
  { from: '#F59E0B', to: '#FB923C' },
  { from: '#06B6D4', to: '#22D3EE' },
  { from: '#EC4899', to: '#F472B6' }
];

export interface CategoryStat {
  name: string;
  count: number;
}

export interface TagStat {
  name: string;
  count: number;
}

interface BlogShowcaseSectionProps {
  categories: CategoryStat[];
  topTags: TagStat[];
  postCount: number;
}

export default function BlogShowcaseSection({
  categories,
  topTags,
  postCount
}: BlogShowcaseSectionProps) {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-7xl">
        {/* 섹션 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-12 text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Knowledge Base
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {postCount}개의 글이 쌓여 있어요
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            개발하며 배운 것들을 카테고리와 태그로 정리합니다.
            관심 있는 주제부터 둘러보세요.
          </p>
        </motion.div>

        {/* 카테고리 그리드 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, i) => {
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: EASE }}
              >
                <Link
                  href={`/categories/${encodeURIComponent(cat.name)}`}
                  className="group relative flex h-full items-center justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{
                        background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`
                      }}
                    >
                      <FiFolder aria-hidden className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">
                        {cat.name}
                      </h3>
                      <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">
                        {cat.count}개의 글
                      </p>
                    </div>
                  </div>
                  <FiArrowUpRight
                    aria-hidden
                    className="size-5 shrink-0 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* 태그 클라우드 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mt-14"
        >
          <div className="mb-5 flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
            <FiTag aria-hidden className="size-4 text-primary" />
            자주 다루는 주제
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {topTags.map((tag, i) => (
              <motion.div
                key={tag.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.03, ease: EASE }}
              >
                <Link
                  href={`/tags/${encodeURIComponent(tag.name)}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                >
                  {tag.name}
                  <span className="text-xs tabular-nums text-muted-foreground/70">
                    {tag.count}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 프로젝트 티저 배너 */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mt-16"
        >
          <Link
            href="/projects"
            className="group relative block overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/40 hover:shadow-xl sm:p-10"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background:
                  'radial-gradient(600px circle at 85% 20%, rgba(99,102,241,0.15), transparent 60%), radial-gradient(500px circle at 15% 90%, rgba(236,72,153,0.12), transparent 60%)'
              }}
            />
            <div className="relative flex flex-wrap items-center justify-between gap-6">
              <div>
                <span className="text-sm font-semibold uppercase tracking-widest text-primary">
                  Playground
                </span>
                <h3 className="mt-2 text-2xl font-bold text-card-foreground sm:text-3xl">
                  글만 쓰지 않아요 — 11+ 개인 프로젝트
                </h3>
                <p className="mt-3 max-w-xl text-muted-foreground">
                  여행 플랫폼, 데스크톱 도구, AI 파이프라인, Web3까지.
                  직접 만든 프로젝트들을 인터랙티브 쇼케이스에서 만나보세요.
                </p>
              </div>
              <span className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform duration-200 group-hover:scale-[1.04]">
                프로젝트 보러가기
                <FiArrowUpRight aria-hidden className="size-4" />
              </span>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
