import PostPage from '@/components/blog/PostPage';
import { getPostBySlug, getPostData } from '@/utils/markdown';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

// ISG를 위한 revalidate 설정 (6시간)
export const revalidate = 21600;

// 동적 렌더링 설정 추가
export const dynamic = 'force-dynamic';

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

    return {
      title: post.title,
      description: post.description || post.content?.split('.')[0],
      openGraph: {
        title: post.title,
        description: post.description || post.content?.split('.')[0],
        type: 'article',
        publishedTime: post.date,
        tags: Array.isArray(post.tags) ? post.tags : [post.tags],
        images: post.preview_image_url
          ? [{ url: post.preview_image_url }]
          : undefined
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return { title: '포스트를 찾을 수 없습니다' };
  }
}
