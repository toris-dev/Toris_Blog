'use client';

import {
  AiFillGithub,
  AiOutlineMail,
  FaCalendarAlt,
  FaUserCircle,
  IoIosArrowDown
} from '@/components/icons';
import { Post } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FC, useEffect, useState } from 'react';

interface CategorySidebarProps {
  currentCategory?: string;
  posts?: Post[];
}

const CategorySidebar: FC<CategorySidebarProps> = ({
  currentCategory: propCurrentCategory,
  posts: propPosts
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [posts, setPosts] = useState<Post[]>(propPosts || []);
  const [loading, setLoading] = useState(!propPosts);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL에서 현재 카테고리 파악
  const currentCategory =
    propCurrentCategory || searchParams.get('category') || undefined;

  // posts prop이 없을 때 API에서 데이터 가져오기
  useEffect(() => {
    if (!propPosts) {
      const fetchPosts = async () => {
        try {
          setLoading(true);
          const response = await fetch('/api/posts');
          if (response.ok) {
            const data = await response.json();
            setPosts(data);
          } else {
            console.error('Failed to fetch posts');
          }
        } catch (error) {
          console.error('Error fetching posts:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchPosts();
    }
  }, [propPosts]);

  // propPosts가 변경될 때 상태 업데이트
  useEffect(() => {
    if (propPosts) {
      setPosts(propPosts);
      setLoading(false);
    }
  }, [propPosts]);

  // 카테고리별로 포스트 그룹화
  const categorizedPosts = posts.reduce(
    (acc, post) => {
      if (!acc[post.category]) {
        acc[post.category] = [];
      }
      acc[post.category].push(post);
      return acc;
    },
    {} as Record<string, Post[]>
  );

  const categories = Object.keys(categorizedPosts).sort();

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // 카테고리별 색상 매핑
  const getCategoryColor = (category: string) => {
    const colors = {
      Technology: 'text-blue-500 border-blue-500/20',
      Programming: 'text-green-500 border-green-500/20',
      Design: 'text-purple-500 border-purple-500/20',
      Life: 'text-orange-500 border-orange-500/20',
      Review: 'text-red-500 border-red-500/20',
      Tutorial: 'text-indigo-500 border-indigo-500/20'
    };
    return (
      colors[category as keyof typeof colors] ||
      'text-primary border-primary/20'
    );
  };

  if (loading) {
    return (
      <div className="w-full rounded-xl border border-border bg-card/50 shadow-lg backdrop-blur-lg">
        <div className="p-6">
          <div className="flex animate-pulse flex-col items-center space-y-4">
            <div className="size-20 rounded-full bg-background/50"></div>
            <div className="h-4 w-24 rounded bg-background/50"></div>
            <div className="h-3 w-32 rounded bg-background/50"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-full rounded bg-background/50"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-border bg-card/50 shadow-lg backdrop-blur-lg">
      {/* Profile Section */}
      <div className="border-b border-border p-6">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4 size-20 overflow-hidden rounded-full border-2 border-primary/20 bg-gradient-to-br from-primary/20 to-accent/20">
            <div className="flex size-full items-center justify-center">
              <FaUserCircle className="text-2xl text-primary/60" />
            </div>
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
              href="mailto:your-email@example.com"
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
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-background/80 ${
              !currentCategory
                ? 'bg-primary/10 text-primary'
                : 'text-foreground/80 hover:text-foreground'
            }`}
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
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium transition-all hover:bg-background/80 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/80 hover:text-foreground'
                  }`}
                >
                  <span className="flex items-center">
                    <span
                      className={`mr-2 size-2 rounded-full bg-current ${getCategoryColor(category).split(' ')[0]}`}
                    ></span>
                    {category}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {categoryPosts.length}
                    </span>
                    {isExpanded ? (
                      <div className="rotate-180 transform">
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
                            href={`/posts/${post.slug}`}
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
          <h4 className="mb-2 text-xs font-semibold text-foreground/80 uppercase tracking-wide">
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
