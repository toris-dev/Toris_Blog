import PostPage from '@/components/blog/PostPage';
import StructuredData from '@/components/seo/StructuredData';
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
    // URL 디코딩 처리 (안전하게)
    let decodedId: string;
    try {
      decodedId = decodeURIComponent(id);
    } catch {
      decodedId = id;
    }

    // 여러 방법으로 포스트 찾기 시도
    let post = getPostBySlug(decodedId);

    // 인코딩된 버전으로도 시도
    if (!post) {
      post = getPostBySlug(id);
    }

    // 원본 ID로도 시도 (이미 인코딩되지 않은 경우)
    if (!post) {
      const allPosts = getPostData();
      post =
        allPosts.find((p) => {
          // 슬러그 직접 비교
          if (p.slug === decodedId || p.slug === id) return true;
          // 인코딩된 슬러그와 비교
          const encodedSlug = encodeURIComponent(p.slug);
          return encodedSlug === id || encodedSlug === decodedId;
        }) || null;
    }

    if (!post) {
      console.error(`Post not found for id: ${id}, decodedId: ${decodedId}`);
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

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';
    const postUrl = `${baseUrl}/posts/${id}`;

    // 구조화된 데이터용 데이터 준비
    const structuredData = {
      title: post.title,
      description:
        post.description ||
        post.content?.substring(0, 150).replace(/\n/g, ' ') ||
        '',
      image: post.preview_image_url
        ? toAbsoluteUrl(post.preview_image_url)
        : extractFirstImageFromMarkdown(post.content || '') ||
          getDefaultOGImageUrl(post.title, ''),
      publishedAt: post.date,
      url: postUrl,
      tags: Array.isArray(post.tags) ? post.tags : [post.tags],
      category: post.category,
      wordCount: post.content
        ? post.content.replace(/\s+/g, ' ').trim().split(' ').length
        : undefined
    };

    // Breadcrumb 데이터
    const breadcrumbItems = [
      { name: '홈', url: '/' },
      { name: '포스트', url: '/posts' },
      ...(post.category
        ? [
            {
              name: post.category,
              url: `/categories/${encodeURIComponent(post.category)}`
            }
          ]
        : []),
      { name: post.title, url: `/posts/${id}` }
    ];

    return (
      <>
        <StructuredData type="article" data={structuredData} />
        <StructuredData type="breadcrumb" data={{ items: breadcrumbItems }} />
        <PostPage {...pageProps} />
      </>
    );
  } catch (error) {
    // 프로덕션에서도 에러 로깅 (디버깅용)
    console.error('Error loading post:', error);
    console.error('Post ID:', id);
    return notFound();
  }
}

// Next.js 16: ISG를 위한 정적 경로 생성
// 빌드 시 모든 포스트의 정적 페이지를 생성하고,
// revalidate 설정에 따라 ISR로 업데이트
export async function generateStaticParams() {
  try {
    const posts = getPostData();

    if (posts.length === 0) {
      console.warn('No posts found for static generation');
      return [];
    }

    // 실제로 존재하는 포스트만 필터링하여 반환
    const validParams = posts
      .filter((post) => {
        // 포스트가 유효한지 확인
        if (!post || !post.slug || !post.title) {
          console.warn(`Invalid post found:`, post);
          return false;
        }
        return true;
      })
      .map((post) => {
        // 일관되게 인코딩된 slug 사용
        const id = encodeURIComponent(post.slug);
        return { id };
      });

    return validParams;
  } catch (error) {
    // 빌드 타임 에러 로깅
    console.error('Error generating static params:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
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

    // 태그를 배열로 변환
    const tags = Array.isArray(post.tags)
      ? post.tags
      : typeof post.tags === 'string'
        ? post.tags.split(',').map((t) => t.trim())
        : [];

    // 키워드 생성: 태그 + 카테고리 + 기본 키워드
    const keywords = [
      ...tags,
      post.category,
      '웹 개발',
      '기술 블로그',
      'React',
      'Next.js',
      'TypeScript',
      '토리스'
    ].filter(Boolean);

    // 더 나은 description 생성 (150-160자 권장)
    const betterDescription =
      post.description ||
      (post.content
        ? post.content
            .replace(/[#*`\[\]()]/g, '')
            .replace(/\n/g, ' ')
            .trim()
            .substring(0, 160)
            .trim() + '...'
        : '토리스의 웹 개발 기술 블로그 포스트입니다.');

    return {
      title: post.title,
      description: betterDescription,
      keywords,
      authors: [{ name: '토리스', url: 'https://github.com/toris-dev' }],
      creator: '토리스',
      publisher: '토리스',
      category: post.category || 'Technology',
      openGraph: {
        title: post.title,
        description: betterDescription,
        type: 'article',
        url: postUrl,
        publishedTime: post.date,
        modifiedTime: post.date, // 수정 시간이 있으면 추가
        authors: ['토리스'],
        tags,
        section: post.category || 'Technology',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: post.title
          }
        ],
        siteName: '토리스 블로그',
        locale: 'ko_KR'
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: betterDescription,
        images: [ogImageUrl],
        creator: '@toris_dev'
      },
      alternates: {
        canonical: postUrl
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1
        }
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return { title: '포스트를 찾을 수 없습니다' };
  }
}
