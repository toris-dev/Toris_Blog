import { MarkdownViewer } from '@/components/Markdown';
import type { Post } from '@/types';
import { createClient } from '@/utils/supabase/server';
import { format } from 'date-fns';
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import Image from 'next/image';
import Link from 'next/link';

const supabase = createClient({});

export default function PostPage({
  id,
  title,
  category,
  content,
  created_at,
  preview_image_url,
  tags
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <div className="container flex flex-col gap-8 px-4 pb-40 pt-20">
      <h1 className="text-4xl font-bold">{title}</h1>
      <div className="flex flex-row items-center gap-2">
        <Link
          href={`/categories/${category}`}
          className="rounded-md bg-slate-800 px-2 py-1 text-sm text-white"
        >
          {category}
        </Link>
        {tags.map((tag) => (
          <Link
            href={`/tags/${tag}`}
            key={tag}
            className="rounded-md bg-slate-200 px-2 py-1 text-sm text-slate-600"
          >
            {tag}
          </Link>
        ))}
        <div className="text-sm">
          {format(new Date(created_at), 'yyyy년 M월 d일 HH:mm')}
        </div>
      </div>
      {preview_image_url && (
        <Image
          src={preview_image_url}
          alt={title}
          className="h-auto w-full"
          width={780}
          height={700}
        />
      )}
      <MarkdownViewer source={content} className="min-w-full" />
    </div>
  );
}

export const getStaticProps = (async (context) => {
  const { data } = await supabase
    .from('Post')
    .select('*')
    .eq('id', Number(context.params?.id));

  if (!data || !data[0]) {
    return { notFound: true };
  }
  // { notFound: true };

  const { id, title, category, content, created_at, preview_image_url, tags } =
    data[0];
  return {
    props: {
      id,
      title,
      category,
      content,
      created_at,
      preview_image_url,
      tags: JSON.parse(tags) as string[]
    }
  };
}) satisfies GetStaticProps<Post>;

export const getStaticPaths = (async () => {
  const { data } = await supabase.from('Post').select('id');
  return {
    paths: data?.map(({ id }) => ({ params: { id: id.toString() } })) ?? [],
    fallback: false
  };
}) satisfies GetStaticPaths;
