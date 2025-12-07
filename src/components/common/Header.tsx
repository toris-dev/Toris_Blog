'use client';

import {
  FaBlog,
  FaHome,
  FaPaperPlane,
  FaSearch,
  FaUser,
  SiNextjs
} from '@/components/icons';
import { cn } from '@/utils/style';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FC, useState } from 'react';
import SearchModal from './SearchModal';

const Header: FC = () => {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navItems = [
    { href: '/', label: '홈', isActive: pathname === '/' },
    {
      href: '/posts',
      label: '블로그',
      isActive: pathname.startsWith('/posts')
    },
    { href: '/about', label: '소개', isActive: pathname === '/about' },
    { href: '/contact', label: '문의', isActive: pathname === '/contact' }
  ];

  return (
    <>
      {/* Desktop Header */}
      <header className="neon-border sticky top-0 z-50 border-b border-primary/30 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/" className="flex items-center gap-2 font-bold">
              <motion.div
                className="neon-glow-animate flex size-8 items-center justify-center rounded-full bg-primary/20"
                whileHover={{
                  rotate: 360,
                  transition: { duration: 0.6, ease: 'easeInOut' }
                }}
              >
                <SiNextjs className="neon-glow size-5 text-primary" />
              </motion.div>
              <span className="neon-glow animate-[gradient_3s_ease_infinite] bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] bg-clip-text text-xl text-transparent">
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
                    'relative text-sm font-medium transition-all hover:text-primary',
                    isActive
                      ? 'neon-glow text-primary'
                      : 'text-muted-foreground hover:drop-shadow-[0_0_8px_hsl(var(--primary))]'
                  )}
                >
                  {label}
                  {isActive && (
                    <motion.div
                      className="neon-glow-animate absolute inset-x-0 -bottom-1 h-0.5 bg-primary"
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
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <motion.div
        className="neon-border fixed inset-x-0 bottom-0 z-50 border-t border-primary/30 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 md:hidden"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="grid grid-cols-4 gap-1 p-2">
          {[
            { href: '/', icon: FaHome, label: '홈' },
            { href: '/posts', icon: FaBlog, label: '블로그' },
            { href: '/about', icon: FaUser, label: '소개' },
            { href: '/contact', icon: FaPaperPlane, label: '문의' }
          ].map(({ href, icon: Icon, label }) => (
            <motion.div
              key={href}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg p-2 text-xs transition-colors',
                  pathname === href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="mb-1 size-5" />
                <span>{label}</span>
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
