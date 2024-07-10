'use client';

import styles from '@/styles/filp.module.css';
import { Post } from '@/types';
import { cn } from '@/utils/style';
import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';
import { MarkdownViewer } from './Markdown';
export type PostCardProps = Post & {
  className?: string;
};

const PostCard: FC<PostCardProps> = ({
  id,
  title,
  content,
  preview_image_url,
  className,
  category,
  tags
}) => {
  if (typeof tags === 'string') tags = JSON.parse(tags);

  return (
    <Link
      href={`/posts/${id}`}
      className={cn(
        'overflow-hidden rounded-xl border-2 border-indigo-300 bg-white',
        className
      )}
    >
      <div className={`${styles.flipCard} h-72 text-black shadow-2xl`}>
        <div className={`${styles.front} `}>
          <div className="relative aspect-[1.8/1] ">
            <Image
              src={preview_image_url ?? '/book-open.svg'}
              fill
              sizes="360px"
              alt={title}
              className="object-cover"
              priority
            />
          </div>
          <div className="ml-2 flex w-full flex-1 flex-col items-start justify-between">
            <h1 className="mb-3 mt-2 text-lg font-medium">{title}</h1>
            <div className="flex gap-3">
              <p className="rounded-md bg-slate-800 px-2 py-1 text-sm text-white lg:flex-1">
                {category}
              </p>
              <p className="rounded-md bg-slate-200 px-2 py-1 text-sm text-slate-900">
                {tags.map((tag) => tag).join(', ')}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`${styles.back} flex size-full items-center justify-center`}
        >
          <div
            className="line-clamp-6 text-ellipsis bg-white p-3 text-sm text-zinc-950"
            style={{ maxHeight: '300px', overflowY: 'auto', minHeight: '100%' }}
          >
            <MarkdownViewer source={content} className="line-clamp-12" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;
