'use client';

import { useSidebar } from '@/components/common/Providers';
import {
  AiOutlineClose,
  AiOutlineMenu,
  BsGrid,
  BsMoonStarsFill,
  BsPencilSquare,
  BsSunFill,
  FaEthereum,
  FaSearch,
  FaSignInAlt,
  SiNextjs
} from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/style';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FC, useEffect, useState } from 'react';
import IconButton from '../ui/IconButton';

const Header: FC = () => {
  const { isOpen, setIsOpen } = useSidebar();
  const { isAuthenticated, loading, signout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [navVisible, setNavVisible] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();
  const [lastScrollY, setLastScrollY] = useState(0);

  // 스크롤 감지하여 헤더 스타일 변경
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 스크롤 위치에 따라 scrolled 상태 업데이트
      if (currentScrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // 이전 스크롤 위치와 비교하여 헤더 표시 여부 결정
      // 10px 이상 스크롤 된 경우에만 변경 (작은 움직임은 무시)
      if (Math.abs(currentScrollY - lastScrollY) < 10) return;

      // 상단 헤더: 스크롤 다운 - 헤더 숨김, 스크롤 업 - 헤더 표시
      if (currentScrollY > lastScrollY) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }

      // 하단 모바일 네비게이션: 항상 표시 (독립적으로 작동)
      setNavVisible(true);

      setLastScrollY(currentScrollY);
    };

    // 이벤트 리스너 등록
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 초기 설정
    handleScroll();

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Toggle dark mode
  useEffect(() => {
    // Check if user prefers dark mode
    const isDarkMode =
      localStorage.getItem('darkMode') === 'true' ||
      (!('darkMode' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    setDarkMode(isDarkMode);
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', (!darkMode).toString());
  };

  // 로그아웃 처리 함수
  const handleSignout = () => {
    signout();
  };

  return (
    <>
      {/* 상단 헤더 */}
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 w-full transition-all duration-300',
          scrolled
            ? 'bg-bkg-dark/80 py-3 shadow-md backdrop-blur-md'
            : 'bg-transparent py-5',
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <IconButton
              onClick={() => setIsOpen(!isOpen)}
              Icon={isOpen ? AiOutlineClose : AiOutlineMenu}
              label="사이드바 토글"
              id="sidebarToggle"
              aria-label="사이드바 토글"
              className="mr-3 text-content hover:text-primary lg:hidden"
            />

            <Link href="/" className="group flex items-center gap-1">
              <div className="relative size-10 overflow-hidden rounded-full border-2 border-primary p-1">
                <div className="flex size-full items-center justify-center rounded-full bg-primary/10">
                  <SiNextjs className="size-5 text-primary" />
                </div>
              </div>
              <span className="bg-gradient-to-r from-primary to-accent-1 bg-clip-text text-xl font-bold text-transparent">
                Toris Blog
              </span>
            </Link>
          </div>

          <nav className="hidden items-center space-x-1 lg:flex">
            {[
              { href: '/', label: '홈', isActive: pathname === '/' },
              {
                href: '/posts',
                label: '블로그',
                isActive:
                  pathname === '/posts' || pathname.startsWith('/posts/')
              },
              {
                href: '/categories',
                label: '카테고리',
                isActive: pathname.startsWith('/categories')
              },
              { href: '/tags', label: '태그', isActive: pathname === '/tags' },
              {
                href: '/guestbook',
                label: '방명록',
                isActive: pathname === '/guestbook'
              },
              {
                href: '/portfolio',
                label: '포트폴리오',
                isActive: pathname === '/portfolio'
              }
            ].map(({ href, label, isActive }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-lg px-4 py-2 font-medium transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-content/80 hover:bg-bkg-light/30 hover:text-primary'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <IconButton
              Icon={darkMode ? BsSunFill : BsMoonStarsFill}
              onClick={toggleDarkMode}
              label="테마 변경"
              className="text-content hover:text-primary"
            />

            <IconButton
              Icon={FaSearch}
              component={Link}
              href="/posts"
              className="text-content hover:text-primary"
              label="검색"
              id="searchButton"
              aria-label="검색"
            />

            {loading ? (
              <div className="flex size-10 items-center justify-center">
                <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : isAuthenticated ? (
              <>
                <IconButton
                  Icon={BsGrid}
                  component={Link}
                  href="/dashboard"
                  className="text-content hover:text-primary"
                  label="대시보드"
                  id="dashboardButton"
                  aria-label="대시보드"
                />

                <IconButton
                  Icon={FaSignInAlt}
                  onClick={handleSignout}
                  className="text-content hover:text-primary"
                  label="로그아웃"
                  id="signoutButton"
                  aria-label="로그아웃"
                />

                <Link
                  href="/write"
                  className="web3-button group ml-2 hidden items-center rounded-lg bg-gradient-to-r from-primary to-accent-1 px-4 py-2 text-white shadow-md transition-all hover:scale-105 hover:shadow-lg lg:flex"
                >
                  <BsPencilSquare className="mr-2 size-4 group-hover:animate-pulse" />
                  <span>글쓰기</span>
                </Link>
              </>
            ) : (
              <IconButton
                Icon={FaSignInAlt}
                component={Link}
                href="/signin"
                className="text-content hover:text-primary"
                label="로그인"
                id="signinButton"
                aria-label="로그인"
              />
            )}
          </div>
        </div>
      </header>

      {/* 모바일 네비게이션 - 하단 고정 (분리됨) */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-bkg-dark/90 shadow-lg backdrop-blur-md transition-all duration-300 lg:hidden',
          navVisible ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="flex justify-between px-6 py-3">
          {[
            { href: '/', Icon: FaEthereum, label: '홈' },
            { href: '/posts', Icon: BsGrid, label: '블로그' },
            { href: '/search', Icon: FaSearch, label: '검색' },
            ...(isAuthenticated
              ? [
                  { href: '/write', Icon: BsPencilSquare, label: '글쓰기' },
                  {
                    href: '#',
                    Icon: FaSignInAlt,
                    label: '로그아웃',
                    onClick: handleSignout
                  }
                ]
              : [{ href: '/signin', Icon: FaSignInAlt, label: '로그인' }])
          ].map(({ href, Icon, label, onClick }) =>
            onClick ? (
              <button
                key={label}
                onClick={onClick}
                className={cn(
                  'flex flex-col items-center justify-center text-xs',
                  'text-content/70 hover:text-primary'
                )}
              >
                <Icon className="mb-1 size-5" />
                <span>{label}</span>
              </button>
            ) : (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center text-xs',
                  pathname === href
                    ? 'text-primary'
                    : 'text-content/70 hover:text-primary'
                )}
              >
                <Icon className="mb-1 size-5" />
                <span>{label}</span>
              </Link>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default Header;
