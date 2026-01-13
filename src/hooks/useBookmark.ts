import { useState, useEffect, useCallback } from 'react';
import {
  isBookmarked as checkIsBookmarked,
  addBookmark,
  removeBookmark,
  getBookmarks
} from '@/utils/bookmarks';
import { BookmarkData } from '@/types/bookmark';
import toast from 'react-hot-toast';

interface UseBookmarkReturn {
  isBookmarked: boolean;
  bookmarks: BookmarkData[];
  toggle: (postId: string, title: string) => void;
  remove: (postId: string) => void;
}

export function useBookmark(postId?: string): UseBookmarkReturn {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // 북마크 목록 로드
    const loadedBookmarks = getBookmarks();
    setBookmarks(loadedBookmarks);

    // 특정 포스트 북마크 상태 확인
    if (postId) {
      setIsBookmarked(checkIsBookmarked(postId));
    }
  }, [postId]);

  const toggle = useCallback(
    (targetPostId: string, title: string) => {
      const currentStatus = checkIsBookmarked(targetPostId);

      if (currentStatus) {
        // 북마크 제거
        const success = removeBookmark(targetPostId);
        if (success) {
          setIsBookmarked(false);
          setBookmarks(getBookmarks());
          toast.success('북마크에서 제거되었습니다.');
        }
      } else {
        // 북마크 추가
        const success = addBookmark(targetPostId, title);
        if (success) {
          setIsBookmarked(true);
          setBookmarks(getBookmarks());
          toast.success('북마크에 추가되었습니다.');
        } else {
          toast.error('이미 북마크에 추가된 포스트입니다.');
        }
      }
    },
    []
  );

  const remove = useCallback((targetPostId: string) => {
    const success = removeBookmark(targetPostId);
    if (success) {
      if (postId === targetPostId) {
        setIsBookmarked(false);
      }
      setBookmarks(getBookmarks());
      toast.success('북마크에서 제거되었습니다.');
    }
  }, [postId]);

  return {
    isBookmarked,
    bookmarks,
    toggle,
    remove
  };
}
