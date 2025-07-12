import StructuredData from '@/components/seo/StructuredData';
import { getPostData, getPostsByCategory } from '@/utils/markdown';
import { Metadata } from 'next';
import ClientSearchPage from './_components/ClientSearchPage';

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
    url: '/posts'
  },
  twitter: {
    card: 'summary_large_image',
    title: '블로그 포스트 - 웹 개발 기술 아티클',
    description:
      '토리스의 웹 개발 기술 블로그 포스트 모음입니다. React, Next.js, TypeScript, JavaScript 등 최신 웹 개발 기술과 실무 경험을 공유합니다.'
  },
  alternates: {
    canonical: '/posts'
  }
};

export default async function PostsPage({
  searchParams
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category;
  const posts = category ? getPostsByCategory(category) : getPostData();

  return (
    <>
      <StructuredData type="blog" />
      <ClientSearchPage initialPosts={posts} />
    </>
  );
}
