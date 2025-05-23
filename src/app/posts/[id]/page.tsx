import PostPage from '@/components/blog/PostPage';
import { getMarkdownFile, getMarkdownFilesFromDisk } from '@/utils/fetch';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

// ISG를 위한 revalidate 설정 (6시간)
export const revalidate = 21600;

// 동적 렌더링 설정 추가
export const dynamic = 'force-dynamic';

export default async function Post({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { issueNumber?: string };
}) {
  try {
    const post = await getMarkdownFile(params.id);
    if (!post) return notFound();

    // 쿼리 파라미터로 전달된 이슈 번호 추출
    const issueNumber = searchParams.issueNumber
      ? parseInt(searchParams.issueNumber, 10)
      : undefined;

    return <PostPage {...post} postId={issueNumber || params.id} />;
  } catch (error) {
    console.error('Error loading post:', error);
    return notFound();
  }
}

// 빌드 시 정적 페이지 생성을 위한 경로 파라미터 생성
export async function generateStaticParams() {
  try {
    const posts = await getMarkdownFilesFromDisk();
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
  const post = await getMarkdownFile(params.id);
  if (!post) return { title: '포스트를 찾을 수 없습니다' };

  return {
    title: post.title,
    description: post.content?.split('.')[0],
    openGraph: {
      title: post.title,
      description: post.content?.split('.')[0],
      type: 'article',
      publishedTime: post.date,
      tags: post.tags,
      images: post.image ? [{ url: post.image }] : undefined
    }
  };
}
