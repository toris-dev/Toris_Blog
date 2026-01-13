'use client';

import { Post } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaFolder, FaTags } from '@/components/icons';
import { cn } from '@/utils/style';
import dayjs from 'dayjs';

interface RelatedPostsProps {
  posts: Post[];
  currentPostId: number | string;
}

export function RelatedPosts({ posts, currentPostId }: RelatedPostsProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold text-foreground">관련 포스트</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              href={`/posts/${encodeURIComponent(post.slug)}`}
              className="group block overflow-hidden rounded-lg border border-border bg-background transition-all hover:border-primary hover:shadow-md"
            >
              {/* 썸네일 이미지 */}
              {post.preview_image_url && (
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={post.preview_image_url}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}

              {/* 포스트 정보 */}
              <div className="p-4">
                <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                  {post.title}
                </h3>

                {post.description && (
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                    {post.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FaFolder className="size-3" />
                    {post.category}
                  </span>
                  {Array.isArray(post.tags) && post.tags.length > 0 && (
                    <span className="flex items-center gap-1">
                      <FaTags className="size-3" />
                      {post.tags.slice(0, 2).join(', ')}
                    </span>
                  )}
                  <span className="ml-auto">
                    {dayjs(post.date).format('YYYY.MM.DD')}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
