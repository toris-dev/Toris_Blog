'use client';

import { Markdown } from '@/components/blog/Markdown';
import Comment from '@/components/comments/Comment';
import CommentInput from '@/components/comments/CommentInput';
import { useComments } from '@/components/context/CommentContext';
import { FaCalendarAlt, FaFolder, FaTags } from '@/components/icons';
import { CommentType } from '@/types';
import dayjs from 'dayjs';
import Link from 'next/link';
import { FC } from 'react';

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

  const formattedDate = dayjs(new Date(date || '')).format(
    'YY년 MM월 DD일 HH:mm'
  );

  return (
    <article className="container mx-auto mt-12 max-w-4xl px-4 pb-32">
      <header className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold dark:text-white">{title}</h1>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <FaCalendarAlt className="mr-2" />
            {formattedDate}
          </span>
          <Link
            href={`/categories/${category}`}
            className="dark:hover:text-primary-light flex items-center text-sm text-gray-600 hover:text-primary dark:text-gray-400"
          >
            <FaFolder className="mr-2" />
            {category}
          </Link>
          <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <FaTags className="mr-2" />
            {Array.isArray(tags)
              ? tags.join(', ')
              : typeof tags === 'string'
                ? (tags as string)
                    .split(',')
                    .map((tag: string) => tag.trim())
                    .join(', ')
                : ''}
          </span>
        </div>
      </header>

      <div className="prose-md prose max-w-full dark:prose-invert">
        <Markdown>{content}</Markdown>
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
    </article>
  );
};

export default PostPage;
