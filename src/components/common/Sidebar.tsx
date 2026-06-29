'use client';

import CategorySidebar from '@/components/blog/CategorySidebar';
import { AdSense } from '@/components/ads/AdSense';
import { useSidebar } from './SidebarToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineMenu, FaTimes } from '@/components/icons';
import { usePathname } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { cn } from '@/utils/style';

interface SidebarProps {
  posts: any[];
}

const POST_DETAIL_PATH = /^\/posts\/[^/]+$/;

function isPostDetailPath(pathname: string | null): boolean {
  return pathname !== null && POST_DETAIL_PATH.test(pathname);
}

function SidebarPanel({
  posts,
  onClose,
  showHeader = false
}: {
  posts: SidebarProps['posts'];
  onClose?: () => void;
  showHeader?: boolean;
}) {
  return (
    <>
      {showHeader && onClose && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex shrink-0 items-center justify-between gap-2 border-b border-border pb-3"
        >
          <p className="text-sm font-semibold text-foreground">카테고리</p>
          <motion.button
            type="button"
            onClick={onClose}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="rounded-lg border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            aria-label="사이드바 닫기"
          >
            <FaTimes className="size-4" />
          </motion.button>
        </motion.div>
      )}

      {!showHeader && onClose && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 flex justify-end"
        >
          <motion.button
            type="button"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="shadow-soft relative z-10 rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            aria-label="사이드바 닫기"
          >
            <FaTimes className="size-4" />
          </motion.button>
        </motion.div>
      )}

      <Suspense
        fallback={<motion.div className="text-muted-foreground">로딩 중...</motion.div>}
      >
        <CategorySidebar posts={posts} />
      </Suspense>

      {process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_UNIT_ID && (
        <div className="mt-6 shrink-0">
          <AdSense
            adSlot={process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_UNIT_ID}
            adFormat="vertical"
            fullWidthResponsive={true}
            className="w-full"
          />
        </div>
      )}
    </>
  );
}

function OpenSidebarButton({
  onClick,
  className,
  label = '사이드바 열기'
}: {
  onClick: () => void;
  className?: string;
  label?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className={cn(
        'shadow-medium rounded-lg border border-border bg-card/95 p-3 text-primary backdrop-blur-sm transition-colors hover:bg-muted',
        className
      )}
      aria-label={label}
      aria-expanded={false}
    >
      <AiOutlineMenu className="size-5" />
    </motion.button>
  );
}

/** 포스트 상세: 스크롤해도 뷰포트에 고정되는 플로팅 패널 */
function PostDetailSidebar({ posts }: SidebarProps) {
  const { isOpen, open, close } = useSidebar();

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none fixed inset-0 z-40 hidden lg:block"
      aria-hidden={!isOpen}
    >
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
              className="pointer-events-auto fixed inset-0 top-24 bg-background/40 backdrop-blur-[2px]"
              aria-label="사이드바 닫기"
            />

            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="카테고리 탐색"
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="pointer-events-auto fixed left-4 top-24 z-50 w-80 max-w-[calc(100vw-2rem)]"
            >
              <div className="sidebar-scrollbar flex max-h-[calc(100vh-7rem)] flex-col overflow-y-auto rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-md">
                <SidebarPanel posts={posts} onClose={close} showHeader />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto fixed left-4 top-24 z-50"
          >
            <OpenSidebarButton onClick={open} label="카테고리 열기" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** 기본 레이아웃: 본문 옆 컬럼 + sticky */
function DefaultSidebar({ posts }: SidebarProps) {
  const { isOpen, toggle, close } = useSidebar();

  return (
    <>
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="hidden lg:block"
        >
          <div className="sticky top-24 px-4">
            <OpenSidebarButton
              onClick={toggle}
              className="shadow-soft relative z-10"
            />
          </div>
        </motion.div>
      )}

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
              <SidebarPanel posts={posts} onClose={close} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

export default function Sidebar({ posts }: SidebarProps) {
  const pathname = usePathname();
  const onPostDetail = isPostDetailPath(pathname);

  if (onPostDetail) {
    return <PostDetailSidebar posts={posts} />;
  }

  return <DefaultSidebar posts={posts} />;
}
