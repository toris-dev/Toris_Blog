import StructuredData from '@/components/seo/StructuredData';
import { getPostsByCategory, getCategories } from '@/utils/markdown';
import { getDefaultOGImageUrl } from '@/utils/og-image';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ClientSearchPage from '@/app/posts/_components/ClientSearchPage';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';

export const revalidate = 21600; // 6시간마다 재생성

export async function generateStaticParams() {
  const categories = getCategories();
  return categories.map((category) => ({
    category: encodeURIComponent(category)
  }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);
  const posts = getPostsByCategory(decodedCategory);

  if (posts.length === 0) {
    return {
      title: '카테고리를 찾을 수 없습니다'
    };
  }

  const title = `${decodedCategory} 카테고리 - 블로그 포스트`;
  const description = `${decodedCategory} 카테고리의 블로그 포스트 ${posts.length}개를 확인하세요.`;

  return {
    title,
    description,
    keywords: [decodedCategory, '블로그', '카테고리', '포스트'],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/categories/${category}`,
      images: [
        {
          url: getDefaultOGImageUrl(title, description),
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [getDefaultOGImageUrl(title, description)]
    },
    alternates: {
      canonical: `${baseUrl}/categories/${category}`
    }
  };
}

export default async function CategoryPage({
  params
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);
  const posts = getPostsByCategory(decodedCategory);

  if (posts.length === 0) {
    return notFound();
  }

  return (
    <>
      <StructuredData type="blog" />
      <Suspense fallback={<div>로딩 중...</div>}>
        <ClientSearchPage initialPosts={posts} />
      </Suspense>
    </>
  );
}
