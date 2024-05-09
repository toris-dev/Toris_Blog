'use client';

import { MarkdownViewer } from '@/components/Markdown';
import { Post } from '@/types';
import { useComments } from '@/utils/hooks';
import dayjs from 'dayjs';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useEffect, useState } from 'react';
import Comment from './Comment';
import CommentInput from './CommentInput';
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

const organizeComments = (comments: CommentType[]) => {
  // 댓글을 id를 키로 하여 맵에 저장합니다. 이를 통해 나중에 특정 댓글을 찾을 때 용이합니다.
  const commentMap: {
    [key: number]: CommentType & { replies: CommentType[] };
  } = {};

  // 먼저 모든 댓글을 맵에 추가하고, replies 배열을 초기화합니다.
  comments?.forEach((comment) => {
    commentMap[comment.id] = { ...comment, replies: [] };
  });

  // 최상위 댓글들을 담을 배열입니다.
  const topLevelComments: (CommentType & { replies: CommentType[] })[] = [];

  // 댓글을 순회하면서 대댓글을 해당하는 위치에 넣습니다.
  comments?.forEach((comment) => {
    if (comment.parent_comment_id === null) {
      topLevelComments.push(commentMap[comment.id]);
    } else {
      if (commentMap[comment.parent_comment_id]) {
        commentMap[comment.parent_comment_id].replies.push(
          commentMap[comment.id]
        );
      }
    }
  });

  // 최상위 댓글만 반환합니다. 대댓글은 각 댓글의 replies 배열 안에 재귀적으로 위치합니다.
  return topLevelComments;
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
  const [organizedComments, setOrganizedComments] = useState<
    (CommentType & { replies: CommentType[] })[]
  >([]);
  // 댓글 데이터가 comments 변수에 있다고 가정합니다. 실제로는 useComments 훅 등으로 불러와야 합니다.
  const { data: comments } = useComments(postId as number);
  useEffect(() => {
    // 댓글 데이터가 변경될 때마다 댓글을 재구성합니다.
    const newOrganizedComments = organizeComments(comments as CommentType[]);
    setOrganizedComments(newOrganizedComments);
  }, [comments]);

  return (
    <div className="container flex flex-col gap-8 pb-40 pt-20">
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
      <MarkdownViewer source={content} className="min-w-full" />

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
