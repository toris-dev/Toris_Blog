'use client';

import {
  FaBlog,
  FaCodeBranch,
  FaPaperPlane,
  FaSearch,
  FaTools,
  AiOutlineFolderOpen
} from '@/components/icons';
import { TorisBrand } from '@/components/brand/TorisBrand';
import { cn } from '@/utils/style';
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll
} from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import SearchModal from './SearchModal';
import ThemeToggle from './ThemeToggle';

// 모바일 하단 네비게이션 아이템 (컴포넌트 외부 상수로 이동)
const mobileNavItems = [
  { href: '/services', icon: FaTools, label: '서비스' },
  { href: '/work', icon: AiOutlineFolderOpen, label: '작업 사례' },
  { href: '/process', icon: FaCodeBranch, label: '진행 방식' },
  { href: '/blog', icon: FaBlog, label: '블로그' },
  { href: '/contact', icon: FaPaperPlane, label: '문의' }
];

const TOP_VISIBILITY_THRESHOLD = 72;
const DIRECTION_CHANGE_THRESHOLD = 6;

export function getHeaderVisibility(
  previousScrollY: number,
  currentScrollY: number,
  currentVisibility: boolean
) {
  if (currentScrollY <= TOP_VISIBILITY_THRESHOLD) return true;

  const scrollDelta = currentScrollY - previousScrollY;
  if (Math.abs(scrollDelta) < DIRECTION_CHANGE_THRESHOLD) {
    return currentVisibility;
  }

  return scrollDelta < 0;
}

const Header: FC = () => {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  const reduceMotion = useReducedMotion();
  const lastScrollY = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previousScrollY = lastScrollY.current;

    if (latest <= TOP_VISIBILITY_THRESHOLD) {
      lastScrollY.current = latest;
      setIsVisible(true);
      return;
    }

    if (Math.abs(latest - previousScrollY) < DIRECTION_CHANGE_THRESHOLD) return;

    lastScrollY.current = latest;
    setIsVisible((currentVisibility) =>
      getHeaderVisibility(previousScrollY, latest, currentVisibility)
    );
  });

  const navItems = useMemo(
    () => [
      {
        href: '/services',
        label: '서비스',
        isActive: pathname.startsWith('/services')
      },
      {
        href: '/work',
        label: '작업 사례',
        isActive:
          pathname.startsWith('/work') || pathname.startsWith('/projects')
      },
      {
        href: '/process',
        label: '진행 방식',
        isActive: pathname.startsWith('/process')
      },
      {
        href: '/blog',
        label: '블로그',
        isActive: pathname.startsWith('/blog') || pathname.startsWith('/posts')
      },
      { href: '/contact', label: '문의', isActive: pathname === '/contact' }
    ],
    [pathname]
  );

  return (
    <>
      {/* Desktop Header */}
      <motion.header
        initial={false}
        animate={{ y: mounted && !isVisible ? '-100%' : '0%' }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                duration: isVisible ? 0.24 : 0.18,
                ease: isVisible ? [0.23, 1, 0.32, 1] : [0.4, 0, 1, 1]
              }
        }
        onFocusCapture={() => setIsVisible(true)}
        className="fixed inset-x-0 top-0 z-50 border-b border-[var(--toris-border)] bg-[var(--toris-surface)] text-[var(--toris-ink)] shadow-[var(--toris-shadow-sm)]"
        suppressHydrationWarning
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/"
              className="flex min-h-11 items-center rounded-xl bg-[var(--toris-color-mist)] px-2 font-bold text-[var(--toris-color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--toris-focus)]"
            >
              <TorisBrand
                priority
                markClassName="size-8"
                wordmarkClassName="text-lg tracking-[0.1em]"
              />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-6 md:flex">
            {navItems.map(({ href, label, isActive }) => (
              <motion.div
                key={href}
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={href}
                  className={cn(
                    'relative text-sm font-medium transition-colors hover:text-[var(--toris-system-text)]',
                    isActive
                      ? 'font-semibold text-[var(--toris-system-text)]'
                      : 'text-muted-foreground'
                  )}
                >
                  {label}
                  {isActive && (
                    <motion.div
                      className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-[var(--toris-system)]"
                      layoutId="activeIndicator"
                      initial={false}
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30
                      }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:block"
                aria-label="블로그 포스트 검색"
              >
                <FaSearch className="size-4" />
              </button>
            </motion.div>
            <ThemeToggle />
          </div>
        </div>
      </motion.header>

      {/* Mobile Bottom Navigation - 데스크톱 헤더와 같은 스크롤 방향을 따릅니다. */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--toris-border)] bg-[var(--toris-surface)] text-[var(--toris-ink)] shadow-[var(--toris-shadow-sm)] md:hidden"
        onFocusCapture={() => setIsVisible(true)}
        initial={false}
        animate={mounted ? (isVisible ? { y: 0 } : { y: 100 }) : { y: 100 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: isVisible ? 0.24 : 0.18, ease: 'easeInOut' }
        }
      >
        <div className="grid min-w-0 grid-cols-5 gap-0 px-1 py-1.5">
          {mobileNavItems.map(({ href, icon: Icon, label }) => (
            <motion.div
              key={href}
              className="min-w-0"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 text-xs transition-colors',
                  (
                    href === '/blog'
                      ? pathname.startsWith('/blog') ||
                        pathname.startsWith('/posts')
                      : href === '/work'
                        ? pathname.startsWith('/work') ||
                          pathname.startsWith('/projects')
                        : pathname.startsWith(href)
                  )
                    ? 'bg-secondary/10 text-[var(--toris-system-text)]'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="size-4 shrink-0 sm:size-5" />
                <span className="truncate">{label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};

export default Header;
