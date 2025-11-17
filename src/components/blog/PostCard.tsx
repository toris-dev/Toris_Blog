'use client';

import { Post } from '@/types';
import { cn } from '@/utils/style';
import dayjs from 'dayjs';
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
  date,
  preview_image_url,
  className,
  category,
  tags,
  content
}) => {
  const tagArray = Array.isArray(tags) ? tags : [];

  return (
    <div
      className={cn(
        'group block overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl dark:border-border',
        className
      )}
    >
      {/* Main Card Content */}
      <div>
        <div className="relative overflow-hidden">
          <Image
            src={preview_image_url ?? '/images/book-open.svg'}
            width={400}
            height={225}
            alt={title}
            className="w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <div className="p-4">
          <p className="mb-2 text-sm font-medium text-primary">{category}</p>
          <h3 className="mb-2 truncate text-lg font-bold text-card-foreground">
            {title}
          </h3>
          <div className="mb-3 flex items-center text-xs text-muted-foreground">
            <time dateTime={date}>
              {dayjs(date).format('YYYY년 MM월 DD일')}
            </time>
          </div>
          {tagArray.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tagArray.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
