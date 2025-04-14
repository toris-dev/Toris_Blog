'use client';

import {
  AiOutlineSearch,
  BiFilterAlt,
  BsLightningCharge,
  FaEthereum
} from '@/components/icons';
import { getPosts } from '@/utils/fetch';
import { cn } from '@/utils/style';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type PostType = {
  title: string;
  date: string;
  slug: string;
  category?: string;
  tags?: string[];
  description?: string;
  image?: string;
};

export default function PostsList() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedPosts = await getPosts({});

        // Add placeholder data for demo
        const postsWithPlaceholders = fetchedPosts.map((post, index) => ({
          ...post,
          image: post.image || `/images/placeholder-${(index % 3) + 1}.jpg`,
          description:
            post.description ||
            '이 포스트에 대한 간략한 설명이 이곳에 표시됩니다. 마크다운 파일에 설명을 추가해보세요.'
        }));

        setPosts(postsWithPlaceholders);
        setFilteredPosts(postsWithPlaceholders);

        // Extract unique categories
        const uniqueCategories: string[] = [];
        postsWithPlaceholders.forEach((post) => {
          const category = post.category || 'Uncategorized';
          if (!uniqueCategories.includes(category)) {
            uniqueCategories.push(category);
          }
        });
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
          post.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (selectedCategory) {
      result = result.filter((post) => post.category === selectedCategory);
    }

    setFilteredPosts(result);
  }, [searchQuery, selectedCategory, posts]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <div className="text-center">
          <FaEthereum className="mx-auto size-16 animate-pulse text-primary" />
          <p className="mt-4 text-lg text-content dark:text-gray-200">
            포스트를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-16 dark:bg-gray-900">
      <h1 className="mb-8 text-4xl font-bold text-gray-900 dark:text-white">
        <span className="gradient-text">Blog</span> Posts
      </h1>

      {/* 검색 및 필터 영역 */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="포스트 검색..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full rounded-lg border border-gray-200 bg-white/90 py-2 pl-10 pr-4 text-gray-800 backdrop-blur-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
          />
          <AiOutlineSearch className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-500 dark:text-content-dark" />
        </div>
        <div className="relative sm:w-48">
          <button
            type="button"
            onClick={() => setShowFilter(!showFilter)}
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white/90 px-4 py-2 text-gray-800 backdrop-blur-sm hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
          >
            <div className="flex items-center">
              <BiFilterAlt className="mr-2 size-5" />
              필터
            </div>
            {selectedCategory && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {selectedCategory}
              </span>
            )}
          </button>

          {showFilter && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 mt-2 w-full origin-top rounded-lg border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-card/95"
            >
              <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                카테고리
              </h4>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={cn(
                      'block w-full rounded px-2 py-1 text-left text-sm transition-colors',
                      selectedCategory === category
                        ? 'bg-primary/20 text-primary'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="mt-3 w-full rounded bg-primary/10 py-1 text-xs text-primary hover:bg-primary/20"
                >
                  필터 초기화
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="mt-20 text-center">
          <div className="mx-auto mb-4 size-16 rounded-full bg-primary/10 p-4">
            <FaEthereum className="size-8 text-primary" />
          </div>
          <h3 className="mb-2 text-xl font-medium text-gray-800 dark:text-gray-200">
            검색 결과가 없습니다
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            다른 검색어나 카테고리로 다시 시도해보세요.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory(null);
            }}
            className="mt-4 rounded-lg bg-primary/10 px-4 py-2 text-primary hover:bg-primary/20"
          >
            필터 초기화
          </button>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredPosts.map((post) => (
            <motion.div key={post.slug} variants={item}>
              <Link
                href={`/posts/${post.slug}`}
                className="group flex h-full flex-col rounded-xl border border-white/10 bg-card/30 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <div className="relative mb-4 overflow-hidden rounded-lg">
                  <div className="aspect-video bg-gray-100 dark:bg-bkg-light/30">
                    {post.image ? (
                      <div className="relative h-40 w-full">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-primary/5">
                        <FaEthereum className="size-12 text-primary/30" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center">
                    <span className="mr-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {post.category || 'Web3'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(post.date).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-gray-800 transition-colors group-hover:text-primary dark:text-gray-100">
                    {post.title}
                  </h3>
                  <p className="line-clamp-2 text-gray-600 dark:text-gray-300">
                    {post.description}
                  </p>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center">
                    <BsLightningCharge className="mr-1 size-4 text-primary" />
                    계속 읽기
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
