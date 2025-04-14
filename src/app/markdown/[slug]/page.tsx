import MarkdownFileViewer from '@/components/blog/MarkdownFileViewer';
import { getPosts } from '@/utils/fetch';
import { Metadata } from 'next';

// 6시간마다 재생성
export const revalidate = 60 * 60 * 6;

// 정적 생성 파라미터
export async function generateStaticParams() {
  const posts = await getPosts({});
  return posts.map((post) => ({
    slug: post.slug
  }));
}

// 메타데이터 생성
export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const posts = await getPosts({});
  const post = posts.find((p) => p.slug === params.slug);

  if (!post) {
    return {
      title: '게시글을 찾을 수 없습니다',
      description: '요청하신 게시글을 찾을 수 없습니다.'
    };
  }

  return {
    title: post.title,
    description: post.description || `${post.title}에 대한 게시글입니다.`,
    authors: [{ name: '토리스', url: 'https://github.com/toris-dev' }],
    openGraph: {
      title: post.title,
      description: post.description || `${post.title}에 대한 게시글입니다.`,
      type: 'article',
      publishedTime: post.date,
      tags: post.tags
    }
  };
}

export default function MarkdownPage({ params }: { params: { slug: string } }) {
  return (
    <div className="container mx-auto py-8">
      <MarkdownFileViewer slug={params.slug} />
    </div>
  );
}
