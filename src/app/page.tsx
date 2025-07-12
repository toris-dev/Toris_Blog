import {
  FaArrowRight,
  FaCode,
  FaReact,
  FaServer,
  SiNextDotJs
} from '@/components/icons';
import StructuredData from '@/components/seo/StructuredData';
import { Post } from '@/types';
import { getPostData } from '@/utils/markdown';
import { cn } from '@/utils/style';
import dayjs from 'dayjs';
import Link from 'next/link';

// 6시간마다 재생성
export const revalidate = 21600;

export default function Home() {
  const posts = getPostData();
  const featuredPosts = posts.slice(0, 3);

  const techStack = [
    { name: 'Next.js', icon: SiNextDotJs, color: 'bg-gray-800' },
    { name: 'React', icon: FaReact, color: 'bg-sky-500' },
    { name: 'TypeScript', icon: FaCode, color: 'bg-blue-600' },
    { name: 'Full Stack', icon: FaServer, color: 'bg-green-600' }
  ];

  return (
    <>
      <StructuredData type="website" />
      <StructuredData type="person" />

      <div>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-background to-background/95 px-4 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <SiNextDotJs className="mr-2 size-4" />
              개발 블로그
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                토리스 블로그
              </span>
            </h1>

            <p className="mb-8 text-lg text-foreground/70 md:text-xl">
              풀스택 웹 개발자 토리스의 기술 블로그
              <br />
              React, Next.js, TypeScript로 만드는 모던 웹 개발 이야기
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/posts"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
                aria-label="블로그 포스트 모아보기"
              >
                블로그 보기
                <FaArrowRight className="ml-2 size-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-6 py-3 transition-colors hover:bg-accent"
                aria-label="토리스 소개 페이지"
              >
                소개
              </Link>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="px-4 py-16" aria-labelledby="tech-stack-heading">
          <div className="mx-auto max-w-6xl">
            <h2
              id="tech-stack-heading"
              className="mb-12 text-center text-3xl font-bold"
            >
              주요 기술 스택
            </h2>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {techStack.map((tech) => (
                <div key={tech.name} className="flex flex-col items-center">
                  <div
                    className={cn(
                      'mb-4 flex size-16 items-center justify-center rounded-full text-white',
                      tech.color
                    )}
                    aria-label={`${tech.name} 기술`}
                  >
                    <tech.icon className="size-8" />
                  </div>
                  <h3 className="text-lg font-semibold">{tech.name}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Latest Posts */}
        <section className="px-4 py-16" aria-labelledby="latest-posts-heading">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 flex items-center justify-between">
              <h2 id="latest-posts-heading" className="text-3xl font-bold">
                최신 포스트
              </h2>
              <Link
                href="/posts"
                className="inline-flex items-center text-primary hover:text-primary/80"
                aria-label="모든 블로그 포스트 보기"
              >
                모든 포스트 보기
                <FaArrowRight className="ml-2 size-4" />
              </Link>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredPosts.map((post: Post) => (
                <article
                  key={post.slug}
                  className="group rounded-lg border border-border bg-card p-6 transition-colors hover:bg-accent"
                >
                  <Link href={`/posts/${post.slug}`} className="block">
                    <div className="mb-4 flex items-center">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                        {post.category || 'Blog'}
                      </span>
                    </div>
                    <h3 className="mb-2 text-xl font-semibold group-hover:text-primary">
                      {post.title}
                    </h3>
                    <p className="line-clamp-2 text-foreground/70">
                      {post.description ||
                        post.content?.substring(0, 100) + '...'}
                    </p>
                    <time
                      className="mt-4 block text-sm text-foreground/60"
                      dateTime={post.date}
                    >
                      {dayjs(post.date).format('YYYY년 MM월 DD일')}
                    </time>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
