'use client';

import {
  BsPencilSquare,
  FaChevronRight,
  FaEdit,
  FaEye,
  FaListAlt,
  FaSignOutAlt,
  FaTrash,
  FaUserCircle
} from '@/components/icons';
import { MarkdownFile } from '@/types';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useState } from 'react';
import Button from '../ui/Button';

type AdminDashboardProps = {
  username: string;
};

interface Post {
  title: string;
  slug: string;
  date: string;
}

const AdminDashboard: FC<AdminDashboardProps> = ({ username }) => {
  const router = useRouter();
  const [stats, setStats] = useState({
    posts: 0,
    categories: 0
  });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 마크다운 파일 목록 가져오기
        const postsResponse = await fetch('/api/markdown');
        const posts = (await postsResponse.json()) as MarkdownFile[];

        // 카테고리 목록 가져오기
        const categoriesResponse = await fetch('/api/categories');
        const categories = (await categoriesResponse.json()) as string[];

        // 최근 글 목록 (최신 5개)
        const sortedPosts = [...posts].sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        const recentPostsList = sortedPosts.slice(0, 5).map((post) => ({
          title: post.title,
          slug: post.slug,
          date: new Date(post.date).toISOString().split('T')[0]
        }));

        setStats({
          posts: posts.length,
          categories: categories.length
        });

        setRecentPosts(recentPostsList);

        // GitHub 방문자 수 가져오기 (CORS 우회를 위한 프록시 서버 필요)
        try {
          const fetchGitHubViews = async () => {
            // 간접적인 방법으로 카운터 이미지를 분석할 수는 없으므로
            // 임의의 방문자 수 적용 (실제로는 백엔드에서 제공해야 함)
            const randomViewsCount = Math.floor(1000 + Math.random() * 2000);
            setStats((prev) => ({
              ...prev,
              views: randomViewsCount
            }));
          };

          fetchGitHubViews();
        } catch (error) {
          console.error('GitHub 방문자 수 가져오기 오류:', error);
        }
      } catch (error) {
        console.error('통계 데이터 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSignout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST'
      });
      router.push('/signin');
      router.refresh();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const handleEdit = (slug: string) => {
    router.push(`/edit/${slug}`);
  };

  const confirmDelete = (slug: string) => {
    setDeleteSlug(slug);
  };

  const cancelDelete = () => {
    setDeleteSlug(null);
  };

  const handleDelete = async (slug: string) => {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/markdown/${slug}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // 성공적으로 삭제된 경우 목록에서 제거
        setRecentPosts(recentPosts.filter((post) => post.slug !== slug));
        setStats((prev) => ({
          ...prev,
          posts: prev.posts - 1
        }));
        setDeleteSlug(null);
      } else {
        console.error('게시글 삭제 실패');
        alert('게시글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('게시글 삭제 오류:', error);
      alert('게시글 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div
      className="flex flex-col gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {deleteSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
              게시글 삭제 확인
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              &apos;{recentPosts.find((p) => p.slug === deleteSlug)?.title}
              &apos; 게시글을 정말 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                onClick={cancelDelete}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                취소
              </Button>
              <Button
                type="button"
                onClick={() => handleDelete(deleteSlug)}
                className="bg-red-500 text-white hover:bg-red-600"
                disabled={isDeleting}
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <motion.div
        className="flex flex-col justify-between gap-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent-1/10 p-6 shadow-sm dark:from-primary/5 dark:to-accent-1/5 sm:flex-row sm:items-center"
        variants={itemVariants}
      >
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/20 text-primary">
            <FaUserCircle className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              환영합니다, {username}!
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              오늘도 좋은 글을 작성해보세요.
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={handleSignout}
          className="flex items-center justify-center gap-2"
        >
          <FaSignOutAlt className="size-4" />
          <span>로그아웃</span>
        </Button>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        variants={itemVariants}
      >
        <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <BsPencilSquare className="size-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">총 글</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
              {loading ? (
                <div className="h-7 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              ) : (
                stats.posts
              )}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="flex size-10 items-center justify-center rounded-full bg-green-500/10 text-green-500">
            <FaEye className="size-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              총 조회수
            </p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
              {loading ? (
                <div className="h-7 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              ) : (
                <div className="mt-1 text-xs font-normal text-gray-400">
                  <a
                    href="https://github.com/toris-dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <Image
                      src="https://komarev.com/ghpvc/?username=toris-dev&color=red"
                      alt="GitHub Profile Views"
                      width={100}
                      height={20}
                      className="opacity-70"
                    />
                  </a>
                </div>
              )}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="flex size-10 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
            <FaListAlt className="size-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">카테고리</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
              {loading ? (
                <div className="h-7 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              ) : (
                stats.categories
              )}
            </h3>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800"
        variants={itemVariants}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            최근 글
          </h2>
          <Link
            href="/posts"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <span>모든 글 보기</span>
            <FaChevronRight className="size-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex animate-pulse items-center justify-between rounded-lg bg-gray-100 p-3 dark:bg-gray-700"
              >
                <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-600"></div>
                <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-600"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {recentPosts.length > 0 ? (
              recentPosts.map((post, index) => (
                <motion.div
                  key={post.slug}
                  className="group flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  whileHover={{ scale: 1.01 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: 0.1 + index * 0.05,
                      duration: 0.3
                    }
                  }}
                >
                  <div
                    className="flex items-center gap-3"
                    onClick={() => router.push(`/posts/${post.slug}`)}
                  >
                    <div className="size-2 rounded-full bg-primary"></div>
                    <h3 className="font-medium text-gray-800 group-hover:text-primary dark:text-gray-200">
                      {post.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {post.date}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(post.slug);
                      }}
                      className="rounded p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                      aria-label="게시글 수정"
                    >
                      <FaEdit className="size-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(post.slug);
                      }}
                      className="rounded p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
                      aria-label="게시글 삭제"
                    >
                      <FaTrash className="size-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">
                작성된 글이 없습니다.
              </p>
            )}
          </div>
        )}
      </motion.div>

      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        variants={itemVariants}
      >
        <Button
          type="button"
          onClick={() => router.push('/write')}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent-1 py-3 text-white hover:opacity-90"
        >
          <BsPencilSquare className="size-5" />
          <span>새 글 작성하기</span>
        </Button>

        <Button
          type="button"
          onClick={() => router.push('/markdown')}
          className="flex items-center justify-center gap-2 border border-gray-300 bg-white py-3 text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
        >
          <FaListAlt className="size-5" />
          <span>글 목록 관리하기</span>
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
