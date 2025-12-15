import StructuredData from '@/components/seo/StructuredData';
import { getPostData, getPostsByCategory } from '@/utils/markdown';
import { getDefaultOGImageUrl } from '@/utils/og-image';
import { Metadata } from 'next';
import { Suspense } from 'react';
import ClientSearchPage from './_components/ClientSearchPage';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';

export const metadata: Metadata = {
  title: '블로그 포스트 - 웹 개발 기술 아티클',
  description:
    '토리스의 웹 개발 기술 블로그 포스트 모음입니다. React, Next.js, TypeScript, JavaScript 등 최신 웹 개발 기술과 실무 경험을 공유합니다.',
  keywords: [
    '블로그 포스트',
    '웹 개발',
    '기술 블로그',
    'React',
    'Next.js',
    'TypeScript',
    'JavaScript',
    '프론트엔드',
    '백엔드',
    '개발 경험',
    '토리스'
  ],
  openGraph: {
    title: '블로그 포스트 - 웹 개발 기술 아티클',
    description:
      '토리스의 웹 개발 기술 블로그 포스트 모음입니다. React, Next.js, TypeScript, JavaScript 등 최신 웹 개발 기술과 실무 경험을 공유합니다.',
    type: 'website',
    url: `${baseUrl}/posts`,
    images: [
      {
        url: getDefaultOGImageUrl('블로그 포스트', '웹 개발 기술 아티클'),
        width: 1200,
        height: 630,
        alt: '블로그 포스트 - 웹 개발 기술 아티클'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: '블로그 포스트 - 웹 개발 기술 아티클',
    description:
      '토리스의 웹 개발 기술 블로그 포스트 모음입니다. React, Next.js, TypeScript, JavaScript 등 최신 웹 개발 기술과 실무 경험을 공유합니다.',
    images: [getDefaultOGImageUrl('블로그 포스트', '웹 개발 기술 아티클')]
  },
  alternates: {
    canonical: `${baseUrl}/posts`
  }
};

// Next.js 16: ISR 설정 (6시간마다 재생성)
export const revalidate = 21600;

export default async function PostsPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const posts = category ? getPostsByCategory(category) : getPostData();

  return (
    <>
      <StructuredData type="blog" />
      <Suspense fallback={<div>로딩 중...</div>}>
        <ClientSearchPage initialPosts={posts} />
      </Suspense>
    </>
  );
}
