'use client';

import { AiFillGithub, AiOutlineMail } from '@/components/icons';
import { TorisBrand } from '@/components/brand/TorisBrand';
import { studioBusiness } from '@/data/studio';
import Link from 'next/link';

const footerLinks = [
  { href: '/services', label: '서비스' },
  { href: '/work', label: '작업 사례' },
  { href: '/process', label: '진행 방식' },
  { href: '/blog', label: '블로그' },
  { href: '/about', label: '소개' },
  { href: '/contact', label: '프로젝트 문의' }
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.25fr_0.75fr_1fr]">
          <div>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center text-foreground"
            >
              <TorisBrand
                markClassName="size-10"
                wordmarkClassName="text-xl tracking-[0.1em]"
              />
            </Link>
            <p className="mt-4 max-w-sm text-pretty break-keep text-sm leading-7 text-muted-foreground">
              앱·웹·데스크톱 제품을 설계하고 개발하는 독립 제품 스튜디오. 기술
              블로그를 통해 배운 것과 운영 경험을 함께 공개합니다.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="https://github.com/toris-dev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-150 hover:border-primary/40 hover:text-primary"
                aria-label="TORIS GitHub"
              >
                <AiFillGithub className="size-4" />
              </a>
              <a
                href={`mailto:${studioBusiness.email}`}
                className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-150 hover:border-primary/40 hover:text-primary"
                aria-label="TORIS 이메일"
              >
                <AiOutlineMail className="size-4" />
              </a>
            </div>
          </div>

          <nav aria-label="푸터 메뉴">
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">
              Navigate
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-1">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors duration-150 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>

          <div>
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">
              Business
            </h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="grid grid-cols-[5rem_1fr] gap-3">
                <dt className="text-muted-foreground">상호</dt>
                <dd className="font-semibold text-foreground">
                  {studioBusiness.name}
                </dd>
              </div>
              <div className="grid grid-cols-[5rem_1fr] gap-3">
                <dt className="text-muted-foreground">대표</dt>
                <dd className="font-semibold text-foreground">
                  {studioBusiness.owner}
                </dd>
              </div>
              {studioBusiness.registrationNumber ? (
                <div className="grid grid-cols-[5rem_1fr] gap-3">
                  <dt className="text-muted-foreground">사업자번호</dt>
                  <dd className="font-semibold text-foreground">
                    {studioBusiness.registrationNumber}
                  </dd>
                </div>
              ) : null}
              <div className="grid grid-cols-[5rem_1fr] gap-3">
                <dt className="text-muted-foreground">이메일</dt>
                <dd>
                  <a
                    href={`mailto:${studioBusiness.email}`}
                    className="break-all font-semibold text-foreground underline decoration-border underline-offset-4 hover:text-primary"
                  >
                    {studioBusiness.email}
                  </a>
                </dd>
              </div>
              <div className="grid grid-cols-[5rem_1fr] gap-3">
                <dt className="text-muted-foreground">협업</dt>
                <dd className="font-semibold text-foreground">
                  {studioBusiness.location}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} TORIS. All rights reserved.</p>
          <p>Design · Development · Launch</p>
        </div>
      </div>
    </footer>
  );
}
