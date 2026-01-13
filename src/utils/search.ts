import { Post } from '@/types';

export interface SearchFilters {
  query: string;
  dateRange: 'all' | 'week' | 'month' | '3months' | '6months' | 'year';
  categories: string[];
  tags: string[];
  sortBy: 'newest' | 'oldest' | 'popular';
}

export interface SearchHistoryItem {
  query: string;
  filters?: Partial<SearchFilters>;
  searchedAt: string; // ISO string
}

const STORAGE_KEY = 'search_history';
const MAX_HISTORY = 10;

// 검색 히스토리 저장
export function saveSearchHistory(query: string, filters?: Partial<SearchFilters>): void {
  if (typeof window === 'undefined' || !query.trim()) {
    return;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let history: SearchHistoryItem[] = stored ? JSON.parse(stored) : [];

    // 중복 제거 (같은 쿼리와 필터 조합)
    history = history.filter(
      (item) => !(item.query === query && JSON.stringify(item.filters) === JSON.stringify(filters))
    );

    // 새 항목 추가
    history.unshift({
      query,
      filters,
      searchedAt: new Date().toISOString()
    });

    // 최대 개수 제한
    history = history.slice(0, MAX_HISTORY);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
}

// 검색 히스토리 조회
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading search history:', error);
    return [];
  }
}

// 검색 히스토리 삭제
export function removeSearchHistoryItem(index: number): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const history = getSearchHistory();
    history.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error removing search history item:', error);
  }
}

// 검색 히스토리 전체 삭제
export function clearSearchHistory(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
}

// 검색어 하이라이팅 - 문자열 배열 반환 (JSX는 컴포넌트에서 처리)
export function highlightTextParts(text: string, searchTerm: string): Array<{ text: string; isMatch: boolean }> {
  if (!searchTerm.trim()) {
    return [{ text, isMatch: false }];
  }

  const parts = text.split(new RegExp(`(${escapeRegex(searchTerm)})`, 'gi'));
  
  return parts.map((part) => ({
    text: part,
    isMatch: part.toLowerCase() === searchTerm.toLowerCase()
  }));
}

// 정규식 특수 문자 이스케이프
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 날짜 범위 필터링
export function filterByDateRange(
  posts: Post[],
  dateRange: SearchFilters['dateRange']
): Post[] {
  if (dateRange === 'all') {
    return posts;
  }

  const now = new Date();
  let cutoffDate: Date;

  switch (dateRange) {
    case 'week':
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '3months':
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '6months':
      cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      return posts;
  }

  return posts.filter((post) => {
    const postDate = new Date(post.date);
    return postDate >= cutoffDate;
  });
}

// 정렬
export function sortPosts(
  posts: Post[],
  sortBy: SearchFilters['sortBy']
): Post[] {
  const sorted = [...posts];

  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    case 'popular':
      // 조회수 기준 정렬 (현재는 날짜 기준으로 대체)
      return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    default:
      return sorted;
  }
}
