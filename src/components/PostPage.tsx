'use client';

import { MarkdownViewer } from '@/components/Markdown';
import { CommentType } from '@/types';
import dayjs from 'dayjs';
import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';
import Comment from './Comment';
import CommentInput from './CommentInput';
import { useComments } from './context/CommentContext';

// 마크다운 파일에서 가져올 때 사용할 인터페이스에 맞게 props를 수정합니다
const PostPage: FC<{
  title: string;
  category?: string;
  tags?: string[];
  content: string;
  date?: string;
  image?: string;
  postId: number | string;
}> = ({
  title,
  category = 'Uncategorized',
  tags = [],
  content,
  date,
  image,
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
          {dayjs(new Date(date || '')).format('YY년 MM월 DD일 HH:mm')}
        </div>
      </div>
      {image && (
        <Image
          src={image}
          width={0}
          height={0}
          sizes="100vw"
          alt={title}
          className="h-auto w-full"
        />
      )}
      <div className="min-w-full rounded-md">
        <MarkdownViewer value={content} />
      </div>
      <hr />
      {organizedComments.map((comment: CommentType) => (
        <Comment key={comment.id} {...comment} />
      ))}
      <div className="flex flex-col items-center">
        <CommentInput
          postId={typeof postId === 'string' ? parseInt(postId, 10) : postId}
        />
      </div>
    </div>
  );
};

export default PostPage;
