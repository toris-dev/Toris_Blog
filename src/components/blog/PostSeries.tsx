'use client';

import { Post } from '@/types';
import { SeriesMetadata, getSeriesNavigation } from '@/utils/postSeries';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FaChevronLeft, FaChevronRight, FaList } from '@/components/icons';
import { cn } from '@/utils/style';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PostSeriesProps {
  series: SeriesMetadata;
  currentPost: Post;
}

export function PostSeries({ series, currentPost }: PostSeriesProps) {
  const [showList, setShowList] = useState(false);
  const navigation = getSeriesNavigation(currentPost, series);
  const progress = (navigation.currentIndex / series.totalPosts) * 100;

  return (
    <div className="mb-8 rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{series.name}</h3>
          <p className="text-sm text-muted-foreground">
            {navigation.currentIndex} / {series.totalPosts}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowList(!showList)}
          className="gap-2"
        >
          <FaList className="size-4" />
          {showList ? '목록 숨기기' : '목록 보기'}
        </Button>
      </div>

      {/* 진행률 바 */}
      <div className="mb-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-primary"
          />
        </div>
      </div>

      {/* 시리즈 목록 */}
      <AnimatePresence>
        {showList && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 overflow-hidden"
          >
            <ul className="space-y-2">
              {series.posts.map((post, index) => (
                <li key={post.id}>
                  <Link
                    href={`/posts/${post.id}`}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                      post.id === currentPost.slug
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs">
                      {index + 1}
                    </span>
                    <span className="flex-1 truncate">{post.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 네비게이션 버튼 */}
      <div className="flex items-center justify-between gap-4">
        {navigation.previous ? (
          <Link
            href={`/posts/${navigation.previous.id}`}
            className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:bg-accent"
          >
            <FaChevronLeft className="size-4" />
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">이전 포스트</span>
              <span className="text-sm font-medium text-foreground line-clamp-1">
                {navigation.previous.title}
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {navigation.next ? (
          <Link
            href={`/posts/${navigation.next.id}`}
            className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-right transition-colors hover:bg-accent"
          >
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">다음 포스트</span>
              <span className="text-sm font-medium text-foreground line-clamp-1">
                {navigation.next.title}
              </span>
            </div>
            <FaChevronRight className="size-4" />
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}
