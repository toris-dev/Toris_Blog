import PostPage from '@/components/PostPage';
import { getPost } from '@/utils/fetch';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

export default async function Post({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);
  if (!post) return notFound();

  return <PostPage {...post} />;
}

export const generateStaticParams = async () => {
  const supabase = createClient();
  const { data } = await supabase.from('Post').select('id');
  return data?.map(({ id }) => ({ id: id.toString() })) ?? [];
};
