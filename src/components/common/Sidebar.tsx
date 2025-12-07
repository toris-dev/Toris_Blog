'use client';

import CategorySidebar from '@/components/blog/CategorySidebar';
import { useSidebar } from './SidebarToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineMenu, FaTimes } from '@/components/icons';

interface SidebarProps {
  posts: any[];
}

export default function Sidebar({ posts }: SidebarProps) {
  const { isOpen, toggle } = useSidebar();

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
              className="neon-border relative z-10 rounded-lg border border-primary/30 bg-card/50 p-3 text-primary transition-colors hover:bg-card/80 hover:text-primary"
              aria-label="사이드바 열기"
              style={{
                overflow: 'visible',
                boxShadow: '0 0 10px hsl(var(--primary) / 0.3)'
              }}
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
                  className="neon-border relative z-10 rounded-lg border border-primary/30 bg-card/50 p-2 text-muted-foreground transition-colors hover:bg-card/80 hover:text-primary"
                  aria-label="사이드바 닫기"
                  style={{
                    overflow: 'visible',
                    boxShadow: '0 0 10px hsl(var(--primary) / 0.3)'
                  }}
                >
                  <FaTimes className="size-4" />
                </motion.button>
              </div>
              <CategorySidebar posts={posts} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
