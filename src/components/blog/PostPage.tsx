'use client';

import { MarkdownViewer } from '@/components/blog/Markdown';
import { FaCalendarAlt, FaFolder, FaTags } from '@/components/icons';
import { cn } from '@/utils/style';
import dayjs from 'dayjs';
import Link from 'next/link';
import { FC, useState, useEffect, useMemo } from 'react';
import { motion, useScroll } from 'framer-motion';
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
  // 읽기 진행바 — 페이지 스크롤 진행률
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    setMounted(true);
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
    // overflow-x-clip (NOT -hidden): overflow-x:hidden은 브라우저가
    // overflow-y를 auto로 강제해 이 래퍼가 스크롤 컨테이너가 되고,
    // 그러면 내부 목차의 position:sticky가 뷰포트가 아닌 이 컨테이너
    // 기준이 되어 스크롤을 따라오지 못한다. clip은 이 강제가 없다.
    <div className="w-full max-w-full overflow-x-clip">
      {/* 읽기 진행바 */}
      <motion.div
        aria-hidden
        className="fixed inset-x-0 top-16 z-40 h-0.5 origin-left bg-gradient-to-r from-primary to-secondary"
        style={{ scaleX: scrollYProgress }}
      />
      <div
        className="mx-auto flex w-full max-w-full flex-col gap-3 px-4 sm:gap-4 sm:px-6 md:gap-6 md:px-8 lg:flex-row lg:items-start lg:gap-6 lg:px-6 xl:gap-8 xl:px-8"
        suppressHydrationWarning
        style={containerStyle}
      >
        {/* 메인 콘텐츠 */}
        <article className="min-w-0 max-w-full flex-1 overflow-x-clip pb-16 md:pb-24">
          <div
            className="mx-auto w-full max-w-full overflow-x-clip sm:max-w-2xl md:max-w-3xl"
            suppressHydrationWarning
            style={articleInnerStyle}
          >
            <div>
              {/* 상단 영역: 헤더와 공유하기 버튼 */}
              <div className="my-6 w-full sm:my-8">
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
                                        <span className="mx-0.5 sm:mx-1">
                                          ,
                                        </span>
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

              {/* 목차 — 모바일/태블릿: 접이식, 데스크톱: 우측 고정 레일 */}
              {mounted && headings.length > 0 && (
                <details className="group mb-6 xl:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                    목차
                    <svg
                      aria-hidden
                      viewBox="0 0 20 20"
                      fill="none"
                      className="size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                    >
                      <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </summary>
                  <div className="rounded-b-lg border-x border-b border-border bg-card px-4 py-3">
                    <TableOfContents headings={headings} />
                  </div>
                </details>
              )}

              {/* 콘텐츠 뷰어 */}
              <div
                className={cn(
                  // 기기 공통 본문 16px(prose-base) — 과도한 업스케일 제거
                  'prose prose-base min-w-0 max-w-full flex-1 dark:prose-invert',
                  // 제목 스케일 축소: 모바일에서 h1 24px, 데스크톱 30px
                  'prose-h1:text-2xl sm:prose-h1:text-3xl',
                  'prose-h2:mb-4 prose-h2:mt-10 prose-h2:text-xl sm:prose-h2:text-2xl',
                  'prose-h3:text-lg sm:prose-h3:text-xl',
                  'prose-p:leading-relaxed',
                  // 앵커 이동 시 고정 헤더에 가리지 않게
                  'prose-headings:scroll-mt-28',
                  // 이미지: 원본 비율 유지 + 중앙 정렬 (강제 풀폭 제거 — 렌더러의 max-h 600px 유지)
                  'prose-img:mx-auto prose-img:size-auto prose-img:max-w-full prose-img:rounded-xl',
                  // 비디오/유튜브 임베드: 16:9 반응형 + 세로 제한
                  '[&_iframe]:mx-auto [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:w-full [&_iframe]:max-w-2xl [&_iframe]:rounded-xl',
                  '[&_video]:mx-auto [&_video]:max-h-[60vh] [&_video]:w-auto [&_video]:max-w-full [&_video]:rounded-xl',
                  'prose-pre:!w-full prose-pre:!min-w-0 prose-pre:!max-w-full prose-pre:!overflow-x-auto',
                  'prose-code:!break-words',
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

        {/* 데스크톱 목차 레일 — flow 안 sticky 컬럼.
            fixed 대신 flex 형제 + sticky로 두어야 (1) 스크롤 시 뷰포트를
            따라오고 (2) 우측 공간을 실제로 차지해 본문 좌측 여백이 줄어든다. */}
        {mounted && headings.length > 0 && (
          <nav
            aria-label="목차"
            // self-stretch: flex 부모의 items-start 때문에 nav가 목차 높이로
            // 축소되면, 그 안의 sticky 요소가 부모 경계에 갇혀 붙지 못한다.
            // 부모(article) 높이만큼 늘려야 sticky가 스크롤 내내 작동한다.
            className="hidden w-64 shrink-0 self-stretch xl:block"
          >
            <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                목차
              </h3>
              <TableOfContents headings={headings} />
            </div>
          </nav>
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
