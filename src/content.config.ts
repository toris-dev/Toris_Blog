import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';
import { createSlug } from './lib/slug';

/**
 * 기존 블로그 콘텐츠(../public/markdown/**)를 그대로 소비한다.
 * - 파일을 옮기지 않으므로 Next 사이트와 원본을 공유(마이그레이션 기간 동안 단일 출처).
 * - id = Next createSlug(파일명) → /posts/[slug] URL 완전 보존.
 */
const posts = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './public/markdown',
    generateId: ({ entry }) => {
      const fileName = entry
        .split('/')
        .pop()!
        .replace(/\.md$/i, '');
      return createSlug(fileName);
    }
  }),
  // 10년치 느슨한 frontmatter를 그대로 수용 — null/누락/이형 모두 허용
  schema: z.object({
    title: z.coerce.string().nullish(),
    description: z.coerce.string().nullish(),
    date: z.coerce.string().nullish(),
    tags: z.union([z.array(z.coerce.string()), z.coerce.string()]).nullish(),
    categories: z
      .union([z.array(z.coerce.string()), z.coerce.string()])
      .nullish(),
    series: z.coerce.string().nullish(),
    seriesOrder: z.coerce.number().nullish()
  })
});

export const collections = { posts };
