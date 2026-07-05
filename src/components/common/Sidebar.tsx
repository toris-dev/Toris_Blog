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

function SidebarPanel({
  posts,
  onClose
}: {
  posts: SidebarProps['posts'];
  onClose?: () => void;
}) {
  return (
    <>
      {onClose && (
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

/**
 * 모든 페이지 공통 사이드바.
 * - 본문 옆 컬럼 + sticky → 스크롤해도 뷰포트에 고정
 * - 오버레이/스크림 없음 → 열어도 본문이 blur 되거나 어두워지지 않음
 */
export default function Sidebar({ posts }: SidebarProps) {
  const pathname = usePathname();
  const { isOpen, toggle, close } = useSidebar();
  // 풀블리드 랜딩은 블로그 사이드바 제외:
  // - 프로덕션 서비스 랜딩(/projects)
  // - 몰입형 3D 홈(/)
  const isProjectRoute = pathname?.startsWith('/projects') ?? false;
  const isHomeRoute = pathname === '/';

  // ESC로 닫기
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  if (isProjectRoute || isHomeRoute) {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed left-4 top-24 z-40 hidden lg:block"
        >
          <OpenSidebarButton
            onClick={toggle}
            className="shadow-soft relative z-10"
          />
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {isOpen && (
          <aside
            aria-label="카테고리 탐색"
            className="hidden lg:block lg:w-80 lg:shrink-0"
          >
            {/* fixed 패널 — 어떤 페이지·스크롤에서도 뷰포트에 고정 */}
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed left-0 top-24 z-40 w-80"
            >
              <div className="sidebar-scrollbar h-[calc(100vh-7rem)] overflow-y-auto px-4">
                <SidebarPanel posts={posts} onClose={close} />
              </div>
            </motion.div>
          </aside>
        )}
      </AnimatePresence>
    </>
  );
}
