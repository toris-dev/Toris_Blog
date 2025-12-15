'use client';

import { Post } from '@/types';
import { cn } from '@/utils/style';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
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
    <motion.div
      className={cn(
        'shadow-soft hover:shadow-medium group block overflow-hidden rounded-lg border border-border bg-card text-card-foreground transition-shadow',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{
        y: -8,
        rotateX: 5,
        rotateY: 5,
        transition: { duration: 0.3 }
      }}
      style={{ perspective: 1000 }}
    >
      {/* Main Card Content */}
      <div>
        <div className="relative overflow-hidden">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <Image
              src={preview_image_url ?? '/images/book-open.svg'}
              width={400}
              height={225}
              alt={title}
              className="w-full object-cover"
              priority
            />
          </motion.div>
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="p-4">
          <motion.p
            className="mb-2 text-sm font-medium text-primary"
            whileHover={{ scale: 1.05 }}
          >
            {category}
          </motion.p>
          <h3 className="mb-2 truncate text-lg font-bold text-card-foreground transition-colors group-hover:text-primary">
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
                <motion.span
                  key={tag}
                  className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                  whileHover={{ scale: 1.1 }}
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PostCard;
