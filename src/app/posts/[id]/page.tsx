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
    console.log(`원본 ID: ${id}, 디코딩된 ID: ${decodedId}`);

    // 두 가지 방법으로 포스트 찾기 시도
    let post = getPostBySlug(decodedId);
    if (!post) {
      post = getPostBySlug(id);
    }

    if (!post) {
      console.log(`포스트를 찾을 수 없습니다: ${id} (디코딩: ${decodedId})`);
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
    console.error('Error loading post:', error);
    return notFound();
  }
}

// 빌드 시 정적 페이지 생성을 위한 경로 파라미터 생성
export async function generateStaticParams() {
  try {
    const posts = getPostData();
    return posts.map((post) => ({
      id: post.slug
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

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
