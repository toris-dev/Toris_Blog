'use client';

import { Post } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { FaBlog, FaTimes } from '@/components/icons';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 포스트 데이터 가져오기
  useEffect(() => {
    if (isOpen) {
      const fetchPosts = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/posts');
          if (!response.ok) {
            throw new Error('Failed to fetch posts');
          }
          const fetchedPosts: Post[] = await response.json();
          setPosts(fetchedPosts);
          setFilteredPosts(fetchedPosts);
        } catch (error) {
          console.error('Error fetching posts:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchPosts();
    }
  }, [isOpen]);

  // 검색어로 필터링
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPosts(posts);
      return;
    }

    const lowerTerm = searchTerm.toLowerCase();
    const filtered = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(lowerTerm) ||
        post.content?.toLowerCase().includes(lowerTerm) ||
        post.description?.toLowerCase().includes(lowerTerm) ||
        post.category.toLowerCase().includes(lowerTerm) ||
        (typeof post.tags === 'string'
          ? post.tags.toLowerCase().includes(lowerTerm)
          : post.tags?.some((tag) => tag.toLowerCase().includes(lowerTerm)))
    );
    setFilteredPosts(filtered);
  }, [searchTerm, posts]);

  // 모달이 열릴 때 입력창에 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="shadow-large fixed inset-x-4 top-20 z-50 mx-auto max-h-[calc(100vh-8rem)] max-w-4xl overflow-hidden rounded-xl border border-border bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center border-b border-border bg-muted/30 p-4">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="포스트 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-10 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <FaBlog className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <FaTimes className="size-3" />
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="ml-4 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="검색 모달 닫기"
              >
                <FaTimes className="size-5" />
              </button>
            </div>

            {/* Content */}
            <div className="custom-scrollbar max-h-[calc(100vh-16rem)] overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? `"${searchTerm}"에 대한 검색 결과가 없습니다.`
                      : '검색어를 입력하세요.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {filteredPosts.length}개의 결과
                    {searchTerm && ` - "${searchTerm}"`}
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {filteredPosts.map((post) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link
                          href={`/posts/${encodeURIComponent(post.slug)}`}
                          onClick={onClose}
                          className="shadow-soft hover:shadow-medium group block overflow-hidden rounded-lg border border-border bg-card p-4 transition-all hover:bg-muted"
                        >
                          <div className="mb-3 flex items-center gap-2">
                            <span className="rounded-full bg-primary/20 px-2 py-1 text-xs font-medium text-primary">
                              {post.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.date).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                          <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                            {post.title}
                          </h3>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {post.description ||
                              post.content
                                ?.replace(/[#*`_]/g, '')
                                .substring(0, 100)}
                            ...
                          </p>
                          {post.tags && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {(Array.isArray(post.tags)
                                ? post.tags
                                : post.tags.split(',').map((t) => t.trim())
                              )
                                .slice(0, 3)
                                .map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="rounded bg-secondary/20 px-2 py-0.5 text-xs text-secondary"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                            </div>
                          )}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
