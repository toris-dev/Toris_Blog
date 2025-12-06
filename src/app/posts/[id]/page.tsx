import PostPage from '@/components/blog/PostPage';
import { getPostBySlug, getPostData } from '@/utils/markdown';
import {
  extractFirstImageFromMarkdown,
  getDefaultOGImageUrl,
  toAbsoluteUrl
} from '@/utils/og-image';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

// ISR을 위한 revalidate 설정 (6시간)
export const revalidate = 21600;

// SSG/ISR을 사용하므로 force-dynamic 제거
// generateStaticParams와 함께 사용하여 빌드 시 정적 페이지 생성

export default async function Post({ params }: { params: { id: string } }) {
  const { id } = await params;

  try {
    // URL 디코딩 처리
    const decodedId = decodeURIComponent(id);

    // 두 가지 방법으로 포스트 찾기 시도
    let post = getPostBySlug(decodedId);
    if (!post) {
      post = getPostBySlug(id);
    }

    if (!post) {
      return notFound();
    }

    // PostPage 컴포넌트의 props 타입에 맞게 변환
    const pageProps = {
      title: post.title,
      category: post.category,
      tags: Array.isArray(post.tags) ? post.tags : [post.tags],
      content: post.content,
      date: post.date,
      image: post.preview_image_url,
      postId: id
    };

    return <PostPage {...pageProps} />;
  } catch (error) {
    // 빌드 타임 에러는 조용히 처리 (notFound는 정상적인 동작)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error loading post:', error);
    }
    return notFound();
  }
}

// Next.js 16: ISG를 위한 정적 경로 생성
// 빌드 시 모든 포스트의 정적 페이지를 생성하고,
// revalidate 설정에 따라 ISR로 업데이트
export async function generateStaticParams() {
  try {
    const posts = getPostData();
    // 실제로 존재하는 포스트만 필터링하여 반환
    const validParams = posts
      .filter((post) => {
        // 포스트가 유효한지 확인
        return post && post.slug && post.title;
      })
      .map((post) => ({
        id: encodeURIComponent(post.slug)
      }));
    return validParams;
  } catch (error) {
    // 빌드 타임 에러는 조용히 처리
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating static params:', error);
    }
    return [];
  }
}

// Next.js 16: 동적 세그먼트가 없는 경우를 위한 fallback 설정
export const dynamicParams = true; // 빌드 시 생성되지 않은 경로는 동적으로 생성

type PostProps = { params: { id: string } };
export async function generateMetadata({
  params
}: PostProps): Promise<Metadata> {
  const { id } = await params;

  try {
    // URL 디코딩 처리
    const decodedId = decodeURIComponent(id);
    let post = getPostBySlug(decodedId);
    if (!post) {
      post = getPostBySlug(id);
    }

    if (!post) return { title: '포스트를 찾을 수 없습니다' };

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';
    const postUrl = `${baseUrl}/posts/${id}`;
    const description =
      post.description || post.content?.substring(0, 150).replace(/\n/g, ' ');

    // 이미지 추출: preview_image_url > 마크다운 첫 이미지 > 기본 이미지
    let ogImageUrl: string;
    if (post.preview_image_url) {
      ogImageUrl = toAbsoluteUrl(post.preview_image_url);
    } else {
      const firstImage = post.content
        ? extractFirstImageFromMarkdown(post.content)
        : null;
      if (firstImage) {
        ogImageUrl = toAbsoluteUrl(firstImage);
      } else {
        ogImageUrl = getDefaultOGImageUrl(post.title, description);
      }
    }

    return {
      title: post.title,
      description,
      openGraph: {
        title: post.title,
        description,
        type: 'article',
        url: postUrl,
        publishedTime: post.date,
        authors: ['토리스'],
        tags: Array.isArray(post.tags) ? post.tags : [post.tags],
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: post.title
          }
        ]
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description,
        images: [ogImageUrl]
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return { title: '포스트를 찾을 수 없습니다' };
  }
}
