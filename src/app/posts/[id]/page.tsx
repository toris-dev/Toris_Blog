import PostPage from '@/components/PostPage';
import { CommentsProvider } from '@/components/context/CommentContext';
import { getPost } from '@/utils/fetch';
import { createClient } from '@/utils/supabase/server';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export default async function Post({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);
  if (!post) return notFound();

  return (
    <CommentsProvider postId={Number(params.id)}>
      <PostPage {...post} postId={Number(params.id)} />;
    </CommentsProvider>
  );
}

export const generateStaticParams = async () => {
  const supabase = createClient();
  const { data } = await supabase.from('Post').select('id');
  return data?.map(({ id }) => ({ id: id.toString() })) ?? [];
};

type PostProps = { params: { id: string } };
export const generateMetadata = async ({
  params
}: PostProps): Promise<Metadata> => {
  const post = await getPost(params.id);
  return {
    title: post?.title,
    description: post?.content?.split('.')[0],
    openGraph: post?.preview_image_url
      ? {
          images: [
            {
              url: post?.preview_image_url
            }
          ]
        }
      : undefined
  };
};
