'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRef } from 'react';
import { BsFileEarmarkPost, FaArrowRight, FaTags, MdCategory } from '@/components/icons';
import type { LandingCount, LandingPost } from '../types';
import { Chip, Reveal, SceneHeading } from '../ui';

interface Props {
  postCount: number;
  categoryCount: number;
  tagCount: number;
  categories: LandingCount[];
  topTags: LandingCount[];
  featuredPosts: LandingPost[];
}

function StatPanel({
  value,
  label,
  Icon
}: {
  value: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="group relative rounded-2xl border border-border bg-gradient-to-b from-foreground/[0.07] to-foreground/[0.02] p-6 transition-transform duration-300 [transform-style:preserve-3d] hover:-translate-y-1 motion-safe:hover:[transform:translateY(-4px)_rotateX(6deg)]">
      <Icon className="size-7 text-primary" />
      <div className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
        {value}
      </div>
      <div className="mt-1 text-sm font-medium text-muted-foreground">{label}</div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/0 transition group-hover:ring-primary/30" />
    </div>
  );
}

export default function KnowledgeStatsScene({
  postCount,
  categoryCount,
  tagCount,
  categories,
  topTags,
  featuredPosts
}: Props) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  // 카드 열마다 다른 깊이감(패럴랙스)
  const yA = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 60, reduce ? 0 : -60]);
  const yB = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 30, reduce ? 0 : -30]);

  return (
    <section
      className="relative px-4 py-24 sm:py-32"
      aria-label="지식 베이스"
      style={{ perspective: '1000px' }}
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SceneHeading
            eyebrow="Knowledge Base"
            title={<>기록으로 쌓은 지식 베이스</>}
            description="배우고 만들며 남긴 글이 곧 아카이브가 됩니다. 카테고리와 태그로 엮인 기술 노트들."
          />
        </Reveal>

        {/* 스탯 패널 */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Reveal delay={0}>
            <StatPanel value={`${postCount}+`} label="Posts · 기술 기록" Icon={BsFileEarmarkPost} />
          </Reveal>
          <Reveal delay={0.08}>
            <StatPanel value={`${categoryCount}`} label="Categories" Icon={MdCategory} />
          </Reveal>
          <Reveal delay={0.16}>
            <StatPanel value={`${tagCount}+`} label="Tags" Icon={FaTags} />
          </Reveal>
        </div>

        {/* 카테고리 칩 (궤도처럼 늘어놓기) */}
        <Reveal className="mt-8 flex flex-wrap gap-2">
          {categories.slice(0, 6).map((c) => (
            <Chip key={c.name} className="bg-primary/10 text-primary">
              {c.name}
              <span className="ml-1.5 text-primary/70">{c.count}</span>
            </Chip>
          ))}
        </Reveal>

        {/* 떠다니는 문서(포스트) 카드 */}
        {featuredPosts.length > 0 && (
          <div ref={ref} className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPosts.map((post, i) => (
              <motion.div
                key={post.slug}
                style={{ y: i % 3 === 1 ? yB : yA }}
                className="[transform-style:preserve-3d]"
              >
                <Reveal delay={(i % 3) * 0.06}>
                  <Link
                    href={`/posts/${post.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-border bg-card/70 p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <span className="inline-flex w-fit rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                      {post.category}
                    </span>
                    <h3 className="mt-3 line-clamp-2 text-lg font-bold text-foreground group-hover:text-primary">
                      {post.title}
                    </h3>
                    {post.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {post.description}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground/70">
                      <span>{post.date}</span>
                      <FaArrowRight className="size-3.5 text-primary transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                </Reveal>
              </motion.div>
            ))}
          </div>
        )}

        {/* 인기 태그 */}
        {topTags.length > 0 && (
          <Reveal className="mt-10 flex flex-wrap gap-2">
            {topTags.map((t) => (
              <Chip key={t.name}>#{t.name}</Chip>
            ))}
          </Reveal>
        )}
      </div>
    </section>
  );
}
