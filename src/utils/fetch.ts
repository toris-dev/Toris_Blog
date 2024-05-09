import { cache } from 'react';
import { createClient as createBrowserClient } from './supabase/client';
import { createClient as createServerClient } from './supabase/server';

export const getPosts = async ({
  category,
  tag,
  page = 0
}: {
  category?: string;
  tag?: string;
  page?: number;
}) => {
  const supabase =
    typeof window === 'undefined'
      ? createServerClient()
      : createBrowserClient();

  let request = supabase.from('Post').select('*');

  if (category) request = request.eq('category', category);
  if (tag) request = request.like('tags', `%${tag}%`);

  const { data } = await request
    .order('created_at', { ascending: false })
    .range(page, page + 4);

  return data?.map((post) => ({
    ...post,
    tags: JSON.parse(post.tags) as string[]
  }));
};

export const getPost = cache(async (id: string) => {
  const supabase =
    typeof window === 'undefined'
      ? createServerClient()
      : createBrowserClient();

  const { data } = await supabase.from('Post').select('*').eq('id', id);

  if (!data) return null;
  return {
    ...data[0],
    tags: JSON.parse(data[0].tags) as string[]
  };
});

export const getTags = async () => {
  const supabase =
    typeof window === 'undefined'
      ? createServerClient()
      : createBrowserClient();
  const { data } = await supabase.from('Post').select('tags');
  return Array.from(
    new Set(data?.flatMap((d) => JSON.parse(d.tags)))
  ) as string[];
};

export const getCategories = cache(async () => {
  const supabase =
    typeof window === 'undefined'
      ? createServerClient()
      : createBrowserClient();
  const { data } = await supabase.from('Post').select('category');
  return Array.from(new Set(data?.map((d) => d.category))) as string[];
});

export const getPostId = async () => {
  const supabase = createBrowserClient();
  const { data } = await supabase.from('Post').select('id,created_at');
  return (
    data?.map(({ id, created_at }) => ({ id: id.toString(), created_at })) ?? []
  );
};

export const getComments = async (postId: number) => {
  const supabase =
    typeof window === 'undefined'
      ? createServerClient()
      : createBrowserClient();
  const { data } = await supabase
    .from('Comments')
    .select(
      'content, created_at, id ,like ,parent_comment_id ,post_id, writer_id'
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: false });
  return data! ?? [];
};
