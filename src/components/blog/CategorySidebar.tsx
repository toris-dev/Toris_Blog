'use client';

import {
  AiFillGithub,
  AiOutlineMail,
  FaCalendarAlt,
  FaUserCircle,
  FaListAlt,
  IoIosArrowDown
} from '@/components/icons';
import { Post } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/style';

/** 카테고리별 색상 매핑 (컴포넌트 외부 상수로 매 렌더마다 객체 생성 방지) */
const CATEGORY_COLORS: Record<string, string> = {
  Technology: 'text-blue-500 border-blue-500/20',
  Programming: 'text-green-500 border-green-500/20',
  Design: 'text-purple-500 border-purple-500/20',
  Life: 'text-orange-500 border-orange-500/20',
  Review: 'text-red-500 border-red-500/20',
  Tutorial: 'text-indigo-500 border-indigo-500/20'
};

const DEFAULT_CATEGORY_COLOR = 'text-primary border-primary/20';

/** 로딩/마운트 전 공통 스켈레톤 UI */
function SidebarSkeleton() {
  return (
    <div className="shadow-medium w-full rounded-xl border border-border bg-card">
      <div className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
          <div className="w-full space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" aria-hidden />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CategorySidebarProps {
  currentCategory?: string;
  posts?: Post[];
}

const CategorySidebar: FC<CategorySidebarProps> = ({
  currentCategory: propCurrentCategory,
  posts: propPosts
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set()
  );
  const [localPosts, setLocalPosts] = useState<Post[]>([]);
  const [fetchLoading, setFetchLoading] = useState(!propPosts);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory =
    propCurrentCategory ?? searchParams.get('category') ?? undefined;

  const posts = propPosts ?? localPosts;
  const loading = !propPosts && fetchLoading;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (propPosts) return;
    let cancelled = false;
    const fetchPosts = async () => {
      try {
        setFetchLoading(true);
        const response = await fetch('/api/posts');
        if (!response.ok) {
          console.error('Failed to fetch posts');
          return;
        }
        const data = await response.json();
        if (!cancelled) setLocalPosts(data);
      } catch (error) {
        if (!cancelled) console.error('Error fetching posts:', error);
      } finally {
        if (!cancelled) setFetchLoading(false);
      }
    };
    fetchPosts();
    return () => {
      cancelled = true;
    };
  }, [propPosts]);

  const categorizedPosts = useMemo(
    () =>
      posts.reduce<Record<string, Post[]>>((acc, post) => {
        if (!acc[post.category]) acc[post.category] = [];
        acc[post.category].push(post);
        return acc;
      }, {}),
    [posts]
  );

  const categories = useMemo(
    () => Object.keys(categorizedPosts).sort(),
    [categorizedPosts]
  );

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const getCategoryColor = useCallback((category: string) => {
    return CATEGORY_COLORS[category] ?? DEFAULT_CATEGORY_COLOR;
  }, []);

  if (!mounted || loading) {
    return <SidebarSkeleton />;
  }

  return (
    <div className="shadow-medium w-full rounded-xl border border-border bg-card">
      {/* Profile Section */}
      <div className="border-b border-border p-6">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="shadow-soft relative mb-4 size-20 overflow-hidden rounded-full border-2 border-border bg-primary/10">
            <Image
              src="/images/logo.png"
              alt="토리스 로고"
              width={80}
              height={80}
              className="size-full object-cover"
              priority
            />
          </div>

          {/* Name and Title */}
          <h3 className="mb-1 text-xl font-bold text-foreground">토리스</h3>
          <p className="mb-2 text-sm text-muted-foreground">
            Full Stack Developer
          </p>

          {/* Bio */}
          <p className="mb-4 text-xs leading-relaxed text-muted-foreground/80">
            웹 개발과 새로운 기술에 관심이 많은 개발자입니다. React, Next.js,
            Node.js를 주로 사용하며 사용자 경험을 중시하는 개발을 추구합니다.
          </p>

          {/* Social Links */}
          <div className="flex space-x-3">
            <Link
              href="/about"
              className="flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground/80 transition-all hover:scale-110 hover:bg-primary/10 hover:text-primary"
              aria-label="About Me"
            >
              <FaUserCircle className="size-4" />
            </Link>
            <a
              href="mailto:ironjustlikethat@gmail.com"
              className="flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground/80 transition-all hover:scale-110 hover:bg-primary/10 hover:text-primary"
              aria-label="Email"
            >
              <AiOutlineMail className="size-4" />
            </a>
            <a
              href="https://github.com/toris-dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground/80 transition-all hover:scale-110 hover:bg-primary/10 hover:text-primary"
              aria-label="GitHub"
            >
              <AiFillGithub className="size-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-border px-6 pb-4 my-4">
        <Link
          href="/todos"
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
            pathname === '/todos'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <FaListAlt className="size-4" />
          <span>Toris 할일 관리</span>
        </Link>
      </div>

      {/* Navigation Section */}
      <div className="p-6">
        <h3 className="mb-4 flex items-center text-lg font-bold text-foreground">
          <span className="mr-2">📚</span>
          Categories
        </h3>

        {/* All Posts Link */}
        <div className="mb-3">
        <Link
          href="/posts"
          className={cn(
            'block rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-background/80',
            !currentCategory
              ? 'bg-primary/10 text-primary'
              : 'text-foreground/80 hover:text-foreground'
          )}
        >
            <span className="flex items-center justify-between">
              <span>All Posts</span>
              <span className="text-xs text-muted-foreground">
                {posts.length}
              </span>
            </span>
          </Link>
        </div>

        {/* Category Dropdowns */}
        <div className="space-y-2">
          {categories.map((category) => {
            const categoryPosts = categorizedPosts[category];
            const isExpanded = expandedCategories.has(category);
            const isActive = currentCategory === category;

            return (
              <div
                key={category}
                className="overflow-hidden rounded-lg border border-white/5"
              >
                <button
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium transition-all hover:bg-background/80',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/80 hover:text-foreground'
                  )}
                >
                  <span className="flex items-center">
                    <span
                      className={cn(
                        'mr-2 size-2 rounded-full bg-current',
                        getCategoryColor(category).split(' ')[0]
                      )}
                    />
                    {category}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {categoryPosts.length}
                    </span>
                    {isExpanded ? (
                      <div className="rotate-180">
                        <IoIosArrowDown className="size-3" />
                      </div>
                    ) : (
                      <IoIosArrowDown className="size-3" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-background/20"
                    >
                      <div className="space-y-1 p-2">
                        {categoryPosts.slice(0, 5).map((post) => (
                          <Link
                            key={post.id}
                            href={`/posts/${encodeURIComponent(post.slug)}`}
                            className="block rounded px-3 py-2 text-xs text-muted-foreground transition-all hover:bg-background/60 hover:text-foreground"
                          >
                            <div className="line-clamp-2 font-medium">
                              {post.title}
                            </div>
                            <div className="mt-1 flex items-center text-xs text-muted-foreground/60">
                              <FaCalendarAlt className="mr-1 size-2" />
                              {new Date(post.date).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </Link>
                        ))}
                        {categoryPosts.length > 5 && (
                          <Link
                            href={`/posts?category=${category}`}
                            className="block rounded px-3 py-2 text-xs text-primary/80 transition-all hover:bg-primary/10 hover:text-primary"
                          >
                            + {categoryPosts.length - 5}개 더 보기
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 rounded-lg bg-background/30 p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/80">
            Blog Stats
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="text-center">
              <div className="font-bold text-primary">{posts.length}</div>
              <div className="text-muted-foreground">Posts</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-accent">{categories.length}</div>
              <div className="text-muted-foreground">Categories</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorySidebar;
