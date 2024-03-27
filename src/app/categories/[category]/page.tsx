import PostList from '@/components/PostList';
import { getCategories, getPosts } from '@/utils/fetch';
import { Metadata } from 'next';

export default async function CategoryPosts({
  params
}: {
  params: { category: string };
}) {
  const category = decodeURIComponent(params.category);
  const posts = await getPosts({ category });

  return (
    <PostList category={decodeURIComponent(category)} initalPosts={posts} />
  );
}

export const generateStaticParams = async () => {
  const categories = await getCategories();
  return categories.map((category) => ({ category }));
};

type CategoryPageProps = { params: { category: string } };

export const generateMetadata = async ({
  params
}: CategoryPageProps): Promise<Metadata> => {
  return {
    title: `toris-dev의 블로그 - ${decodeURIComponent(params.category)}`,
    description: '프로젝트 이야기를 나누는 블로그입니다.'
  };
};
