'use client';

import { AiOutlineSearch } from '@/components/icons';
import { Post } from '@/types';
import { getPosts } from '@/utils/fetch';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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

  // Filter posts based on search query and selected category
  useEffect(() => {
    let result = posts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.description?.toLowerCase().includes(query) ||
          (Array.isArray(post.tags)
            ? post.tags.some((tag) => tag.toLowerCase().includes(query))
            : post.tags?.toLowerCase().includes(query))
      );
    }

    if (selectedCategory) {
      result = result.filter((post) => post.category === selectedCategory);
    }

    setFilteredPosts(result);
  }, [searchQuery, selectedCategory, posts]);

  if (loading) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-lg text-foreground/70">
            포스트를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <h1 className="mb-8 text-4xl font-bold">
        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Blog
        </span>{' '}
        Posts
      </h1>

      {/* Search and Filter */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="포스트 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 pl-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <AiOutlineSearch className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        </div>

        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">모든 카테고리</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

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
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="group rounded-lg border border-border bg-card p-6 transition-colors hover:bg-accent"
          >
            <div className="mb-4 flex items-center">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                {post.category || 'Blog'}
              </span>
            </div>
            <h3 className="mb-2 text-xl font-semibold group-hover:text-primary">
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
                      <span
                        key={tag}
                        className="rounded bg-accent px-2 py-1 text-xs text-foreground/70"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* No results */}
      {filteredPosts.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-lg text-foreground/70">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
