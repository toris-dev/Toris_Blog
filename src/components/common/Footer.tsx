'use client';

import { AiFillGithub, FaCode, SiNextjs } from '@/components/icons';
import Link from 'next/link';
import { FC } from 'react';

const Footer: FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start">
              <SiNextjs className="mr-2 size-5 text-primary" />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-lg font-bold text-transparent">
                Toris Blog
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Next.js, React, TypeScript로 만드는 모던 웹 개발 블로그
            </p>
          </div>

          {/* Links */}
          <div className="text-center md:text-left">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              페이지
            </h3>
            <div className="space-y-2">
              <Link
                href="/about"
                className="block text-sm text-muted-foreground hover:text-primary"
              >
                소개
              </Link>
              <Link
                href="/posts"
                className="block text-sm text-muted-foreground hover:text-primary"
              >
                블로그
              </Link>
            </div>
          </div>

          {/* Social */}
          <div className="text-center md:text-left">
            <h3 className="mb-3 text-sm font-semibold text-foreground">소셜</h3>
            <div className="flex justify-center space-x-4 md:justify-start">
              <Link
                href="https://github.com/toris-dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
                aria-label="GitHub"
              >
                <AiFillGithub className="size-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 flex flex-col items-center justify-between border-t border-border pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {year} Toris-dev. All rights reserved.
          </p>
          <div className="mt-4 flex items-center sm:mt-0">
            <div className="flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
              <FaCode className="mr-1 size-3" />
              <span>Next.js</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
