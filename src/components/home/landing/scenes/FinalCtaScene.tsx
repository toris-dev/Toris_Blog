'use client';

import Link from 'next/link';
import {
  FaArrowRight,
  FaBlog,
  FaFolderOpen,
  FaPaperPlane
} from '@/components/icons';
import { Reveal } from '../ui';

const CTAS = [
  { href: '/posts', label: 'Read Latest Posts', Icon: FaBlog, primary: true },
  { href: '/projects', label: 'Explore Projects', Icon: FaFolderOpen, primary: false },
  { href: '/contact', label: 'Contact Me', Icon: FaPaperPlane, primary: false }
];

export default function FinalCtaScene() {
  return (
    <section
      className="relative overflow-hidden px-4 py-28 sm:py-36"
      aria-label="블로그 소개 마무리"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-[130px]" />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">
            A Living Portfolio
          </p>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            단순한 블로그가 아닙니다.
            <br />
            <span className="bg-gradient-to-r from-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
              배우고, 만들고, 디버깅하고, 배포한 기록입니다.
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            This is not only a blog. It is a record of what I learn, build,
            debug, and ship — 계속 자라는 개발자의 아카이브.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {CTAS.map(({ href, label, Icon, primary }) => (
            <Link
              key={href}
              href={href}
              className={
                primary
                  ? 'group inline-flex items-center gap-2 rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-colors hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300'
                  : 'group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300'
              }
            >
              <Icon className="size-4" />
              {label}
              <FaArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
