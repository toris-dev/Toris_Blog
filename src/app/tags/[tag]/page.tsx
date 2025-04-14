import { MarkdownFile } from '@/types';
import { getPosts, getTags } from '@/utils/fetch';
import { Metadata } from 'next';
import Link from 'next/link';

// ISG를 위한 revalidate 설정 (6시간)
export const revalidate = 60 * 60 * 6;

export const dynamic = 'force-dynamic';

export default async function TagPosts({
  params
}: {
  params: { tag: string };
}) {
  const tag = decodeURIComponent(params.tag);
  const posts = await getPosts({ tag });

  return (
    <div className="flex flex-col px-4 pb-24 pt-20">
      <h1 className="mb-8 text-center text-2xl font-semibold">태그: {tag}</h1>

      <div className="container mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.length > 0 ? (
          posts.map((post: MarkdownFile) => (
            <Link
              href={`/posts/${post.slug}`}
              key={post.slug}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-md transition-transform hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <h2 className="mb-2 text-xl font-semibold">{post.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(post.date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((postTag: string) => (
                  <span
                    key={postTag}
                    className={`rounded-md px-2 py-1 text-xs ${
                      postTag === tag
                        ? 'bg-primary/10 text-primary'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {postTag}
                  </span>
                ))}
              </div>
            </Link>
          ))
        ) : (
          <p className="col-span-3 text-center text-gray-500 dark:text-gray-400">
            이 태그에 해당하는 글이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}

// 빌드 시 정적 페이지 생성을 위한 경로 파라미터 생성
export async function generateStaticParams() {
  const tags = await getTags();
  return tags?.map((tag) => ({ tag }));
}

type TagPageProps = { params: { tag: string } };

export async function generateMetadata({
  params
}: TagPageProps): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);
  return {
    title: `${tag} - 태그 | Toris Blog`,
    description: `${tag} 태그가 포함된 글 모음입니다.`,
    openGraph: {
      title: `${tag} - 태그 | Toris Blog`,
      description: `${tag} 태그가 포함된 글 모음입니다.`
    }
  };
}
