'use client';

import { BookmarkData } from '@/types/bookmark';
import { useBookmark } from '@/hooks/useBookmark';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { FaTrash } from '@/components/icons';

dayjs.extend(relativeTime);
dayjs.locale('ko');

interface BookmarkListProps {
  bookmarks: BookmarkData[];
}

export function BookmarkList({ bookmarks }: BookmarkListProps) {
  const { remove } = useBookmark();

  if (bookmarks.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-lg">북마크한 포스트가 없습니다.</p>
        <p className="mt-2 text-sm">포스트를 북마크하여 나중에 쉽게 찾아보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookmarks.map((bookmark, index) => {
        const relativeTimeStr = dayjs(bookmark.addedAt).fromNow();

        return (
          <motion.div
            key={bookmark.postId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <Link
                href={`/posts/${bookmark.postId}`}
                className="flex-1 transition-colors hover:text-primary"
              >
                <h3 className="mb-2 font-semibold text-foreground">{bookmark.title}</h3>
                <p className="text-xs text-muted-foreground">{relativeTimeStr}에 추가됨</p>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove(bookmark.postId)}
                className="size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="북마크 제거"
              >
                <FaTrash className="size-4 text-destructive" />
              </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
