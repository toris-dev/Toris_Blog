'use client';

import { MarkdownViewer } from '@/components/blog/Markdown';
import {
  FaCalendarAlt,
  FaFolder,
  FaTags,
  FaTimes,
  AiOutlineMenu
} from '@/components/icons';
import { cn } from '@/utils/style';
import dayjs from 'dayjs';
import Link from 'next/link';
import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utterances } from './Utterances';
import { ShareButtons } from './ShareButtons';
import { AdSense } from '@/components/ads/AdSense';
import {
  PostHeadingsProvider,
  usePostHeadings
} from '@/contexts/PostHeadingsContext';
import { TableOfContents } from '@/components/blog/TableOfContents';

// 마크다운 파일에서 가져올 때 사용할 인터페이스에 맞게 props를 수정합니다
const PostPageContent: FC<{
  title: string;
  category?: string;
  tags?: string[];
  content: string;
  date?: string;
  image?: string;
  postId: number | string;
}> = ({
  title,
  category = 'Uncategorized',
  tags = [],
  content,
  date,
  image,
  postId
}) => {
  const { setHeadings, headings } = usePostHeadings();
  const [mounted, setMounted] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 날짜 포맷팅 (서버와 클라이언트에서 동일한 결과 보장)
  const formattedDate = date
    ? dayjs(new Date(date)).format('YY년 MM월 DD일 HH:mm')
    : '';

  return (
    <div className="w-full">
      <div
        className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6 xl:gap-8"
        suppressHydrationWarning
      >
        {/* 메인 콘텐츠 */}
        <article className="min-w-0 flex-1 pb-16 sm:pb-24 xl:pb-32">
          <div
            className="mx-auto w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl"
            suppressHydrationWarning
          >
            <div>
              <header className="mb-8 text-center sm:mb-10 md:mb-12">
                <h1 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
                  {title}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:gap-4 sm:text-sm">
                  <span className="flex items-center text-muted-foreground">
                    <FaCalendarAlt className="mr-1.5 sm:mr-2" />
                    {formattedDate}
                  </span>
                  <Link
                    href={`/categories/${category}`}
                    className="flex items-center text-muted-foreground transition-all hover:scale-105 hover:text-primary"
                  >
                    <FaFolder className="mr-1.5 sm:mr-2" />
                    {category}
                  </Link>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FaTags className="mr-1.5 sm:mr-2" />
                    <div className="flex flex-wrap items-center gap-1">
                      {Array.isArray(tags)
                        ? tags.map((tag, index) => (
                            <span key={index} className="flex items-center">
                              <Link
                                href={`/tags/${encodeURIComponent(tag)}`}
                                className="transition-all hover:scale-105 hover:text-primary"
                              >
                                #{tag}
                              </Link>
                              {index < tags.length - 1 && (
                                <span className="mx-1">,</span>
                              )}
                            </span>
                          ))
                        : typeof tags === 'string'
                          ? (tags as string)
                              .split(',')
                              .map((tag: string, index: number) => {
                                const trimmedTag = tag.trim();
                                if (!trimmedTag) return null;
                                const tagArray = (tags as string).split(',');
                                return (
                                  <span
                                    key={index}
                                    className="flex items-center"
                                  >
                                    <Link
                                      href={`/tags/${encodeURIComponent(trimmedTag)}`}
                                      className="transition-all hover:scale-105 hover:text-primary"
                                    >
                                      #{trimmedTag}
                                    </Link>
                                    {index < tagArray.length - 1 && (
                                      <span className="mx-1">,</span>
                                    )}
                                  </span>
                                );
                              })
                          : null}
                    </div>
                  </div>
                </div>
              </header>

              {mounted && (
                <ShareButtons
                  title={title}
                  description={
                    typeof content === 'string'
                      ? content.substring(0, 150).replace(/\n/g, ' ').trim()
                      : undefined
                  }
                  image={image}
                  url={
                    typeof window !== 'undefined'
                      ? window.location.href
                      : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app'}/posts/${postId}`
                  }
                />
              )}

              <div
                className={cn(
                  'prose max-w-full dark:prose-invert',
                  mounted &&
                    'prose-lg [&_.mermaidContainer]:!max-w-full [&_.mermaidContainer]:overflow-x-auto [&_.mermaidContainer_svg]:!max-w-full'
                )}
              >
                <MarkdownViewer onHeadingsChange={setHeadings}>
                  {content}
                </MarkdownViewer>
              </div>

              {/* 인라인 광고 */}
              {mounted &&
                process.env.NEXT_PUBLIC_ADSENSE_IN_ARTICLE_UNIT_ID && (
                  <div className="my-8">
                    <AdSense
                      adSlot={
                        process.env.NEXT_PUBLIC_ADSENSE_IN_ARTICLE_UNIT_ID
                      }
                      adFormat="auto"
                      fullWidthResponsive={true}
                      className="w-full"
                    />
                  </div>
                )}

              {mounted && (
                <div className="mt-8 sm:mt-10 md:mt-12">
                  <Utterances repo="toris-dev/Toris_Blog" />
                </div>
              )}
            </div>
          </div>
        </article>

        {/* 목차 사이드바 (xl 이상에서만 표시 - 왼쪽 사이드바가 있을 때도 표시) */}
        {mounted && headings.length > 0 && (
          <aside className="hidden shrink-0 xl:block xl:w-56 2xl:w-64">
            <div className="sticky top-24 h-full max-h-[calc(100vh-8rem)] space-y-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {isTocOpen ? (
                  <motion.div
                    key="toc"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">
                        목차
                      </h3>
                      <button
                        onClick={() => setIsTocOpen(false)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="목차 닫기"
                      >
                        <FaTimes className="size-4" />
                      </button>
                    </div>
                    <TableOfContents headings={headings} />
                  </motion.div>
                ) : (
                  <motion.button
                    key="toc-toggle"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setIsTocOpen(true)}
                    className="shadow-soft hover:shadow-medium w-full rounded-lg border border-border bg-card p-3 text-left text-sm font-medium text-foreground transition-all hover:bg-muted"
                    aria-label="목차 열기"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <AiOutlineMenu className="size-4" />
                        목차
                      </span>
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

const PostPage: FC<{
  title: string;
  category?: string;
  tags?: string[];
  content: string;
  date?: string;
  image?: string;
  postId: number | string;
}> = (props) => {
  return (
    <PostHeadingsProvider>
      <PostPageContent {...props} />
    </PostHeadingsProvider>
  );
};

export default PostPage;
