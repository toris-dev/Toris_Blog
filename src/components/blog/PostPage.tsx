'use client';

import { MarkdownViewer } from '@/components/blog/Markdown';
import {
  FaCalendarAlt,
  FaFolder,
  FaTags
} from '@/components/icons';
import { cn } from '@/utils/style';
import dayjs from 'dayjs';
import Link from 'next/link';
import { FC, useState, useEffect, useRef, useMemo } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent
} from 'framer-motion';
import { Utterances } from './Utterances';
import { ShareButtons } from './ShareButtons';
import { CommentSection } from './CommentSection';
import { PostViewCount } from './PostViewCount';
import { ReadingTime } from './ReadingTime';
import { PostSeries } from './PostSeries';
import { RelatedPosts } from './RelatedPosts';
import { AdSense } from '@/components/ads/AdSense';
import {
  PostHeadingsProvider,
  usePostHeadings
} from '@/contexts/PostHeadingsContext';
import { TableOfContents } from '@/components/blog/TableOfContents';

import { SeriesMetadata } from '@/utils/postSeries';
import { BookmarkButton } from './BookmarkButton';
import { PostLikeButton } from './PostLikeButton';
import { Post } from '@/types';

// 마크다운 파일에서 가져올 때 사용할 인터페이스에 맞게 props를 수정합니다
const PostPageContent: FC<{
  title: string;
  category?: string;
  tags?: string[];
  content: string;
  date?: string;
  image?: string;
  postId: number | string;
  series?: SeriesMetadata;
  relatedPosts?: Post[];
}> = ({
  title,
  category = 'Uncategorized',
  tags = [],
  content,
  date,
  image,
  postId,
  series,
  relatedPosts = []
}) => {
  const { setHeadings, headings } = usePostHeadings();
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 스크롤 이벤트 핸들러 최적화: debounce 적용 및 불필요한 상태 업데이트 방지
  // isHeaderVisible은 사용되지 않으므로 제거하고, 스크롤 이벤트만 최소한으로 처리
  useMotionValueEvent(scrollY, 'change', (latest) => {
    // 기존 timeout 제거
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // 마지막 스크롤 위치 저장
    const previousScrollY = lastScrollY.current;
    lastScrollY.current = latest;

    // debounce 적용 (100ms 후 실행) - 불필요한 리렌더링 방지
    debounceTimeoutRef.current = setTimeout(() => {
      // 현재는 isHeaderVisible을 사용하지 않으므로 상태 업데이트 제거
      // 필요시 여기에 스크롤 관련 로직 추가 가능
    }, 100);
  });

  // 컴포넌트 언마운트 시 timeout 정리
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);


  // 날짜 포맷팅 (서버와 클라이언트에서 동일한 결과 보장)
  const formattedDate = useMemo(
    () => (date ? dayjs(new Date(date)).format('YY년 MM월 DD일 HH:mm') : ''),
    [date]
  );

  // 스타일 객체 메모이제이션
  const containerStyle = useMemo(
    () => ({
      maxWidth: '100%',
      width: '100%',
      boxSizing: 'border-box' as const
    }),
    []
  );

  const articleInnerStyle = useMemo(
    () => ({
      maxWidth: '100%',
      width: '100%',
      boxSizing: 'border-box' as const
    }),
    []
  );

  const proseStyle = useMemo(
    () => ({
      maxWidth: '100%',
      width: '100%',
      minWidth: 0,
      boxSizing: 'border-box' as const
    }),
    []
  );

  const stickyStyle = useMemo(
    () => ({
      position: 'sticky' as const,
      top: '6rem', // layout의 main pt-24 (6rem)와 동일한 위치
      maxHeight: 'calc(100vh - 6rem)',
      zIndex: 10
    }),
    []
  );

  // ShareButtons에 전달할 URL 메모이제이션
  const shareUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return `${process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app'}/posts/${postId}`;
  }, [postId]);

  const shareDescription = useMemo(() => {
    if (typeof content === 'string') {
      return content.substring(0, 150).replace(/\n/g, ' ').trim();
    }
    return undefined;
  }, [content]);

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div
        className="mx-auto flex w-full max-w-full flex-col gap-3 px-4 sm:gap-4 sm:px-6 md:gap-6 md:px-8 lg:flex-row lg:items-start lg:gap-6 lg:px-6 xl:gap-8 xl:px-8"
        suppressHydrationWarning
        style={containerStyle}
      >
        {/* 메인 콘텐츠 */}
        <article className="min-w-0 max-w-full flex-1 overflow-x-hidden pb-12 sm:pb-16 md:pb-20 lg:pb-24 xl:pb-32">
          <div
            className="mx-auto w-full max-w-full overflow-x-hidden sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl"
            suppressHydrationWarning
            style={articleInnerStyle}
          >
            <div>
              {/* 상단 영역: 헤더와 공유하기 버튼 */}
              <div className="my-6 w-full sm:my-8 md:my-10 lg:my-12">
                <header className="mb-6 text-center sm:mb-8">
                  <h1 className="mb-3 text-xl font-bold leading-tight text-foreground sm:mb-4 sm:text-2xl md:text-3xl lg:text-4xl">
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
                    {mounted && (
                      <>
                        <PostViewCount
                          postId={postId.toString()}
                          className="text-xs sm:text-sm"
                        />
                        <ReadingTime
                          content={content}
                          className="text-xs sm:text-sm"
                        />
                      </>
                    )}
                  </div>
                </header>

                {mounted && (
                  <div className="flex items-center justify-between border-y border-border py-6">
                    <ShareButtons
                      title={title}
                      description={shareDescription}
                      image={image}
                      url={shareUrl}
                    />
                    <div className="flex items-center gap-2">
                      <BookmarkButton
                        postId={postId.toString()}
                        title={title}
                        variant="icon"
                      />
                      <PostLikeButton postId={postId.toString()} />
                    </div>
                  </div>
                )}
              </div>

              {/* 시리즈 네비게이션 */}
              {series && (
                <PostSeries
                  series={series}
                  currentPost={{
                    id: typeof postId === 'number' ? postId : 0,
                    slug: postId.toString(),
                    title,
                    content,
                    category: category || 'Uncategorized',
                    tags,
                    date: date || '',
                    filePath: ''
                  }}
                />
              )}

              {/* 목차 (모든 화면 크기에서 표시) */}
              {mounted && headings.length > 0 && (
                <div className="mb-6">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">
                        목차
                      </h3>
                    </div>
                    <TableOfContents headings={headings} />
                  </div>
                </div>
              )}

              {/* 콘텐츠 뷰어 */}
              <div
                className={cn(
                  'min-w-0 flex-1 prose prose-sm max-w-full dark:prose-invert sm:prose-sm md:prose-base lg:prose-base xl:prose-lg',
                  // Prose의 max-width 제한 완전히 제거
                  'prose-img:!w-full prose-img:!max-w-full',
                  'prose-pre:!w-full prose-pre:!min-w-0 prose-pre:!max-w-full prose-pre:!overflow-x-auto',
                  'prose-code:!break-words',
                  // Mermaid 컨테이너 스타일 (CSS 모듈 클래스는 직접 CSS에서 처리)
                  // CodeBlock 스타일
                  '[&_div[data-code-block="true"]]:!w-full [&_div[data-code-block="true"]]:!min-w-0 [&_div[data-code-block="true"]]:!max-w-full',
                  '[&_div[data-code-block="true"]_div]:!min-w-0 [&_div[data-code-block="true"]_div]:!overflow-x-auto'
                )}
                style={proseStyle}
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
                <>
                  <div className="mt-6 sm:mt-8 md:mt-10 lg:mt-12">
                    <Utterances repo="toris-dev/Toris_Blog" />
                  </div>

                  {/* 댓글 섹션 */}
                  <div className="mt-12">
                    <CommentSection postId={postId.toString()} />
                  </div>

                  {/* 관련 포스트 */}
                  {relatedPosts.length > 0 && (
                    <RelatedPosts posts={relatedPosts} currentPostId={postId} />
                  )}
                </>
              )}
            </div>
          </div>
        </article>

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
