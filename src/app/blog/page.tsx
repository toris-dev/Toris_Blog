import StructuredData from '@/components/seo/StructuredData';
import {
  StudioPageCanvas,
  StudioPageIntro
} from '@/components/studio/StudioLanding';
import { getPostData, getPostsByCategory } from '@/utils/markdown';
import { getDefaultOGImageUrl } from '@/utils/og-image';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import ClientSearchPage from '../posts/_components/ClientSearchPage';
import { PostsPageSkeleton } from '../posts/_components/PostsPageSkeleton';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';

export const metadata: Metadata = {
  title: '기술 블로그 - 만들고 운영하며 남긴 기록 | TORIS',
  description:
    '제품을 만들고 운영하며 얻은 판단을 기록합니다. React, Next.js, TypeScript, AI와 풀스택 개발 아티클을 확인하세요.',
  alternates: { canonical: `${baseUrl}/blog` },
  openGraph: {
    title: 'TORIS 기술 블로그',
    description: '만들고 운영하며 남긴 제품 개발 기록',
    type: 'website',
    url: `${baseUrl}/blog`,
    images: [
      getDefaultOGImageUrl('TORIS 기술 블로그', '만들고 운영하며 남긴 기록')
    ]
  }
};

export const revalidate = 604800;

export default async function BlogPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const posts = category ? getPostsByCategory(category) : getPostData();

  return (
    <StudioPageCanvas>
      <StructuredData
        page="blog-listing"
        breadcrumb={[
          { name: '홈', url: '/' },
          { name: '블로그', url: '/blog' }
        ]}
      />
      <StudioPageIntro
        eyebrow="Technical notes"
        title={
          <>
            만들고 운영하며{' '}
            <span className="text-[var(--toris-system-text)]">
              남긴 판단을 공유합니다.
            </span>
          </>
        }
        description="React, Next.js, TypeScript, AI와 풀스택 개발을 실제 제품에 적용하며 배운 내용을 기록합니다."
      />
      <Suspense fallback={<PostsPageSkeleton />}>
        <ClientSearchPage initialPosts={posts} />
      </Suspense>
    </StudioPageCanvas>
  );
}
