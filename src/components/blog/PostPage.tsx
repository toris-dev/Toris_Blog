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
import { createPortal } from 'react-dom';

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
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 모바일 목차 모달 닫기 (ESC 키)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileTocOpen) {
        setIsMobileTocOpen(false);
      }
    };

    if (isMobileTocOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileTocOpen]);

  // 날짜 포맷팅 (서버와 클라이언트에서 동일한 결과 보장)
  const formattedDate = date
    ? dayjs(new Date(date)).format('YY년 MM월 DD일 HH:mm')
    : '';

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div
        className="mx-auto flex w-full max-w-full flex-col gap-3 px-4 sm:gap-4 sm:px-6 md:gap-6 md:px-8 lg:flex-row lg:items-stretch lg:gap-6 lg:px-6 xl:gap-8 xl:px-8"
        suppressHydrationWarning
        style={{ maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}
      >
        {/* 메인 콘텐츠 */}
        <article className="min-w-0 flex-1 pb-12 sm:pb-16 md:pb-20 lg:pb-24 xl:pb-32 max-w-full overflow-x-hidden">
          <div
            className="mx-auto w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl overflow-x-hidden"
            suppressHydrationWarning
            style={{ maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}
          >
            <div>
              <header className="mb-6 text-center sm:mb-8 md:mb-10 lg:mb-12">
                <h1 className="mb-3 text-2xl font-bold leading-tight text-foreground sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl">
                  {title}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:gap-3 sm:text-sm md:gap-4">
                  <span className="flex items-center text-muted-foreground">
                    <FaCalendarAlt className="mr-1 sm:mr-1.5 md:mr-2" />
                    {formattedDate}
                  </span>
                  <Link
                    href={`/categories/${category}`}
                    className="flex items-center text-muted-foreground transition-all hover:scale-105 hover:text-primary"
                  >
                    <FaFolder className="mr-1 sm:mr-1.5 md:mr-2" />
                    {category}
                  </Link>
                  <div className="flex items-center gap-1.5 text-muted-foreground sm:gap-2">
                    <FaTags className="mr-1 sm:mr-1.5 md:mr-2" />
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
                                <span className="mx-0.5 sm:mx-1">,</span>
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
                                      <span className="mx-0.5 sm:mx-1">,</span>
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
                <div className="mb-6 sm:mb-8 md:mb-10">
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
                </div>
              )}

              <div
                className={cn(
                  'prose prose-sm max-w-full dark:prose-invert sm:prose-base md:prose-lg lg:prose-lg xl:prose-xl',
                  // Prose의 max-width 제한 완전히 제거
                  'prose-img:!max-w-full prose-img:!w-full',
                  'prose-pre:!max-w-full prose-pre:!w-full prose-pre:!overflow-x-auto prose-pre:!min-w-0',
                  'prose-code:!break-words',
                  // Mermaid 컨테이너 스타일 (CSS 모듈 클래스는 직접 CSS에서 처리)
                  // CodeBlock 스타일
                  '[&_div[data-code-block="true"]]:!max-w-full [&_div[data-code-block="true"]]:!w-full [&_div[data-code-block="true"]]:!min-w-0',
                  '[&_div[data-code-block="true"]_div]:!overflow-x-auto [&_div[data-code-block="true"]_div]:!min-w-0'
                )}
                style={{
                  // Prose의 max-width를 완전히 오버라이드
                  maxWidth: '100%',
                  width: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box'
                }}
              >
                <MarkdownViewer onHeadingsChange={setHeadings}>
                  {content}
                </MarkdownViewer>
              </div>

              {/* 인라인 광고 */}
              {mounted &&
                process.env.NEXT_PUBLIC_ADSENSE_IN_ARTICLE_UNIT_ID && (
                  <div className="my-6 sm:my-8 md:my-10">
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
                <div className="mt-6 sm:mt-8 md:mt-10 lg:mt-12">
                  <Utterances repo="toris-dev/Toris_Blog" />
                </div>
              )}
            </div>
          </div>
        </article>

        {/* 목차 사이드바 (xl 이상에서만 표시) */}
        {mounted && headings.length > 0 && (
          <aside className="hidden shrink-0 xl:block xl:w-56 2xl:w-64">
            <div className="sticky top-24 h-full max-h-[calc(100vh-8rem)] space-y-4 overflow-y-auto xl:space-y-6">
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

      {/* 모바일 목차 플로팅 버튼 (xl 미만에서만 표시) */}
      {mounted && headings.length > 0 && typeof window !== 'undefined' && (
        <>
          {/* 플로팅 버튼 */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMobileTocOpen(true)}
            className="fixed bottom-20 right-4 z-40 flex items-center justify-center rounded-full bg-primary p-4 text-primary-foreground shadow-lg transition-all hover:bg-primary/90 xl:hidden"
            aria-label="목차 열기"
          >
            <AiOutlineMenu className="size-6" />
          </motion.button>

          {/* 모바일 목차 모달 */}
          {createPortal(
            <AnimatePresence>
              {isMobileTocOpen && (
                <>
                  {/* 배경 오버레이 */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    onClick={() => setIsMobileTocOpen(false)}
                  />

                  {/* 모달 컨텐츠 */}
                  <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-hidden rounded-t-2xl border-t border-border bg-card shadow-2xl xl:hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 헤더 */}
                    <div className="flex items-center justify-between border-b border-border bg-muted/30 p-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        목차
                      </h3>
                      <button
                        onClick={() => setIsMobileTocOpen(false)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        aria-label="목차 닫기"
                      >
                        <FaTimes className="size-5" />
                      </button>
                    </div>

                    {/* 목차 컨텐츠 */}
                    <div className="custom-scrollbar max-h-[calc(80vh-4rem)] overflow-y-auto p-4">
                      <TableOfContents headings={headings} />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>,
            document.body
          )}
        </>
      )}
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
