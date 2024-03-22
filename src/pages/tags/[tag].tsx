import PostList from '@/components/PostList';
import { Post } from '@/types';
import { createClient } from '@/utils/supabase/server';
import { GetStaticPaths, GetStaticProps } from 'next';

type TagPostsProps = {
  tag: string;
  posts: Post[];
};
const supabase = createClient({});

export default function TagPosts({ tag }: TagPostsProps) {
  return <PostList tag={tag} />;
}

export const getStaticProps = (async ({ params }) => {
  const tag = params?.tag as string;
  const { data } = await supabase
    .from('Post')
    .select('*')
    .like('tags', `%${tag}%`);

  return {
    props: {
      tag: tag,
      posts:
        data?.map((post) => ({
          ...post,
          tags: JSON.parse(post.tags) as string[]
        })) ?? []
    }
  };
}) satisfies GetStaticProps<TagPostsProps>;

export const getStaticPaths = (async () => {
  const { data } = await supabase.from('Post').select('tags');
  const tags = Array.from(new Set(data?.flatMap((d) => JSON.parse(d.tags))));
  return {
    paths: tags?.map((tag) => ({ params: { tag } })),
    fallback: false
  };
}) satisfies GetStaticPaths;
