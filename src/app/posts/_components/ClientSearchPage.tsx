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
import { useEffect, useRef, useState } from 'react';

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
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
  const [posts] = useState<Post[]>(initialPosts);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    categories: string[];
    tags: string[];
  }>({
    categories: [],
    tags: []
  });
  const [availableFilters, setAvailableFilters] = useState<{
    categories: string[];
    tags: string[];
  }>({
    categories: [],
    tags: []
  });

  const [showFilters, setShowFilters] = useState(false);
  const searchParams = useSearchParams();
  const currentCategoryFromUrl = searchParams.get('category');

  // 초기 필터 설정
  useEffect(() => {
    // 사용 가능한 카테고리와 태그 추출
    const categories = Array.from(
      new Set(initialPosts.map((post) => post.category))
    );
    const tags = Array.from(
      new Set(
        initialPosts.flatMap((post) =>
          typeof post.tags === 'string'
            ? post.tags.split(',').map((tag) => tag.trim())
            : post.tags
        )
      )
    );

    setAvailableFilters({
      categories: categories as string[],
      tags: tags as string[]
    });

    // URL에서 카테고리 필터 적용
    if (currentCategoryFromUrl) {
      setActiveFilters((prev) => ({
        ...prev,
        categories: [currentCategoryFromUrl]
      }));
    }
  }, [initialPosts, currentCategoryFromUrl]);

  // 검색 및 필터링 로직
  const debouncedFilterRef = useRef(
    debounce(
      (term: string, filters: { categories: string[]; tags: string[] }) => {
        if (!posts.length) return;

        let results = [...posts];

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

        setFilteredPosts(results);
      },
      300
    )
  );

  useEffect(() => {
    debouncedFilterRef.current(searchTerm, activeFilters);
  }, [searchTerm, activeFilters, debouncedFilterRef]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    const debouncedFilter = debouncedFilterRef.current;
    return () => {
      debouncedFilter.cancel();
    };
  }, []);

  // 필터 토글 함수
  const toggleCategoryFilter = (category: string) => {
    setActiveFilters((prev) => {
      const isActive = prev.categories.includes(category);

      return {
        ...prev,
        categories: isActive
          ? prev.categories.filter((c) => c !== category)
          : [...prev.categories, category]
      };
    });
  };

  const toggleTagFilter = (tag: string) => {
    setActiveFilters((prev) => {
      const isActive = prev.tags.includes(tag);

      return {
        ...prev,
        tags: isActive
          ? prev.tags.filter((t) => t !== tag)
          : [...prev.tags, tag]
      };
    });
  };

  const clearFilters = () => {
    setActiveFilters({ categories: [], tags: [] });
    setSearchTerm('');
  };

  // 카테고리별 색상 매핑
  const getCategoryColor = (category: string) => {
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
  };

  // 검색 결과 컴포넌트
  const SearchResults: React.FC<SearchResultProps> = ({
    posts,
    searchTerm,
    getCategoryColor
  }) => {
    const highlightText = (text: string, highlight: string) => {
      if (!highlight.trim()) return text;

      const regex = new RegExp(`(${highlight})`, 'gi');
      return text.split(regex).map((part, index) =>
        regex.test(part) ? (
          <span key={index} className="bg-primary/20 text-primary">
            {part}
          </span>
        ) : (
          part
        )
      );
    };

    if (!posts.length) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <FaSearch className="mb-4 text-6xl text-muted-foreground/30" />
          <h3 className="mb-2 text-xl font-medium text-foreground">
            검색 결과가 없습니다
          </h3>
          <p className="text-muted-foreground">
            다른 검색어를 시도하거나 필터를 조정해보세요.
          </p>
        </motion.div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-medium text-foreground">
            {posts.length}개의 검색 결과
            {searchTerm && ` - "${searchTerm}"`}
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.05 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {posts.map((post, index) => (
              <motion.div
                key={`${post.id}-${index}-${post.slug}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="group overflow-hidden rounded-xl border border-primary/30 shadow-sm transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
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
                      {searchTerm
                        ? highlightText(post.title, searchTerm)
                        : post.title}
                    </h3>

                    <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                      {searchTerm
                        ? highlightText(
                            post.content
                              .replace(/[#*`_]/g, '')
                              .substring(0, 150),
                            searchTerm
                          )
                        : post.content.replace(/[#*`_]/g, '').substring(0, 150)}
                      ...
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>

                      <div className="flex space-x-1">
                        {(typeof post.tags === 'string'
                          ? post.tags
                              .split(',')
                              .map((tag) => tag.trim())
                              .slice(0, 2)
                          : post.tags.slice(0, 2)
                        ).map((tag, index) => (
                          <span
                            key={index}
                            className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                        {(typeof post.tags === 'string'
                          ? post.tags.split(',').length
                          : post.tags.length) > 2 && (
                          <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
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
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Main Content */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
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
                  {activeFilters.categories.map((category) => (
                    <motion.span
                      key={`cat-${category}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
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

                  {activeFilters.tags.map((tag) => (
                    <motion.span
                      key={`tag-${tag}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm text-accent"
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

                  {(activeFilters.categories.length > 0 ||
                    activeFilters.tags.length > 0) && (
                    <motion.button
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      onClick={clearFilters}
                      className="inline-flex items-center rounded-full bg-foreground/10 px-3 py-1 text-sm text-foreground hover:bg-foreground/20"
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
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="shadow-soft overflow-hidden rounded-lg border border-border bg-card p-4"
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="mb-2 font-medium text-foreground">
                          카테고리
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {availableFilters.categories.map((category) => (
                            <button
                              key={category}
                              onClick={() => toggleCategoryFilter(category)}
                              className={cn(
                                'rounded-full px-3 py-1 text-sm transition-all',
                                activeFilters.categories.includes(category)
                                  ? 'border-primary/50 bg-primary/20 text-primary'
                                  : 'border border-primary/30 text-muted-foreground hover:border-primary hover:bg-primary/10'
                              )}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-2 font-medium text-foreground">
                          태그
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {availableFilters.tags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => toggleTagFilter(tag)}
                              className={cn(
                                'rounded-full px-3 py-1 text-sm transition-all',
                                activeFilters.tags.includes(tag)
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
            {loading ? (
              <SearchSkeleton />
            ) : (
              <SearchResults
                posts={filteredPosts}
                searchTerm={searchTerm}
                getCategoryColor={getCategoryColor}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSearchPage;
