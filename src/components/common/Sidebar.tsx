'use client';

import { useSidebar } from '@/components/common/Providers';
import {
  AiOutlineBook,
  AiOutlineClose,
  AiOutlineFire,
  AiOutlineGithub,
  AiOutlineInfoCircle,
  AiOutlineMail,
  AiOutlineTag,
  AiOutlineTwitter,
  BiCategory,
  BsFileEarmarkPost,
  FaDiscord,
  FaEthereum,
  HiBadgeCheck,
  RiUserFollowLine
} from '@/components/icons';
import { useCategories } from '@/utils/hooks';
import { cn } from '@/utils/style';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FC, ReactNode, useEffect, useState } from 'react';
import IconButton from '../ui/IconButton';

interface NavItemProps {
  href: string;
  icon: ReactNode;
  text: string;
  isActive?: boolean;
  onClick?: () => void;
}

const Sidebar: FC = () => {
  const { isOpen, setIsOpen } = useSidebar();
  const { data: existingCategories = [] } = useCategories();
  const pathname = usePathname();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Initialize window width on client-side only
  useEffect(() => {
    setIsLargeScreen(window.innerWidth >= 1024);

    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }, [pathname, setIsOpen]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      if (
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        window.innerWidth < 1024
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setIsOpen]);

  // 관심 토픽 리스트
  const topics = [
    'Next.js',
    'React',
    'TypeScript',
    'Supabase',
    'Vercel',
    'Tailwind CSS',
    'AI Tools',
    'Serverless',
    'Web3',
    'DAOs',
    'Smart Contracts'
  ];

  const menuItems = [
    {
      href: '/posts',
      icon: BsFileEarmarkPost,
      label: '블로그'
    },
    {
      href: '/portfolio',
      icon: RiUserFollowLine,
      label: '포트폴리오'
    },
    {
      href: '/tags',
      icon: AiOutlineTag,
      label: '태그'
    },
    {
      href: '/markdown',
      icon: AiOutlineBook,
      label: '마크다운 문서'
    },
    {
      href: '/about',
      icon: AiOutlineInfoCircle,
      label: '소개'
    },
    {
      href: '/contact',
      icon: AiOutlineMail,
      label: '연락처'
    }
  ];

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: '-100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <>
      {/* 오버레이 - 모바일에서 사이드바가 열릴 때 배경 어둡게 처리 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        id="sidebar"
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen || isLargeScreen ? 'open' : 'closed'}
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col overflow-hidden border-r border-white/10 pt-20 backdrop-blur-xl transition-all duration-300',
          'bg-card/30 dark:bg-bkg-light/30',
          isCollapsed ? 'lg:w-20' : ''
        )}
      >
        <div className="absolute right-4 top-4 lg:hidden">
          <IconButton
            Icon={AiOutlineClose}
            onClick={() => setIsOpen(false)}
            label="닫기"
            className="text-content hover:text-primary"
          />
        </div>

        <div className="flex justify-center lg:justify-start lg:px-4">
          <IconButton
            Icon={AiOutlineFire}
            label={isCollapsed ? '펼치기' : '접기'}
            className={cn(
              'transition-all hover:bg-primary/10',
              isCollapsed ? 'justify-center' : ''
            )}
            onClick={() => setIsCollapsed(!isCollapsed)}
          />
        </div>

        {/* 프로필 섹션 */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 px-6 text-center"
            >
              <div className="relative mx-auto mb-4 size-24 overflow-hidden rounded-full border-2 border-primary p-1">
                <Image
                  src="https://github.com/toris-dev.png"
                  alt="토리스 프로필 이미지"
                  width={100}
                  height={100}
                  className="size-full rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-0">
                  <HiBadgeCheck className="size-6 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-bold">toris-dev</h3>
              <p className="mb-2 text-sm text-content-dark">
                풀스택 개발자 & 블로거
              </p>
              <div className="flex justify-center gap-3">
                <IconButton
                  Icon={AiOutlineGithub}
                  component="a"
                  href="https://github.com/toris-dev"
                  target="_blank"
                  label="GitHub"
                  className="text-content hover:text-primary"
                />
                <IconButton
                  Icon={AiOutlineTwitter}
                  component="a"
                  href="#"
                  target="_blank"
                  label="Twitter"
                  className="text-content hover:text-primary"
                />
                <IconButton
                  Icon={FaDiscord}
                  component="a"
                  href="#"
                  target="_blank"
                  label="Discord"
                  className="text-content hover:text-primary"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 네비게이션 메뉴 */}
        <nav className="hide-scrollbar mb-8 flex-1 overflow-y-auto px-4">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center rounded-lg px-4 py-2.5 font-medium transition-all',
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? 'bg-primary/10 text-primary'
                    : 'text-content hover:bg-white/5 hover:text-primary'
                )}
              >
                <item.icon
                  className={cn('size-5', isCollapsed ? '' : 'mr-3')}
                />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>

          {/* 카테고리 섹션 */}
          {existingCategories.length > 0 && !isCollapsed && (
            <div className="mt-8">
              <h4 className="mb-3 flex items-center px-4 text-xs font-semibold uppercase tracking-wider text-content-dark">
                <BiCategory className="mr-2 size-4" />
                카테고리
              </h4>

              <div className="space-y-1">
                {existingCategories.map((category) => (
                  <Link
                    key={category}
                    href={`/categories/${category}`}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'group flex items-center justify-between rounded-lg px-4 py-2 font-medium transition-all',
                      pathname === `/categories/${category}`
                        ? 'bg-primary/10 text-primary'
                        : 'text-content hover:bg-white/5 hover:text-primary'
                    )}
                    onMouseEnter={() => setHoveredCategory(category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <span>{category}</span>
                    <span
                      className={cn(
                        'rounded-full text-xs transition-all',
                        pathname === `/categories/${category}` ||
                          hoveredCategory === category
                          ? 'bg-primary/20 text-primary'
                          : 'bg-bkg text-content-dark'
                      )}
                    >
                      <span className="flex h-5 min-w-5 items-center justify-center px-1">
                        {Math.floor(Math.random() * 10) + 1}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* 관심 토픽 태그 */}
        {!isCollapsed && (
          <div className="px-6 pb-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-dark">
              관심 토픽
            </h4>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <span
                  key={topic}
                  className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  <FaEthereum className="mr-1 size-3" />
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.aside>
    </>
  );
};

export default Sidebar;
