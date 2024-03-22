import PostList from '@/components/PostList';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function CategoryPosts({
  params
}: {
  params: { category: string };
}) {
  const supabase = createClient(cookies());
  const category = params.category;
  const { data } = await supabase
    .from('Post')
    .select('*')
    .eq('category', category);

  return (
    <PostList
      category={category}
      initalPosts={data?.map((post) => ({
        ...post,
        tags: JSON.parse(post.tags) as string[]
      }))}
    />
  );
}

export const generateStaticParams = async () => {
  const supabase = createClient();
  const { data } = await supabase.from('Post').select('category');
  const categories = Array.from(new Set(data?.map((d) => d.category)));
  return categories.map((category) => ({ category }));
};
