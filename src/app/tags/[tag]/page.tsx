import PostList from '@/components/PostList';
import { getPosts, getTags } from '@/utils/fetch';
import { Metadata } from 'next';

export default async function TagPosts({
  params
}: {
  params: { tag: string };
}) {
  const tag = decodeURIComponent(params.tag);
  const posts = await getPosts({ tag });
  return <PostList tag={decodeURIComponent(tag)} initalPosts={posts} />;
}

export const generateStaticParams = async () => {
  const tags = await getTags();
  return tags?.map((tag) => ({ tag }));
};

type TagPageProps = { params: { tag: string } };

export const generateMetadata = async ({
  params
}: TagPageProps): Promise<Metadata> => {
  return {
    title: `toris-dev의 블로그 - ${decodeURIComponent(params.tag)}`,
    description: '프로젝트 이야기를 나누는 블로그입니다.'
  };
};
