import { BookmarkData, BookmarkStorage } from '@/types/bookmark';

const STORAGE_KEY = 'bookmarks';
const MAX_BOOKMARKS = 100; // 최대 북마크 수

// 북마크 저장소에서 데이터 가져오기
export function getBookmarks(): BookmarkData[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const data: BookmarkStorage = JSON.parse(stored);
    return data.bookmarks || [];
  } catch (error) {
    console.error('Error reading bookmarks from storage:', error);
    return [];
  }
}

// 북마크 저장소에 데이터 저장
export function saveBookmarks(bookmarks: BookmarkData[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // 최대 개수 제한
    const limitedBookmarks = bookmarks.slice(0, MAX_BOOKMARKS);
    const data: BookmarkStorage = {
      bookmarks: limitedBookmarks
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving bookmarks to storage:', error);
    // 용량 초과 시 오래된 북마크 제거
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      const limitedBookmarks = bookmarks.slice(-MAX_BOOKMARKS);
      const data: BookmarkStorage = {
        bookmarks: limitedBookmarks
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (retryError) {
        console.error('Error retrying save bookmarks:', retryError);
      }
    }
  }
}

// 북마크 추가
export function addBookmark(postId: string, title: string): boolean {
  const bookmarks = getBookmarks();

  // 중복 체크
  if (bookmarks.some((bookmark) => bookmark.postId === postId)) {
    return false;
  }

  const newBookmark: BookmarkData = {
    postId,
    title,
    addedAt: new Date().toISOString()
  };

  // 최신순으로 추가 (맨 앞에)
  const updatedBookmarks = [newBookmark, ...bookmarks];
  saveBookmarks(updatedBookmarks);
  return true;
}

// 북마크 제거
export function removeBookmark(postId: string): boolean {
  const bookmarks = getBookmarks();
  const updatedBookmarks = bookmarks.filter(
    (bookmark) => bookmark.postId !== postId
  );

  if (updatedBookmarks.length === bookmarks.length) {
    return false; // 북마크가 없었음
  }

  saveBookmarks(updatedBookmarks);
  return true;
}

// 북마크 확인
export function isBookmarked(postId: string): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some((bookmark) => bookmark.postId === postId);
}

// 북마크 개수 조회
export function getBookmarkCount(): number {
  return getBookmarks().length;
}
