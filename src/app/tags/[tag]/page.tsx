import StructuredData from '@/components/seo/StructuredData';
import { getPostsByTag, getTags } from '@/utils/markdown';
import { getDefaultOGImageUrl } from '@/utils/og-image';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ClientSearchPage from '@/app/posts/_components/ClientSearchPage';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';

export const revalidate = 21600; // 6시간마다 재생성

export async function generateStaticParams() {
  const tags = getTags();
  return tags.map((tag) => ({
    tag: encodeURIComponent(tag)
  }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = getPostsByTag(decodedTag);

  if (posts.length === 0) {
    return {
      title: '태그를 찾을 수 없습니다'
    };
  }

  const title = `#${decodedTag} 태그 - 블로그 포스트`;
  const description = `#${decodedTag} 태그가 포함된 블로그 포스트 ${posts.length}개를 확인하세요.`;

  return {
    title,
    description,
    keywords: [decodedTag, '블로그', '태그', '포스트'],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/tags/${tag}`,
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
      canonical: `${baseUrl}/tags/${tag}`
    }
  };
}

export default async function TagPage({
  params
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = getPostsByTag(decodedTag);

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
