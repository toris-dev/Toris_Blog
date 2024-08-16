'use client';

import { MarkdownViewer } from '@/components/Markdown';
import { Post } from '@/types';

import dayjs from 'dayjs';
import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';
import Comment from './Comment';
import CommentInput from './CommentInput';
import { useComments } from './context/CommentContext';
export type CommentType = {
  content: string;
  created_at: string;
  id: number;
  like: number;
  parent_comment_id: number | null;
  post_id: number;
  writer_id: string;
  replies: CommentType[];
};

const PostPage: FC<Post> = ({
  title,
  category,
  tags,
  content,
  created_at,
  preview_image_url,
  postId
}) => {
  const { organizedComments } = useComments();

  return (
    <div className="container my-8 flex flex-col gap-8 rounded-3xl bg-white p-12 shadow-2xl">
      <h1 className="text-4xl font-bold">{title}</h1>
      <hr />
      <div className="flex flex-row items-center gap-2">
        <Link
          href={`/categories/${category}`}
          className="rounded-md bg-slate-600 px-2 py-1 text-sm text-white"
        >
          {category}
        </Link>
        {tags.map((tag) => (
          <Link
            href={`/tags/${tag}`}
            key={tag}
            className="rounded-md bg-slate-200 px-2 py-1 text-sm text-slate-500"
          >
            {tag}
          </Link>
        ))}
        <div className="text-sm text-gray-500">
          {dayjs(new Date(created_at)).format('YY년 MM월 DD일 HH:mm')}
        </div>
      </div>
      {preview_image_url && (
        <Image
          src={preview_image_url}
          width={0}
          height={0}
          sizes="100vw"
          alt={title}
          className="h-auto w-full"
        />
      )}
      <MarkdownViewer source={content} className="min-w-full rounded-md" />
      <hr />
      {organizedComments.map((comment) => (
        <Comment key={comment.id} {...comment} />
      ))}
      <div className="flex flex-col items-center">
        <CommentInput postId={postId as number} />
      </div>
    </div>
  );
};

export default PostPage;
