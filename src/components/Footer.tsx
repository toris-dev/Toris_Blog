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
        {/* 모바일 뷰에서 더 컴팩트한 레이아웃 */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* 푸터 로고 및 설명 - 모든 디바이스에서 일관된 정렬 */}
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start">
              <FaServer className="mr-2 size-5 text-primary" />
              <span className="gradient-text text-lg font-bold">
                Toris Dev Blog
              </span>
            </div>
            <p className="mx-auto mt-2 max-w-xs text-sm text-content/80 dark:text-content-dark/90 sm:mx-0">
              Next.js, Supabase, AI 생산성 도구를 활용한 웹 개발 이야기를
              공유하는 개인 블로그입니다.
            </p>
          </div>

          {/* 탐색 링크 - 모바일에서도 깔끔하게 표시 */}
          <div className="text-center sm:text-left">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary/90">
              탐색
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:mt-4 sm:block sm:space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-content/80 hover:text-primary dark:text-content-dark/90 dark:hover:text-primary"
                >
                  홈
                </Link>
              </li>
              <li>
                <Link
                  href="/posts"
                  className="text-content/80 hover:text-primary dark:text-content-dark/90 dark:hover:text-primary"
                >
                  블로그
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-content/80 hover:text-primary dark:text-content-dark/90 dark:hover:text-primary"
                >
                  소개
                </Link>
              </li>
              <li>
                <Link
                  href="/portfolio"
                  className="text-content/80 hover:text-primary dark:text-content-dark/90 dark:hover:text-primary"
                >
                  포트폴리오
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-content/80 hover:text-primary dark:text-content-dark/90 dark:hover:text-primary"
                >
                  연락처
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="text-content/80 hover:text-primary dark:text-content-dark/90 dark:hover:text-primary"
                >
                  검색
                </Link>
              </li>
            </ul>
          </div>

          {/* 리소스 및 소셜 링크 통합 - 모바일 공간 효율성 */}
          <div className="text-center sm:text-left">
            <div className="mb-6 sm:mb-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary/90">
                리소스
              </h3>
              <ul className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 sm:mt-4 sm:block sm:space-y-2">
                <li>
                  <Link
                    href="/tags"
                    className="text-content/80 hover:text-primary dark:text-content-dark/90 dark:hover:text-primary"
                  >
                    태그
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categories"
                    className="text-content/80 hover:text-primary dark:text-content-dark/90 dark:hover:text-primary"
                  >
                    카테고리
                  </Link>
                </li>
                <li>
                  <Link
                    href="/markdown"
                    className="text-content/80 hover:text-primary dark:text-content-dark/90 dark:hover:text-primary"
                  >
                    마크다운
                  </Link>
                </li>
              </ul>
            </div>

            {/* 소셜 링크 */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary/90">
                소셜
              </h3>
              <div className="mt-3 flex justify-center space-x-6 sm:mt-4 sm:justify-start">
                <a
                  href="https://github.com/toris-dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-content/70 hover:text-primary dark:text-content-dark/80 dark:hover:text-primary"
                  aria-label="GitHub"
                >
                  <AiFillGithub className="size-6" />
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-content/70 hover:text-primary dark:text-content-dark/80 dark:hover:text-primary"
                  aria-label="Twitter"
                >
                  <FaTwitter className="size-6" />
                </a>
                <a
                  href="https://discord.gg/uVq7PYEU"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-content/70 hover:text-primary dark:text-content-dark/80 dark:hover:text-primary"
                  aria-label="Discord"
                >
                  <FaDiscord className="size-6" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 저작권 표시 및 기술 스택 - 모바일 친화적 */}
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
