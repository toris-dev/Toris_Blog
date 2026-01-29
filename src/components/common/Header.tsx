'use client';

import {
  FaBlog,
  FaHome,
  FaPaperPlane,
  FaSearch,
  FaUser,
  FaListAlt,
  SiNextjs
} from '@/components/icons';
import { cn } from '@/utils/style';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FC, useState, useRef, useMemo, useEffect } from 'react';
import SearchModal from './SearchModal';
import ThemeToggle from './ThemeToggle';

// 모바일 하단 네비게이션 아이템 (컴포넌트 외부 상수로 이동)
const mobileNavItems = [
  { href: '/', icon: FaHome, label: '홈' },
  { href: '/posts', icon: FaBlog, label: '블로그' },
  { href: '/todos', icon: FaListAlt, label: '할일' },
  { href: '/about', icon: FaUser, label: '소개' },
  { href: '/contact', icon: FaPaperPlane, label: '문의' }
];

const Header: FC = () => {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    // 기존 timeout 제거
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // 마지막 스크롤 위치 저장
    const previousScrollY = lastScrollY.current;
    lastScrollY.current = latest;

    // debounce 적용 (100ms 후 실행)
    debounceTimeoutRef.current = setTimeout(() => {
      if (latest > previousScrollY && latest > 100) {
        setIsVisible(false);
      } else if (latest < previousScrollY) {
        setIsVisible(true);
      }
    }, 100);
  });

  // 컴포넌트 언마운트 시 timeout 정리
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const navItems = useMemo(
    () => [
      { href: '/', label: '홈', isActive: pathname === '/' },
      {
        href: '/posts',
        label: '블로그',
        isActive: pathname.startsWith('/posts')
      },
      { href: '/todos', label: '할일 관리', isActive: pathname === '/todos' },
      { href: '/about', label: '소개', isActive: pathname === '/about' },
      { href: '/contact', label: '문의', isActive: pathname === '/contact' }
    ],
    [pathname]
  );

  return (
    <>
      {/* Desktop Header */}
      <header
        className={cn(
          'shadow-soft fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60',
          !isVisible && 'hide'
        )}
        suppressHydrationWarning
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/" className="flex items-center gap-2 font-bold">
              <motion.div
                className="shadow-soft flex size-8 items-center justify-center rounded-full bg-primary/10"
                whileHover={{
                  rotate: 360,
                  transition: { duration: 0.6, ease: 'easeInOut' }
                }}
              >
                <SiNextjs className="size-5 text-primary" />
              </motion.div>
              <span className="text-xl font-bold text-foreground">
                Toris Blog
              </span>
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
                    'relative text-sm font-medium transition-colors hover:text-primary',
                    isActive
                      ? 'font-semibold text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  {label}
                  {isActive && (
                    <motion.div
                      className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-primary"
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
      </header>

      {/* Mobile Bottom Navigation - 스크롤 다운 시 숨김, 스크롤 업 시 표시 (데스크톱 헤더와 동일한 isVisible + 디바운스 적용) */}
      <motion.div
        className="shadow-soft fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 md:hidden"
        initial={false}
        animate={
          mounted ? (isVisible ? { y: 0 } : { y: 100 }) : { y: 100 }
        }
        transition={{ duration: 0.3, ease: 'easeInOut' }}
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
                  'flex flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] transition-colors sm:text-xs',
                  pathname === href
                    ? 'bg-primary/10 text-primary'
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
