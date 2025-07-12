'use client';

import { FaBlog, FaHome, FaPaperPlane, FaSearch, SiNextjs } from '@/components/icons';
import { cn } from '@/utils/style';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FC } from 'react';
import { ThemeToggle } from './ThemeToggle';

const Header: FC = () => {
  const pathname = usePathname();

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
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
              <SiNextjs className="size-5 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-xl text-transparent">
              Toris Blog
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-6 md:flex">
            {navItems.map(({ href, label, isActive }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  isActive ? 'text-primary' : 'text-foreground/60'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/posts"
              className="hidden rounded-lg p-2 text-foreground/60 transition-colors hover:bg-accent hover:text-foreground sm:block"
            >
              <FaSearch className="size-4" />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <div className="grid grid-cols-4 gap-1 p-2">
          {[
            { href: '/', icon: FaHome, label: '홈' },
            { href: '/posts', icon: FaBlog, label: '블로그' },
            { href: '/about', icon: FaSearch, label: '소개' },
            { href: '/contact', icon: FaPaperPlane, label: '문의' }
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center rounded-lg p-2 text-xs transition-colors',
                pathname === href
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/60 hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="mb-1 size-5" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default Header;
