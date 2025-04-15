'use client';

import {
  AiFillGithub,
  FaCode,
  FaDiscord,
  FaServer,
  FaTwitter
} from '@/components/icons';
import Link from 'next/link';
import { FC } from 'react';

const Footer: FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/80 backdrop-blur-md dark:bg-bkg-dark/80 lg:pl-[280px]">
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* 푸터 상단 섹션 */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
          {/* 블로그 소개 */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start">
              <FaServer className="mr-2 size-5 text-primary" />
              <span className="gradient-text text-lg font-bold">
                Toris Dev Blog
              </span>
            </div>
            <p className="mx-auto mt-2 max-w-xs text-sm text-content/80 dark:text-content-dark/90 md:mx-0">
              Next.js, Supabase, AI 생산성 도구를 활용한 웹 개발 이야기를
              공유하는 개인 블로그입니다.
            </p>
          </div>

          {/* 페이지 링크 */}
          <div className="text-center md:text-left">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary/90">
              페이지
            </h3>
            <div className="flex flex-wrap justify-center gap-4 md:justify-start">
              <Link
                href="/about"
                className="text-sm text-content/80 transition-colors hover:text-primary dark:text-content-dark/90 dark:hover:text-primary"
              >
                소개
              </Link>
              <Link
                href="/terms"
                className="text-sm text-content/80 transition-colors hover:text-primary dark:text-content-dark/90 dark:hover:text-primary"
              >
                이용약관
              </Link>
              <Link
                href="/contact"
                className="text-sm text-content/80 transition-colors hover:text-primary dark:text-content-dark/90 dark:hover:text-primary"
              >
                연락처
              </Link>
            </div>
          </div>

          {/* 소셜 링크 */}
          <div className="text-center md:text-left">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary/90">
              소셜 미디어
            </h3>
            <div className="flex justify-center space-x-5 md:justify-start">
              <Link
                href="https://github.com/toris-dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-content/70 hover:text-primary dark:text-content-dark/80 dark:hover:text-primary"
                aria-label="GitHub"
              >
                <AiFillGithub className="size-5" />
              </Link>
              <Link
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-content/70 hover:text-primary dark:text-content-dark/80 dark:hover:text-primary"
                aria-label="Twitter"
              >
                <FaTwitter className="size-5" />
              </Link>
              <Link
                href="https://discord.gg/uVq7PYEU"
                target="_blank"
                rel="noopener noreferrer"
                className="text-content/70 hover:text-primary dark:text-content-dark/80 dark:hover:text-primary"
                aria-label="Discord"
              >
                <FaDiscord className="size-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 저작권 알림 */}
        <div className="mt-8 rounded-lg bg-yellow-50/50 p-4 text-center text-sm dark:bg-yellow-900/10">
          <p className="text-yellow-700 dark:text-yellow-300">
            본 블로그의 모든 콘텐츠와 코드는 저작권법에 의해 보호받습니다.
            자세한 내용은{' '}
            <Link href="/terms" className="font-medium underline">
              이용약관
            </Link>
            을 참조하세요.
          </p>
        </div>

        {/* 저작권 표시 및 기술 스택 */}
        <div className="mt-6 flex flex-col items-center space-y-4 border-t border-border pt-6 sm:mt-8 sm:pt-8 md:flex-row md:justify-between md:space-y-0">
          <p className="text-center text-xs text-content/70 dark:text-content-dark/80 sm:text-left sm:text-sm">
            &copy; {year} Toris-dev. All rights reserved.
          </p>
          <div className="flex items-center">
            <div className="relative overflow-hidden">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs text-primary dark:bg-primary/20">
                <FaCode className="mr-1 size-3" />
                <span>Powered by Toris-dev</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
