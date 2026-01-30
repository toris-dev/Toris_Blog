import HeroSection from '@/components/home/HeroSection';
import PostsSection from '@/components/home/PostsSection';
import TechStackSection from '@/components/home/TechStackSection';
import StructuredData from '@/components/seo/StructuredData';
import { getPostData } from '@/utils/markdown';
import { getDefaultOGImageUrl } from '@/utils/og-image';
import { Metadata } from 'next';

// 6시간마다 재생성
export const revalidate = 21600;

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

const FEATURED_POSTS_COUNT = 3;

export default function Home() {
  const posts = getPostData();
  const featuredPosts = posts.slice(0, FEATURED_POSTS_COUNT);

  return (
    <>
      <StructuredData type="website" />
      <StructuredData type="person" />

      <div>
        <HeroSection />
        <TechStackSection />
        <PostsSection featuredPosts={featuredPosts} />
      </div>
    </>
  );
}
