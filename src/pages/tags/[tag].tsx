import PostList from '@/components/PostList';
import { createClient } from '@/utils/supabase/client';
import { GetServerSideProps } from 'next';

type TagPostsProps = {
  tag: string;
};
const supabase = createClient();
export default function TagPosts({ tag }: TagPostsProps) {
  return <PostList tag={tag} />;
}

export const getServerSideProps: GetServerSideProps<TagPostsProps> = async ({
  query
}) => {
  return {
    props: { tag: query.tag as string }
  };
};
