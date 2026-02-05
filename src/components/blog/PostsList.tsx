'use client';

import { AiOutlineSearch } from '@/components/icons';
import { Post } from '@/types';
import { getPosts } from '@/utils/fetch';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { debounce } from '@/utils/debounce';

export default function PostsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedPosts = await getPosts({});
        setPosts(fetchedPosts);
        setFilteredPosts(fetchedPosts);

        // Extract unique categories
        const uniqueCategories = [
          ...new Set(
            fetchedPosts.map((post) => post.category || 'Uncategorized')
          )
        ];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const debouncedFilterRef = useRef(
    debounce(
      (
        query: string,
        category: string | null,
        list: Post[],
        setFiltered: (posts: Post[]) => void
      ) => {
        let result = list;
        if (query) {
          const q = query.toLowerCase();
          result = result.filter(
            (post) =>
              post.title.toLowerCase().includes(q) ||
              post.description?.toLowerCase().includes(q) ||
              (Array.isArray(post.tags)
                ? post.tags.some((tag) => tag.toLowerCase().includes(q))
                : post.tags?.toLowerCase().includes(q))
          );
        }
        if (category) {
          result = result.filter((post) => post.category === category);
        }
        setFiltered(result);
      },
      250
    )
  );

  useEffect(() => {
    debouncedFilterRef.current(
      searchQuery,
      selectedCategory,
      posts,
      setFilteredPosts
    );
    return () => debouncedFilterRef.current.cancel();
  }, [searchQuery, selectedCategory, posts]);

  if (loading) {
    return (
      <div className="container space-y-6 px-4 py-16 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-48" />
        <div className="flex flex-col gap-4 sm:flex-row">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-4 rounded-lg border border-border p-6">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <h1 className="mb-8 text-4xl font-bold">
        <span className="text-primary">Blog</span> Posts
      </h1>

      {/* Search and Filter */}
      <motion.div
        className="mb-10 flex flex-col gap-4 sm:flex-row"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="relative flex-1"
          whileFocus={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <input
            type="text"
            placeholder="포스트 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 pl-10 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <AiOutlineSearch className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        </motion.div>

        <motion.select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="rounded-lg border border-border bg-background px-4 py-2 text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          whileFocus={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <option value="">모든 카테고리</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </motion.select>
      </motion.div>

      {/* Results info */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredPosts.length}개의 포스트
        </p>
        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-sm text-primary hover:text-primary/80"
          >
            필터 초기화
          </button>
        )}
      </div>

      {/* Posts Grid */}
      <motion.div
        className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        <AnimatePresence mode="popLayout">
          {filteredPosts.map((post, index) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{
                duration: 0.4,
                delay: index * 0.05,
                ease: 'easeOut'
              }}
              whileHover={{
                y: -8,
                rotateX: 5,
                rotateY: 5,
                transition: { duration: 0.3 }
              }}
              style={{ perspective: 1000 }}
            >
              <Link
                href={`/posts/${encodeURIComponent(post.slug)}`}
                className="shadow-soft hover:shadow-medium group block rounded-lg border border-border bg-card p-6 transition-all hover:bg-muted"
              >
                <div className="mb-4 flex items-center">
                  <motion.span
                    className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                    whileHover={{ scale: 1.1 }}
                  >
                    {post.category || 'Blog'}
                  </motion.span>
                </div>
                <h3 className="mb-2 text-xl font-semibold transition-all group-hover:text-primary group-hover:drop-shadow-[0_0_8px_hsl(var(--primary))]">
                  {post.title}
                </h3>
                <p className="mb-4 line-clamp-3 text-foreground/70">
                  {post.description || post.content?.substring(0, 100) + '...'}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {new Date(post.date).toLocaleDateString('ko-KR')}
                  </div>
                  {post.tags && (
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(post.tags) ? post.tags : [post.tags])
                        .slice(0, 2)
                        .map((tag) => (
                          <motion.span
                            key={tag}
                            className="rounded bg-accent px-2 py-1 text-xs text-foreground/70"
                            whileHover={{ scale: 1.1 }}
                          >
                            {tag}
                          </motion.span>
                        ))}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* No results */}
      <AnimatePresence>
        {filteredPosts.length === 0 && (
          <motion.div
            className="py-16 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-lg text-foreground/70">검색 결과가 없습니다.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
