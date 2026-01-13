'use client';

import {
  FaBlog,
  FaFolder,
  FaSearch,
  FaTags,
  IoClose
} from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Post } from '@/types';
import { cn } from '@/utils/style';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { saveSearchHistory, filterByDateRange, sortPosts, SearchFilters } from '@/utils/search';
import { SearchHistory } from '@/components/search/SearchHistory';
import { HighlightText } from '@/components/search/HighlightText';

// Debounce helper function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  } as ((...args: Parameters<T>) => void) & { cancel: () => void };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

// 인터페이스 정의
interface SearchResultProps {
  posts: Post[];
  searchTerm: string;
  getCategoryColor: (category: string) => string;
}

interface ClientSearchPageProps {
  initialPosts: Post[];
}

// 스켈레톤 카드 컴포넌트
const SkeletonCard = () => {
  return (
    <div className="overflow-hidden rounded-xl border border-primary/30 shadow-sm">
      <div className="relative h-48 w-full animate-pulse bg-primary/10"></div>
      <div className="p-5">
        <div className="mb-2 h-6 w-3/4 animate-pulse rounded-md bg-primary/10"></div>
        <div className="mb-4 space-y-2">
          <div className="h-4 w-full animate-pulse rounded-md bg-primary/10"></div>
          <div className="h-4 w-full animate-pulse rounded-md bg-primary/10"></div>
          <div className="h-4 w-2/3 animate-pulse rounded-md bg-primary/10"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-3 w-1/4 animate-pulse rounded-md bg-primary/10"></div>
          <div className="flex space-x-1">
            <div className="h-4 w-10 animate-pulse rounded-full bg-primary/10"></div>
            <div className="h-4 w-10 animate-pulse rounded-full bg-primary/10"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 스켈레톤 검색 결과 컴포넌트
const SearchSkeleton = () => {
  return (
    <motion.div
      initial={false}
      animate={false}
      className="space-y-6"
      suppressHydrationWarning
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="h-7 w-1/4 animate-pulse rounded-md bg-primary/10"></div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </motion.div>
  );
};

const ClientSearchPage = ({ initialPosts }: ClientSearchPageProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 클라이언트에서만 마운트되었는지 확인 (SSR hydration 오류 방지)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // initialPosts는 서버 컴포넌트에서 전달되므로 참조가 안정적
  // 불필요한 useMemo 제거
  const posts = initialPosts;

  // posts를 ref로 저장하여 useEffect 의존성 경고 방지
  // posts는 초기 로드 후 변경되지 않으므로 ref 사용이 안전
  const postsRef = useRef(posts);
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  // filteredPosts 초기화
  const [filteredPosts, setFilteredPosts] = useState<Post[]>(initialPosts);
  const [activeFilters, setActiveFilters] = useState<{
    categories: string[];
    tags: string[];
    dateRange: SearchFilters['dateRange'];
    sortBy: SearchFilters['sortBy'];
  }>({
    categories: [],
    tags: [],
    dateRange: 'all',
    sortBy: 'newest'
  });
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  // activeFilters의 중복 제거 (안전장치)
  const uniqueActiveFilters = useMemo(
    () => ({
      categories: Array.from(new Set(activeFilters.categories)),
      tags: Array.from(new Set(activeFilters.tags)),
      dateRange: activeFilters.dateRange,
      sortBy: activeFilters.sortBy
    }),
    [activeFilters]
  );

  // 사용 가능한 필터를 메모이제이션
  const availableFilters = useMemo(() => {
    const categories = Array.from(new Set(posts.map((post) => post.category)));
    const tags = Array.from(
      new Set(
        posts.flatMap((post) =>
          typeof post.tags === 'string'
            ? post.tags.split(',').map((tag) => tag.trim())
            : post.tags
        )
      )
    );

    return {
      categories: categories as string[],
      tags: tags as string[]
    };
  }, [posts]);

  const [showFilters, setShowFilters] = useState(false);
  const searchParams = useSearchParams();
  const currentCategoryFromUrl = searchParams.get('category');

  // URL에서 카테고리 필터 적용 (초기 로드 시에만, 한 번만 실행)
  const hasInitializedCategoryFilter = useRef(false);
  useEffect(() => {
    if (currentCategoryFromUrl && !hasInitializedCategoryFilter.current) {
      hasInitializedCategoryFilter.current = true;
      setActiveFilters((prev) => ({
        ...prev,
        categories: [currentCategoryFromUrl]
      }));
    }
  }, [currentCategoryFromUrl]);

  // 검색 및 필터링 로직 - debounce로 입력이 끝난 후에만 실행
  const debouncedFilterRef = useRef(
    debounce(
      (
        term: string,
        filters: {
          categories: string[];
          tags: string[];
          dateRange: SearchFilters['dateRange'];
          sortBy: SearchFilters['sortBy'];
        },
        postsData: Post[]
      ) => {
        if (!postsData.length) {
          setIsFiltering(false);
          return;
        }

        // 입력이 끝났을 때만 필터링 시작
        setIsFiltering(true);

        let results = [...postsData];

        // 검색어로 필터링
        if (term) {
          const lowerTerm = term.toLowerCase();
          results = results.filter(
            (post) =>
              post.title.toLowerCase().includes(lowerTerm) ||
              post.content.toLowerCase().includes(lowerTerm) ||
              post.category.toLowerCase().includes(lowerTerm) ||
              (typeof post.tags === 'string'
                ? post.tags.toLowerCase().includes(lowerTerm)
                : post.tags.some((tag) =>
                    tag.toLowerCase().includes(lowerTerm)
                  ))
          );
        }

        // 날짜 범위로 필터링
        results = filterByDateRange(results, filters.dateRange);

        // 카테고리로 필터링
        if (filters.categories.length) {
          results = results.filter((post) =>
            filters.categories.includes(post.category)
          );
        }

        // 태그로 필터링
        if (filters.tags.length) {
          results = results.filter((post) => {
            const postTags =
              typeof post.tags === 'string'
                ? post.tags.split(',').map((tag) => tag.trim())
                : post.tags;

            return filters.tags.some((tag) => postTags.includes(tag));
          });
        }

        // 정렬
        results = sortPosts(results, filters.sortBy);

        setFilteredPosts(results);
        setIsFiltering(false);

        // 검색 히스토리 저장
        if (term.trim()) {
          saveSearchHistory(term, {
            dateRange: filters.dateRange,
            categories: filters.categories,
            tags: filters.tags,
            sortBy: filters.sortBy
          });
        }
      },
      500 // 입력이 완전히 끝난 후 500ms 후에 검색 실행
    )
  );

  // 검색어나 필터가 변경될 때 debounced 필터링 예약
  // 실제 검색은 debounce 함수 내부에서 입력이 끝난 후에만 실행됨
  // posts는 초기 로드 후 변경되지 않으므로 ref를 통해 접근
  // uniqueActiveFilters를 사용하여 중복 제거된 필터 적용
  useEffect(() => {
    // 입력 중에는 isFiltering을 설정하지 않음
    // debounce 함수 내부에서 입력이 끝났을 때만 isFiltering을 true로 설정
    debouncedFilterRef.current(
      searchTerm,
      uniqueActiveFilters,
      postsRef.current
    );
  }, [searchTerm, uniqueActiveFilters]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    const debouncedFilter = debouncedFilterRef.current;
    return () => {
      debouncedFilter.cancel();
    };
  }, []);

  // 필터 토글 함수 - useCallback으로 메모이제이션
  const toggleCategoryFilter = useCallback((category: string) => {
    setActiveFilters((prev) => {
      const isActive = prev.categories.includes(category);

      return {
        ...prev,
        categories: isActive
          ? prev.categories.filter((c) => c !== category)
          : [...prev.categories, category]
      };
    });
  }, []);

  const toggleTagFilter = useCallback((tag: string) => {
    setActiveFilters((prev) => {
      const isActive = prev.tags.includes(tag);

      return {
        ...prev,
        tags: isActive
          ? prev.tags.filter((t) => t !== tag)
          : [...prev.tags, tag]
      };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters({
      categories: [],
      tags: [],
      dateRange: 'all',
      sortBy: 'newest'
    });
    setSearchTerm('');
  }, []);

  const handleSearchHistorySelect = useCallback((query: string) => {
    setSearchTerm(query);
    setShowSearchHistory(false);
  }, []);

  // 카테고리별 색상 매핑 - useCallback으로 메모이제이션
  const getCategoryColor = useCallback((category: string) => {
    const colors = {
      Technology: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
      Programming: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
      Design: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
      Life: 'from-orange-500/20 to-yellow-500/20 border-orange-500/30',
      Review: 'from-red-500/20 to-rose-500/20 border-red-500/30',
      Tutorial: 'from-indigo-500/20 to-violet-500/20 border-indigo-500/30'
    };
    return (
      colors[category as keyof typeof colors] ||
      'from-primary/20 to-accent/20 border-primary/30'
    );
  }, []);

  // highlightText 함수를 useCallback으로 메모이제이션
  // 각 포스트마다 별도로 호출되므로 index만으로도 충분
  const highlightText = useCallback((text: string, highlight: string) => {
    if (!highlight.trim()) return text;

    const regex = new RegExp(`(${highlight})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? (
        <span key={`highlight-${index}`} className="bg-primary/20 text-primary">
          {part}
        </span>
      ) : (
        part
      )
    );
  }, []);

  // 검색 결과 컴포넌트 - React.memo로 메모이제이션하여 불필요한 재렌더링 방지
  const SearchResults: React.FC<
    SearchResultProps & { isFiltering?: boolean; isMounted?: boolean }
  > = memo(
    ({
      posts,
      searchTerm,
      getCategoryColor,
      isFiltering = false,
      isMounted = false
    }) => {
      return (
        <div>
          {/* 검색 결과 개수 표시 */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              총 <span className="font-semibold text-foreground">{posts.length}</span>개의
              결과를 찾았습니다
            </p>
          </div>

          {/* 필터링 중일 때는 애니메이션 없이 렌더링 */}
          {!posts.length ? (
            <motion.div
              initial={false}
              animate={isMounted ? { opacity: 1 } : false}
              className="flex flex-col items-center justify-center py-16 text-center"
              suppressHydrationWarning
            >
              <FaSearch className="mb-4 text-6xl text-muted-foreground/30" />
              <h3 className="mb-2 text-xl font-medium text-foreground">
                검색 결과가 없습니다
              </h3>
              <p className="text-muted-foreground">
                다른 검색어를 시도하거나 필터를 조정해보세요.
              </p>
            </motion.div>
          ) : (
        <div className="space-y-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-medium text-foreground">
              {posts.length}개의 검색 결과
              {searchTerm && ` - "${searchTerm}"`}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence initial={false}>
              {posts.map((post) => {
                // post.id는 파일 경로 기반 해시이므로 항상 고유함
                // index를 사용하지 않아 배열 순서 변경 시에도 안정적인 키 유지
                const uniqueKey = `post-${post.id}`;

                return (
                  <motion.div
                    key={uniqueKey}
                    initial={false}
                    animate={
                      isMounted && !isFiltering ? { opacity: 1, y: 0 } : false
                    }
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="group overflow-hidden rounded-xl border border-primary/30 shadow-sm transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                    suppressHydrationWarning
                  >
                    <Link href={`/posts/${encodeURIComponent(post.slug)}`}>
                      <div className="relative h-48 w-full overflow-hidden bg-primary/10">
                        {post.preview_image_url ? (
                          <Image
                            src={post.preview_image_url}
                            alt={post.title}
                            fill
                            className="object-cover transition-all group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <FaBlog className="text-6xl text-muted-foreground/20" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/70 to-transparent p-4">
                          <span
                            className={`rounded-full ${getCategoryColor(post.category)} shadow-soft border px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm`}
                          >
                            {post.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="mb-2 line-clamp-2 text-lg font-bold text-foreground group-hover:text-primary">
                          {searchTerm ? (
                            <HighlightText text={post.title} searchTerm={searchTerm} />
                          ) : (
                            post.title
                          )}
                        </h3>

                        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                          {searchTerm ? (
                            <>
                              <HighlightText
                                text={post.content
                                  .replace(/[#*`_]/g, '')
                                  .substring(0, 150)}
                                searchTerm={searchTerm}
                              />
                              ...
                            </>
                          ) : (
                            <>
                              {post.content.replace(/[#*`_]/g, '').substring(0, 150)}...
                            </>
                          )}
                        </p>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {new Date(post.date).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>

                          <div className="flex flex-wrap items-center gap-1">
                            {(typeof post.tags === 'string'
                              ? post.tags
                                  .split(',')
                                  .map((tag) => tag.trim())
                                  .slice(0, 2)
                              : post.tags.slice(0, 2)
                            ).map((tag) => (
                              <span
                                key={`${post.id}-${tag}`}
                                className="whitespace-nowrap rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground"
                              >
                                #{tag}
                              </span>
                            ))}
                            {(typeof post.tags === 'string'
                              ? post.tags.split(',').length
                              : post.tags.length) > 2 && (
                              <span className="whitespace-nowrap rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                                +
                                {typeof post.tags === 'string'
                                  ? post.tags.split(',').length - 2
                                  : post.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
            </div>
          )}
        </div>
      );
    },
    (prevProps, nextProps) => {
      // posts 배열이 실제로 변경되었는지 확인 (길이와 id 비교)
      if (prevProps.posts.length !== nextProps.posts.length) {
        return false; // 리렌더링 필요
      }

      // 각 post의 id를 비교하여 실제 변경이 있는지 확인
      const prevIds = prevProps.posts.map((p) => p.id).join(',');
      const nextIds = nextProps.posts.map((p) => p.id).join(',');
      if (prevIds !== nextIds) {
        return false; // 리렌더링 필요
      }

      // searchTerm이 변경되었는지 확인
      if (prevProps.searchTerm !== nextProps.searchTerm) {
        return false; // 리렌더링 필요
      }

      // isFiltering이 변경되었는지 확인
      if (prevProps.isFiltering !== nextProps.isFiltering) {
        return false; // 리렌더링 필요
      }

      // isMounted가 변경되었는지 확인
      if (prevProps.isMounted !== nextProps.isMounted) {
        return false; // 리렌더링 필요
      }

      // getCategoryColor는 useCallback으로 메모이제이션되어 있으므로 참조 비교만 하면 됨
      // 모든 props가 동일하면 리렌더링 불필요
      return true;
    }
  );

  // SearchResults에 displayName 설정 (디버깅용)
  SearchResults.displayName = 'SearchResults';

  return (
    <div className="min-h-screen px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Main Content */}
        <div className="flex-1">
          <motion.div
            initial={false}
            animate={isMounted ? { opacity: 1, y: 0 } : false}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
            suppressHydrationWarning
          >
            <h1 className="text-4xl font-bold tracking-tight text-primary">
              <span className="relative">
                블로그 검색
                <span className="absolute -bottom-1 left-0 h-1 w-full bg-primary"></span>
              </span>
            </h1>
            <p className="mt-4 text-muted-foreground">
              원하는 키워드로 블로그 포스트를 검색해보세요.
            </p>
          </motion.div>

          {/* 검색 인터페이스 */}
          <div className="shadow-medium mb-8 rounded-2xl border border-border bg-card p-6">
            <div className="relative">
              <div className="group relative mb-6">
                <div className="relative flex items-center">
                  <div className="absolute left-4 z-10 flex items-center justify-center">
                    <FaSearch className="text-lg text-muted-foreground transition-colors group-focus-within:text-primary" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="검색어를 입력하세요..."
                    className="w-full rounded-xl border-2 border-border bg-background/80 px-12 py-4 text-foreground shadow-sm outline-none backdrop-blur-sm transition-all duration-200 placeholder:text-muted-foreground/60 hover:border-primary/50 hover:bg-background hover:shadow-md focus:border-primary focus:bg-background focus:shadow-lg focus:ring-2 focus:ring-primary/20"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 z-10 flex items-center justify-center rounded-full p-1.5 text-muted-foreground transition-all hover:bg-muted hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label="검색어 지우기"
                    >
                      <IoClose size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* 필터 토글 버튼 */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {uniqueActiveFilters.categories.map((category, index) => (
                    <motion.span
                      key={`cat-${category}-${index}`}
                      initial={{ scale: 1, opacity: 1 }}
                      animate={
                        isMounted
                          ? { scale: 1, opacity: 1 }
                          : { scale: 1, opacity: 1 }
                      }
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                      suppressHydrationWarning
                    >
                      <FaFolder className="mr-1" />
                      {category}
                      <Button
                        onClick={() => toggleCategoryFilter(category)}
                        className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
                      >
                        <IoClose size={14} />
                      </Button>
                    </motion.span>
                  ))}

                  {uniqueActiveFilters.tags.map((tag, index) => (
                    <motion.span
                      key={`tag-${tag}-${index}`}
                      initial={{ scale: 1, opacity: 1 }}
                      animate={
                        isMounted
                          ? { scale: 1, opacity: 1 }
                          : { scale: 1, opacity: 1 }
                      }
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm text-accent"
                      suppressHydrationWarning
                    >
                      <FaTags className="mr-1" />
                      {tag}
                      <button
                        onClick={() => toggleTagFilter(tag)}
                        className="ml-1 rounded-full p-0.5 hover:bg-accent/20"
                      >
                        <IoClose size={14} />
                      </button>
                    </motion.span>
                  ))}

                  {(uniqueActiveFilters.categories.length > 0 ||
                    uniqueActiveFilters.tags.length > 0) && (
                    <motion.button
                      initial={{ scale: 1, opacity: 1 }}
                      animate={
                        isMounted
                          ? { scale: 1, opacity: 1 }
                          : { scale: 1, opacity: 1 }
                      }
                      exit={{ scale: 0.8, opacity: 0 }}
                      onClick={clearFilters}
                      className="inline-flex items-center rounded-full bg-foreground/10 px-3 py-1 text-sm text-foreground hover:bg-foreground/20"
                      suppressHydrationWarning
                    >
                      모든 필터 지우기
                    </motion.button>
                  )}
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="rounded-lg border border-primary/30 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/10"
                >
                  {showFilters ? '필터 숨기기' : '필터 보기'}
                </button>
              </div>

              {/* 확장 가능한 필터 섹션 */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={
                      showFilters
                        ? { height: 'auto', opacity: 1 }
                        : { height: 0, opacity: 0 }
                    }
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="shadow-soft overflow-hidden rounded-lg border border-border bg-card p-4"
                    suppressHydrationWarning
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* 날짜 필터 */}
                      <div>
                        <h3 className="mb-2 font-medium text-foreground">날짜 범위</h3>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: 'all', label: '전체' },
                            { value: 'week', label: '최근 1주일' },
                            { value: 'month', label: '최근 1개월' },
                            { value: '3months', label: '최근 3개월' },
                            { value: '6months', label: '최근 6개월' },
                            { value: 'year', label: '최근 1년' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() =>
                                setActiveFilters((prev) => ({
                                  ...prev,
                                  dateRange: option.value as SearchFilters['dateRange']
                                }))
                              }
                              className={cn(
                                'rounded-full px-3 py-1 text-sm transition-all',
                                uniqueActiveFilters.dateRange === option.value
                                  ? 'border-primary bg-primary/20 text-primary'
                                  : 'border border-border text-muted-foreground hover:border-primary hover:bg-primary/10'
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 정렬 옵션 */}
                      <div>
                        <h3 className="mb-2 font-medium text-foreground">정렬</h3>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: 'newest', label: '최신순' },
                            { value: 'oldest', label: '오래된순' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() =>
                                setActiveFilters((prev) => ({
                                  ...prev,
                                  sortBy: option.value as SearchFilters['sortBy']
                                }))
                              }
                              className={cn(
                                'rounded-full px-3 py-1 text-sm transition-all',
                                uniqueActiveFilters.sortBy === option.value
                                  ? 'border-primary bg-primary/20 text-primary'
                                  : 'border border-border text-muted-foreground hover:border-primary hover:bg-primary/10'
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-2 font-medium text-foreground">
                          카테고리
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {availableFilters.categories.map(
                            (category, index) => (
                              <button
                                key={`category-filter-${category}-${index}`}
                                onClick={() => toggleCategoryFilter(category)}
                                className={cn(
                                  'rounded-full px-3 py-1 text-sm transition-all',
                                  uniqueActiveFilters.categories.includes(
                                    category
                                  )
                                    ? 'border-primary/50 bg-primary/20 text-primary'
                                    : 'border border-primary/30 text-muted-foreground hover:border-primary hover:bg-primary/10'
                                )}
                              >
                                {category}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-2 font-medium text-foreground">
                          태그
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {availableFilters.tags.map((tag, index) => (
                            <button
                              key={`tag-filter-${tag}-${index}`}
                              onClick={() => toggleTagFilter(tag)}
                              className={cn(
                                'rounded-full px-3 py-1 text-sm transition-all',
                                uniqueActiveFilters.tags.includes(tag)
                                  ? 'border-secondary/50 bg-secondary/20 text-secondary'
                                  : 'border border-primary/30 text-muted-foreground hover:border-secondary hover:bg-secondary/10'
                              )}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 검색 결과 */}
          <div className="mb-8">
            <SearchResults
              posts={filteredPosts}
              searchTerm={searchTerm}
              getCategoryColor={getCategoryColor}
              isFiltering={isFiltering}
              isMounted={isMounted}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSearchPage;
