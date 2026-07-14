import Home3DLanding from '@/components/home/landing/Home3DLanding';
import type { LandingPost } from '@/components/home/landing/types';
import StructuredData from '@/components/seo/StructuredData';
import { moreProjects, projects } from '@/data/projects';
import { getPostData } from '@/utils/markdown';
import { getDefaultOGImageUrl } from '@/utils/og-image';
import { Metadata } from 'next';

// ISR Writes 절감: 7일 (온디맨드 /api/revalidate 우선)
export const revalidate = 604800;

const PAGE_TITLE = 'TORIS — 아이디어를 작동하게, 끝까지';
const PAGE_DESCRIPTION =
  '문제를 제품의 언어로 정리하고, 앱·웹·데스크톱 화면과 시스템을 함께 설계해 실제로 운영되는 결과까지 만듭니다.';

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
        url: getDefaultOGImageUrl('TORIS', '아이디어를 작동하게, 끝까지'),
        width: 1200,
        height: 630,
        alt: 'TORIS 제품 개발 스튜디오'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [getDefaultOGImageUrl('TORIS', '아이디어를 작동하게, 끝까지')]
  }
};

const FEATURED_POSTS_COUNT = 3;

export default function Home() {
  const posts = getPostData();
  const featuredPosts = posts.slice(0, FEATURED_POSTS_COUNT);

  // 클라이언트 랜딩으로 넘길 직렬화 가능한 최소 payload
  const landingPosts: LandingPost[] = featuredPosts.map((post) => ({
    title: post.title,
    slug: post.slug,
    category: post.category,
    date: post.date,
    description: post.description,
    image: post.preview_image_url,
    tags: Array.isArray(post.tags)
      ? post.tags
      : typeof post.tags === 'string'
        ? post.tags.split(',').map((t) => t.trim())
        : []
  }));

  return (
    <>
      <StructuredData page="home" />

      <Home3DLanding
        data={{
          postCount: posts.length,
          categoryCount: 0,
          tagCount: 0,
          projectCount: projects.length + moreProjects.length,
          featuredPosts: landingPosts,
          categories: [],
          topTags: []
        }}
      />
    </>
  );
}
