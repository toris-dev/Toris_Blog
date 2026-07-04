import BlogShowcaseSection from '@/components/home/BlogShowcaseSection';
import HeroSection from '@/components/home/HeroSection';
import PostsSection from '@/components/home/PostsSection';
import TechStackSection from '@/components/home/TechStackSection';
import StructuredData from '@/components/seo/StructuredData';
import { getPostData } from '@/utils/markdown';
import { getDefaultOGImageUrl } from '@/utils/og-image';
import { Metadata } from 'next';

// ISR Writes 절감: 7일 (온디맨드 /api/revalidate 우선)
export const revalidate = 604800;

const PAGE_TITLE = 'Toris Blog - 웹 개발자의 기술 블로그';
const PAGE_DESCRIPTION =
  '풀스택 웹 개발자 토리스의 기술 블로그입니다. React, Next.js, TypeScript로 만드는 모던 웹 개발 이야기';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: 'website',
    url: '/',
    images: [
      {
        url: getDefaultOGImageUrl('Toris Blog', '웹 개발자의 기술 블로그'),
        width: 1200,
        height: 630,
        alt: 'Toris Blog'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [getDefaultOGImageUrl('Toris Blog', '웹 개발자의 기술 블로그')]
  }
};

const FEATURED_POSTS_COUNT = 6;
const TOP_TAGS_COUNT = 18;

export default function Home() {
  const posts = getPostData();
  const featuredPosts = posts.slice(0, FEATURED_POSTS_COUNT);

  // 카테고리별 포스트 수 (많은 순)
  const categoryMap = new Map<string, number>();
  posts.forEach((post) => {
    categoryMap.set(post.category, (categoryMap.get(post.category) || 0) + 1);
  });
  const categories = [...categoryMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 태그별 포스트 수 (많은 순 상위 N개)
  const tagMap = new Map<string, number>();
  posts.forEach((post) => {
    (Array.isArray(post.tags) ? post.tags : []).forEach((tag) => {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    });
  });
  const topTags = [...tagMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_TAGS_COUNT);

  return (
    <>
      <StructuredData page="home" />

      <div>
        <HeroSection
          postCount={posts.length}
          categoryCount={categories.length}
          tagCount={tagMap.size}
        />
        <BlogShowcaseSection
          categories={categories}
          topTags={topTags}
          postCount={posts.length}
        />
        <PostsSection featuredPosts={featuredPosts} />
        <TechStackSection />
      </div>
    </>
  );
}
