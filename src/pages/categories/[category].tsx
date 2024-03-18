import PostList from '@/components/PostList';
import { createClient } from '@/utils/supabase/client';
import { GetServerSideProps } from 'next';

type CategoryPostsProps = {
  category: string;
};
const supabase = createClient();
export default function CategoryPosts({ category }: CategoryPostsProps) {
  return <PostList category={category} />;
}

export const getServerSideProps: GetServerSideProps<
  CategoryPostsProps
> = async ({ query }) => {
  return {
    props: { category: query.category as string }
  };
};
