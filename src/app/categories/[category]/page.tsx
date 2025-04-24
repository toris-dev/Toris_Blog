import { FaArrowLeft, FaFolderOpen } from '@/components/icons';
import { MarkdownFile } from '@/types';
import { getCategories, getPosts } from '@/utils/fetch';
import { Metadata } from 'next';
import Link from 'next/link';

// ISG를 위한 revalidate 설정 (6시간)
export const revalidate = 21600;

export const dynamic = 'force-dynamic';

export default async function CategoryPosts({
  params
}: {
  params: { category: string };
}) {
  const category = decodeURIComponent(params.category);
  const posts = await getPosts({ category });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <Link
          href="/categories"
          className="mb-4 inline-flex items-center text-blue-600 transition-colors hover:underline dark:text-blue-400"
        >
          <FaArrowLeft className="mr-2" /> 모든 카테고리
        </Link>

        <div className="mb-3 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            <FaFolderOpen />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {category}
          </h1>
        </div>

        <p className="mb-2 text-gray-600 dark:text-gray-300">
          {posts.length}개의 포스트가 있습니다.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.length > 0 ? (
          posts.map((post: MarkdownFile) => (
            <Link
              href={`/posts/${post.slug}`}
              key={post.slug}
              className="group rounded-lg border border-gray-200 bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <h2 className="mb-2 text-xl font-semibold transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {post.title}
              </h2>

              <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                {new Date(post.date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>

              {post.description && (
                <p className="mb-4 line-clamp-2 text-gray-600 dark:text-gray-300">
                  {post.description}
                </p>
              )}

              <div className="mt-auto flex flex-wrap gap-2">
                {post.tags?.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              이 카테고리에 해당하는 글이 없습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// 빌드 시 정적 페이지 생성을 위한 경로 파라미터 생성
export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ category }));
}

type CategoryPageProps = { params: { category: string } };

export async function generateMetadata({
  params
}: CategoryPageProps): Promise<Metadata> {
  const category = decodeURIComponent(params.category);
  return {
    title: `${category} - 카테고리 | Toris Blog`,
    description: `${category} 카테고리의 글 모음입니다.`,
    openGraph: {
      title: `${category} - 카테고리 | Toris Blog`,
      description: `${category} 카테고리의 글 모음입니다.`
    }
  };
}
