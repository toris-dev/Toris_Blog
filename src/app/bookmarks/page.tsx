'use client';

import { useEffect, useState } from 'react';
import { BookmarkList } from '@/components/bookmarks/BookmarkList';
import { BookmarkData } from '@/types/bookmark';
import { getBookmarks } from '@/utils/bookmarks';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadedBookmarks = getBookmarks();
    setBookmarks(loadedBookmarks);
    setIsLoading(false);
  }, []);

  // 북마크 변경 감지를 위한 이벤트 리스너
  useEffect(() => {
    const handleStorageChange = () => {
      const loadedBookmarks = getBookmarks();
      setBookmarks(loadedBookmarks);
    };

    window.addEventListener('storage', handleStorageChange);
    // 같은 탭에서의 변경 감지를 위한 커스텀 이벤트
    window.addEventListener('bookmarksUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bookmarksUpdated', handleStorageChange);
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold text-foreground">북마크</h1>
        <p className="text-muted-foreground">
          북마크한 포스트를 모아서 볼 수 있습니다.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">북마크를 불러오는 중...</div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              북마크한 포스트{' '}
              {bookmarks.length > 0 && (
                <span className="text-muted-foreground">({bookmarks.length})</span>
              )}
            </h2>
          </div>
          <BookmarkList bookmarks={bookmarks} />
        </div>
      )}
    </div>
  );
}
