import PostList from '@/components/PostList';
import { createClient } from '@/utils/supabase/server';
import { GetStaticPaths, GetStaticProps } from 'next';

type CategoryPostsProps = {
  category: string;
};

const supabase = createClient({});

export default function CategoryPosts({ category }: CategoryPostsProps) {
  return <PostList category={category} />;
}

export const getStaticProps = (async (context) => {
  const category = context.params?.category as string;
  const { data } = await supabase
    .from('Post')
    .select('*')
    .eq('category', category);

  return {
    props: {
      category: context.params?.category as string,
      posts:
        data?.map((post) => ({
          ...post,
          tags: JSON.parse(post.tags) as string[]
        })) ?? []
    }
  };
}) satisfies GetStaticProps<CategoryPostsProps>;

export const getStaticPaths = (async () => {
  const { data } = await supabase.from('Post').select('category');
  const categories = Array.from(new Set(data?.map((d) => d.category)));
  return {
    paths: categories?.map((category) => ({ params: { category } })) ?? [],
    fallback: false
  };
}) satisfies GetStaticPaths;
