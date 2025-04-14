'use client';

import {
  FaBlog,
  FaCalendarAlt,
  FaFolder,
  FaSearch,
  FaTags,
  IoClose
} from '@/components/icons';
import Button from '@/components/ui/Button';
import { Post } from '@/types';
import { cn } from '@/utils/style';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

// Debounce helper function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 인터페이스 정의
interface SearchResultProps {
  posts: Post[];
  searchTerm: string;
  setSelectedPost: (post: Post | null) => void;
}

interface ClientSearchPageProps {
  initialPosts: Post[];
}

// 스켈레톤 카드 컴포넌트
const SkeletonCard = () => {
  return (
    <div className="overflow-hidden rounded-xl bg-card/30 shadow-sm">
      <div className="relative h-48 w-full animate-pulse bg-bkg-light/50"></div>
      <div className="p-5">
        <div className="mb-2 h-6 w-3/4 animate-pulse rounded-md bg-bkg-light/50"></div>
        <div className="mb-4 space-y-2">
          <div className="h-4 w-full animate-pulse rounded-md bg-bkg-light/50"></div>
          <div className="h-4 w-full animate-pulse rounded-md bg-bkg-light/50"></div>
          <div className="h-4 w-2/3 animate-pulse rounded-md bg-bkg-light/50"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-3 w-1/4 animate-pulse rounded-md bg-bkg-light/50"></div>
          <div className="flex space-x-1">
            <div className="h-4 w-10 animate-pulse rounded-full bg-bkg-light/50"></div>
            <div className="h-4 w-10 animate-pulse rounded-full bg-bkg-light/50"></div>
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
        <div className="h-7 w-1/4 animate-pulse rounded-md bg-bkg-light/50"></div>
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
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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
  }, [initialPosts]);

  // 검색 및 필터링 로직
  const filterPosts = useCallback(
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
    ),
    [posts]
  );

  useEffect(() => {
    filterPosts(searchTerm, activeFilters);
  }, [searchTerm, activeFilters, filterPosts]);

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

  return (
    <div className="min-h-screen bg-bkg px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            <span className="relative">
              블로그 검색
              <span className="absolute -bottom-1 left-0 h-1 w-full bg-gradient-to-r from-primary to-accent-1"></span>
            </span>
          </h1>
          <p className="mt-4 text-content-dark">
            원하는 키워드로 블로그 포스트를 검색해보세요.
          </p>
        </motion.div>

        {/* 검색 인터페이스 */}
        <div className="mb-8 rounded-2xl bg-card/30 p-6 backdrop-blur-lg">
          <div className="relative">
            <div className="relative mb-6 overflow-hidden rounded-lg border border-white/10">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="검색어를 입력하세요..."
                className="w-full bg-bkg/50 px-12 py-4 text-content outline-none backdrop-blur-md transition-all placeholder:text-content-dark/50 focus:bg-bkg/80 dark:placeholder:text-content-dark/40"
              />
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-content-dark" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-content-dark hover:text-primary"
                >
                  <IoClose size={20} />
                </button>
              )}
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
                    className="inline-flex items-center rounded-full bg-accent-1/10 px-3 py-1 text-sm text-accent-1"
                  >
                    <FaTags className="mr-1" />
                    {tag}
                    <button
                      onClick={() => toggleTagFilter(tag)}
                      className="ml-1 rounded-full p-0.5 hover:bg-accent-1/20"
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
                    className="inline-flex items-center rounded-full bg-content/10 px-3 py-1 text-sm text-content hover:bg-content/20"
                  >
                    모든 필터 지우기
                  </motion.button>
                )}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="rounded-lg bg-bkg px-4 py-2 text-sm font-medium text-content hover:bg-bkg-light dark:hover:bg-card/50"
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
                  className="overflow-hidden rounded-lg bg-bkg/50 p-4 shadow-lg dark:bg-card/30"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="mb-2 font-medium text-content">
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
                                ? 'bg-primary/20 text-primary'
                                : 'bg-bkg-light text-content-dark hover:bg-bkg-light/80 dark:bg-card/50 dark:hover:bg-card/70'
                            )}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-2 font-medium text-content">태그</h3>
                      <div className="flex flex-wrap gap-2">
                        {availableFilters.tags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => toggleTagFilter(tag)}
                            className={cn(
                              'rounded-full px-3 py-1 text-sm transition-all',
                              activeFilters.tags.includes(tag)
                                ? 'bg-accent-1/20 text-accent-1'
                                : 'bg-bkg-light text-content-dark hover:bg-bkg-light/80 dark:bg-card/50 dark:hover:bg-card/70'
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
              setSelectedPost={setSelectedPost}
            />
          )}
        </div>
      </div>

      {/* 포스트 미리보기 모달 */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-h-[80vh] w-full max-w-2xl overflow-auto rounded-2xl bg-card shadow-xl dark:border dark:border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute right-4 top-4 rounded-full bg-bkg/30 p-2 text-content hover:bg-bkg/50 hover:text-primary"
              >
                <IoClose size={20} />
              </button>

              {selectedPost.preview_image_url && (
                <div className="relative h-60 w-full overflow-hidden">
                  <Image
                    src={selectedPost.preview_image_url}
                    alt={selectedPost.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="p-6">
                <h2 className="mb-4 text-2xl font-bold text-content">
                  {selectedPost.title}
                </h2>

                <div className="mb-4 flex flex-wrap gap-3">
                  <span className="inline-flex items-center text-sm text-content-dark">
                    <FaCalendarAlt className="mr-1" />
                    {new Date(selectedPost.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>

                  <span className="inline-flex items-center text-sm text-content-dark">
                    <FaFolder className="mr-1" />
                    {selectedPost.category}
                  </span>
                </div>

                <div className="mb-6">
                  <div className="line-clamp-6 text-content-dark">
                    {selectedPost.content
                      .replace(/[#*`_]/g, '')
                      .substring(0, 300)}
                    ...
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(typeof selectedPost.tags === 'string'
                    ? selectedPost.tags.split(',').map((tag) => tag.trim())
                    : selectedPost.tags
                  ).map((tag, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-bkg px-3 py-1 text-xs text-content-dark"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <Link
                    href={`/posts/${selectedPost.slug}`}
                    className="inline-flex items-center rounded-lg bg-gradient-to-r from-primary to-accent-1 px-6 py-2 font-medium text-white hover:shadow-lg hover:shadow-primary/20"
                  >
                    <FaBlog className="mr-2" />
                    전체 포스트 보기
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 검색 결과 컴포넌트
const SearchResults: React.FC<SearchResultProps> = ({
  posts,
  searchTerm,
  setSelectedPost
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
        <FaSearch className="mb-4 text-6xl text-content-dark/30" />
        <h3 className="mb-2 text-xl font-medium text-content">
          검색 결과가 없습니다
        </h3>
        <p className="text-content-dark">
          다른 검색어를 시도하거나 필터를 조정해보세요.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-medium text-content">
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
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              whileHover={{ y: -5 }}
              className="group cursor-pointer overflow-hidden rounded-xl bg-card/30 shadow-sm transition-all hover:bg-card/50 hover:shadow-md dark:border dark:border-white/5"
              onClick={() => setSelectedPost(post)}
            >
              <div className="relative h-48 w-full overflow-hidden bg-gradient-to-r from-primary/20 to-accent-1/20">
                {post.preview_image_url ? (
                  <Image
                    src={post.preview_image_url}
                    alt={post.title}
                    fill
                    className="object-cover transition-all group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <FaBlog className="text-6xl text-white/20" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <span className="rounded-full bg-primary/80 px-3 py-1 text-xs text-white">
                    {post.category}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <h3 className="mb-2 line-clamp-2 text-lg font-bold text-content group-hover:text-primary">
                  {searchTerm
                    ? highlightText(post.title, searchTerm)
                    : post.title}
                </h3>

                <p className="mb-4 line-clamp-3 text-sm text-content-dark">
                  {searchTerm
                    ? highlightText(
                        post.content.replace(/[#*`_]/g, '').substring(0, 150),
                        searchTerm
                      )
                    : post.content.replace(/[#*`_]/g, '').substring(0, 150)}
                  ...
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-content-dark">
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
                        className="rounded-full bg-bkg px-2 py-0.5 text-xs text-content-dark"
                      >
                        #{tag}
                      </span>
                    ))}
                    {(typeof post.tags === 'string'
                      ? post.tags.split(',').length
                      : post.tags.length) > 2 && (
                      <span className="rounded-full bg-bkg px-2 py-0.5 text-xs text-content-dark">
                        +
                        {typeof post.tags === 'string'
                          ? post.tags.split(',').length - 2
                          : post.tags.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ClientSearchPage;
