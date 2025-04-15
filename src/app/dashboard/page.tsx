'use client';

import AdminDashboard from '@/components/admin/AdminDashboard';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { isAuthenticated, loading, session } = useAuth();
  const username = session?.user?.name || '관리자';

  // 페이지 진입 애니메이션
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  if (loading) {
    return (
      <div className="container flex flex-col items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-4xl flex-col items-center">
          {/* 스켈레톤 로딩 효과 */}
          <div className="mb-8 h-10 w-64 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"></div>
          <div className="mb-6 w-full rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
            <div className="flex animate-pulse flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div>
                  <div className="mb-2 h-6 w-40 rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
              </div>
              <div className="mt-4 h-10 w-28 rounded-md bg-gray-200 dark:bg-gray-700 sm:mt-0"></div>
            </div>
          </div>
          <div className="mb-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800"
              >
                <div className="size-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div>
                  <div className="mb-1 h-4 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-7 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="w-full animate-pulse rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-gray-100 p-3 dark:bg-gray-700"
                >
                  <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-600"></div>
                  <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-600"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // useAuth 훅에서 자동으로 로그인 페이지로 리다이렉트
  }

  return (
    <motion.div
      className="container flex flex-col px-4 pb-20 pt-12"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.h1
        className="mb-8 text-2xl font-medium"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        관리자 대시보드
      </motion.h1>
      <AdminDashboard username={username} />
    </motion.div>
  );
}
