'use client';

import CategorySidebar from '@/components/blog/CategorySidebar';
import { AdSense } from '@/components/ads/AdSense';
import { useSidebar } from './SidebarToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineMenu, FaTimes, FaListAlt } from '@/components/icons';
import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/style';

interface SidebarProps {
  posts: any[];
}

export default function Sidebar({ posts }: SidebarProps) {
  const { isOpen, toggle } = useSidebar();
  const pathname = usePathname();

  return (
    <>
      {/* 사이드바가 닫혀있을 때 토글 버튼 */}
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="hidden lg:block"
        >
          <div className="sticky top-24 px-4">
            <motion.button
              onClick={toggle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="shadow-soft hover:shadow-medium relative z-10 rounded-lg border border-border bg-card p-3 text-primary transition-colors hover:bg-muted"
              aria-label="사이드바 열기"
            >
              <AiOutlineMenu className="size-5" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* 사이드바가 열려있을 때 */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="hidden lg:block lg:w-80 lg:shrink-0"
            style={{ overflow: 'visible' }}
          >
            <div className="sidebar-scrollbar sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto px-4">
              {/* 사이드바 토글 버튼 */}
              <div className="mb-4 flex justify-end">
                <motion.button
                  onClick={toggle}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="shadow-soft relative z-10 rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                  aria-label="사이드바 닫기"
                >
                  <FaTimes className="size-4" />
                </motion.button>
              </div>
              {/* 빠른 링크 */}
              <div className="mb-6">
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                  빠른 링크
                </h3>
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
                  <span>할일 관리</span>
                </Link>
              </div>

              <Suspense
                fallback={
                  <div className="text-muted-foreground">로딩 중...</div>
                }
              >
                <CategorySidebar posts={posts} />
              </Suspense>

              {/* 사이드바 광고 */}
              {process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_UNIT_ID && (
                <div className="mt-6">
                  <AdSense
                    adSlot={process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_UNIT_ID}
                    adFormat="vertical"
                    fullWidthResponsive={true}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
