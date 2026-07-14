'use client';

import {
  FaBlog,
  FaFolder,
  FaSearch,
  FaTags,
  IoClose
} from '@/components/icons';
import { StudioSection, StudioStage } from '@/components/studio/StudioShell';
import { Post } from '@/types';
import { cn } from '@/utils/style';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import {
  saveSearchHistory,
  filterByDateRange,
  sortPosts,
  SearchFilters
} from '@/utils/search';
import { SearchHistory } from '@/components/search/SearchHistory';
import { HighlightText } from '@/components/search/HighlightText';
import { debounce } from '@/utils/debounce';
import { SkeletonPostList } from '@/components/ui/Skeleton';

// 인터페이스 정의
interface SearchResultProps {
  posts: Post[];
  searchTerm: string;
  getCategoryColor: (category: string) => string;
}

interface ClientSearchPageProps {
  initialPosts: Post[];
}

const ClientSearchPage = ({ initialPosts }: ClientSearchPageProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const reduceMotion = Boolean(useReducedMotion());

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

  // 카테고리는 TORIS 시스템/신호 역할 안에서만 구분한다.
  const getCategoryColor = useCallback((category: string) => {
    const systemCategories = ['Technology', 'Design', 'Tutorial'];
    return systemCategories.includes(category)
      ? 'border-[var(--toris-system)] bg-[var(--toris-canvas)] text-[var(--toris-system-text)]'
      : 'border-[var(--toris-signal)] bg-[var(--toris-canvas)] text-[var(--toris-signal-text)]';
  }, []);

  // 검색 결과 컴포넌트 - React.memo로 메모이제이션하여 불필요한 재렌더링 방지
  const SearchResults: React.FC<
    SearchResultProps & {
      isFiltering?: boolean;
      isMounted?: boolean;
      reduceMotion?: boolean;
    }
  > = memo(
    ({
      posts,
      searchTerm,
      getCategoryColor,
      isFiltering = false,
      isMounted = false,
      reduceMotion = false
    }) => {
      return (
        <div>
          {/* 검색 결과 개수 표시 */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              총{' '}
              <span className="font-semibold text-foreground">
                {posts.length}
              </span>
              개의 결과를 찾았습니다
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
                        data-testid={`blog-result-${post.id}`}
                        initial={false}
                        animate={
                          isMounted && !isFiltering
                            ? { opacity: 1, y: 0 }
                            : false
                        }
                        exit={
                          reduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, scale: 0.95 }
                        }
                        transition={{
                          duration: reduceMotion ? 0 : 0.15,
                          ease: 'easeOut'
                        }}
                        className="group overflow-hidden rounded-2xl border border-[var(--toris-border)] bg-[var(--toris-surface)] shadow-[var(--toris-shadow-sm)] transition-[border-color,transform] duration-200 focus-within:border-[var(--toris-system)] hover:-translate-y-0.5 hover:border-[var(--toris-system)]"
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
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center">
                                <FaBlog className="text-6xl text-muted-foreground/20" />
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/70 to-transparent p-4">
                              <span
                                className={`rounded-full ${getCategoryColor(post.category)} border px-3 py-1 text-xs font-semibold`}
                              >
                                {post.category}
                              </span>
                            </div>
                          </div>

                          <div className="p-5">
                            <h3 className="mb-2 line-clamp-2 text-lg font-bold text-foreground group-hover:text-primary">
                              {searchTerm ? (
                                <HighlightText
                                  text={post.title}
                                  searchTerm={searchTerm}
                                />
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
                                  {post.content
                                    .replace(/[#*`_]/g, '')
                                    .substring(0, 150)}
                                  ...
                                </>
                              )}
                            </p>

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <span className="whitespace-nowrap text-xs text-muted-foreground">
                                {new Date(post.date).toLocaleDateString(
                                  'ko-KR',
                                  {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  }
                                )}
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

      if (prevProps.reduceMotion !== nextProps.reduceMotion) {
        return false;
      }

      // getCategoryColor는 useCallback으로 메모이제이션되어 있으므로 참조 비교만 하면 됨
      // 모든 props가 동일하면 리렌더링 불필요
      return true;
    }
  );

  // SearchResults에 displayName 설정 (디버깅용)
  SearchResults.displayName = 'SearchResults';

  return (
    <StudioStage className="min-h-screen py-20 sm:py-24">
      <StudioSection className="max-w-6xl">
        {/* Main Content */}
        <div className="flex-1">
          <motion.div
            data-testid="blog-search-entry"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={
              isMounted
                ? reduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0 }
                : false
            }
            transition={{ duration: reduceMotion ? 0 : 0.5 }}
            className="mb-10 max-w-3xl"
            suppressHydrationWarning
          >
            <h2 className="break-keep text-3xl font-black tracking-[-0.04em] text-[var(--toris-ink)] sm:text-4xl">
              필요한 개발 판단을 찾아보세요.
            </h2>
            <p className="mt-4 break-keep text-[var(--toris-ink-muted)]">
              원하는 키워드로 블로그 포스트를 검색해보세요.
            </p>
          </motion.div>

          {/* 검색 인터페이스 */}
          <div className="mb-8 rounded-2xl border border-[var(--toris-border)] bg-[var(--toris-surface)] p-4 shadow-[var(--toris-shadow-sm)] sm:p-6">
            <div className="relative">
              <div className="group relative mb-6">
                <div className="relative flex items-center">
                  <div className="absolute left-4 z-10 flex items-center justify-center">
                    <FaSearch className="text-lg text-muted-foreground transition-colors group-focus-within:text-primary" />
                  </div>
                  <input
                    id="blog-search-input"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="검색어를 입력하세요..."
                    aria-label="블로그 검색어"
                    className="min-h-12 w-full rounded-xl border border-[var(--toris-control-border)] bg-[var(--toris-canvas)] px-12 py-3 text-[var(--toris-ink)] outline-none transition-colors placeholder:text-[var(--toris-ink-muted)] hover:border-[var(--toris-system)] focus-visible:border-[var(--toris-system)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--toris-focus)]"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 z-10 flex size-11 items-center justify-center rounded-full text-[var(--toris-ink-muted)] transition-colors hover:bg-[var(--toris-canvas)] hover:text-[var(--toris-system-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--toris-focus)]"
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
                      className="inline-flex min-h-11 items-center rounded-full border border-[var(--toris-signal)] bg-[var(--toris-canvas)] pl-3 text-sm text-[var(--toris-signal-text)]"
                      suppressHydrationWarning
                    >
                      <FaFolder className="mr-1" />
                      {category}
                      <button
                        type="button"
                        onClick={() => toggleCategoryFilter(category)}
                        className="ml-1 flex size-11 items-center justify-center rounded-full hover:bg-[var(--toris-surface-elevated)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--toris-focus)]"
                        aria-label={`${category} 카테고리 필터 제거`}
                      >
                        <IoClose size={14} />
                      </button>
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
                      className="inline-flex min-h-11 items-center rounded-full border border-[var(--toris-system)] bg-[var(--toris-canvas)] px-3 py-1 text-sm text-[var(--toris-system-text)]"
                      suppressHydrationWarning
                    >
                      <FaTags className="mr-1" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => toggleTagFilter(tag)}
                        className="ml-1 flex size-11 items-center justify-center rounded-full hover:bg-[var(--toris-surface-elevated)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--toris-focus)]"
                        aria-label={`${tag} 태그 필터 제거`}
                      >
                        <IoClose size={14} />
                      </button>
                    </motion.span>
                  ))}

                  {(uniqueActiveFilters.categories.length > 0 ||
                    uniqueActiveFilters.tags.length > 0) && (
                    <motion.button
                      type="button"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={
                        isMounted
                          ? { scale: 1, opacity: 1 }
                          : { scale: 1, opacity: 1 }
                      }
                      exit={{ scale: 0.8, opacity: 0 }}
                      onClick={clearFilters}
                      className="inline-flex min-h-11 items-center rounded-full border border-[var(--toris-control-border)] px-3 py-1 text-sm text-[var(--toris-ink)] hover:border-[var(--toris-system)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--toris-focus)]"
                      suppressHydrationWarning
                    >
                      모든 필터 지우기
                    </motion.button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  aria-expanded={showFilters}
                  aria-controls="blog-search-filters"
                  className="min-h-11 shrink-0 rounded-full border border-[var(--toris-control-border)] px-4 py-2 text-sm font-semibold text-[var(--toris-ink)] transition-colors hover:border-[var(--toris-system)] hover:text-[var(--toris-system-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--toris-focus)]"
                >
                  {showFilters ? '필터 숨기기' : '필터 보기'}
                </button>
              </div>

              {/* 확장 가능한 필터 섹션 */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    id="blog-search-filters"
                    data-testid="blog-filter-panel"
                    role="region"
                    aria-label="블로그 검색 필터"
                    initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                    animate={
                      reduceMotion
                        ? { opacity: 1 }
                        : showFilters
                          ? { height: 'auto', opacity: 1 }
                          : { height: 0, opacity: 0 }
                    }
                    exit={
                      reduceMotion ? { opacity: 1 } : { height: 0, opacity: 0 }
                    }
                    transition={{ duration: reduceMotion ? 0 : 0.3 }}
                    className="overflow-hidden rounded-xl border border-[var(--toris-border)] bg-[var(--toris-canvas)] p-4"
                    suppressHydrationWarning
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* 날짜 필터 */}
                      <div
                        role="group"
                        aria-labelledby="blog-date-filter-label"
                      >
                        <h3
                          id="blog-date-filter-label"
                          className="mb-2 font-medium text-foreground"
                        >
                          날짜 범위
                        </h3>
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
                              type="button"
                              aria-pressed={
                                uniqueActiveFilters.dateRange === option.value
                              }
                              key={option.value}
                              onClick={() =>
                                setActiveFilters((prev) => ({
                                  ...prev,
                                  dateRange:
                                    option.value as SearchFilters['dateRange']
                                }))
                              }
                              className={cn(
                                'min-h-11 rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--toris-focus)]',
                                uniqueActiveFilters.dateRange === option.value
                                  ? 'border-[var(--toris-system)] bg-[var(--toris-system)] text-[var(--toris-on-system)]'
                                  : 'border-[var(--toris-control-border)] text-[var(--toris-ink-muted)] hover:border-[var(--toris-system)]'
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 정렬 옵션 */}
                      <div
                        role="group"
                        aria-labelledby="blog-sort-filter-label"
                      >
                        <h3
                          id="blog-sort-filter-label"
                          className="mb-2 font-medium text-foreground"
                        >
                          정렬
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: 'newest', label: '최신순' },
                            { value: 'oldest', label: '오래된순' }
                          ].map((option) => (
                            <button
                              type="button"
                              aria-pressed={
                                uniqueActiveFilters.sortBy === option.value
                              }
                              key={option.value}
                              onClick={() =>
                                setActiveFilters((prev) => ({
                                  ...prev,
                                  sortBy:
                                    option.value as SearchFilters['sortBy']
                                }))
                              }
                              className={cn(
                                'min-h-11 rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--toris-focus)]',
                                uniqueActiveFilters.sortBy === option.value
                                  ? 'border-[var(--toris-system)] bg-[var(--toris-system)] text-[var(--toris-on-system)]'
                                  : 'border-[var(--toris-control-border)] text-[var(--toris-ink-muted)] hover:border-[var(--toris-system)]'
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div
                        role="group"
                        aria-labelledby="blog-category-filter-label"
                      >
                        <h3
                          id="blog-category-filter-label"
                          className="mb-2 font-medium text-foreground"
                        >
                          카테고리
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {availableFilters.categories.map(
                            (category, index) => (
                              <button
                                type="button"
                                aria-pressed={uniqueActiveFilters.categories.includes(
                                  category
                                )}
                                key={`category-filter-${category}-${index}`}
                                onClick={() => toggleCategoryFilter(category)}
                                className={cn(
                                  'min-h-11 rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--toris-focus)]',
                                  uniqueActiveFilters.categories.includes(
                                    category
                                  )
                                    ? 'border-[var(--toris-signal)] bg-[var(--toris-signal)] text-[var(--toris-on-signal)]'
                                    : 'border-[var(--toris-control-border)] text-[var(--toris-ink-muted)] hover:border-[var(--toris-signal)]'
                                )}
                              >
                                {category}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      <div role="group" aria-labelledby="blog-tag-filter-label">
                        <h3
                          id="blog-tag-filter-label"
                          className="mb-2 font-medium text-foreground"
                        >
                          태그
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {availableFilters.tags.map((tag, index) => (
                            <button
                              type="button"
                              aria-pressed={uniqueActiveFilters.tags.includes(
                                tag
                              )}
                              key={`tag-filter-${tag}-${index}`}
                              onClick={() => toggleTagFilter(tag)}
                              className={cn(
                                'min-h-11 rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--toris-focus)]',
                                uniqueActiveFilters.tags.includes(tag)
                                  ? 'border-[var(--toris-system)] bg-[var(--toris-system)] text-[var(--toris-on-system)]'
                                  : 'border-[var(--toris-control-border)] text-[var(--toris-ink-muted)] hover:border-[var(--toris-system)]'
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
              reduceMotion={reduceMotion}
            />
          </div>
        </div>
      </StudioSection>
    </StudioStage>
  );
};

export default ClientSearchPage;
