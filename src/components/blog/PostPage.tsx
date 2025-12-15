'use client';

import { MarkdownViewer } from '@/components/blog/Markdown';
import { FaCalendarAlt, FaFolder, FaTags } from '@/components/icons';
import dayjs from 'dayjs';
import Link from 'next/link';
import { FC, useState, useEffect } from 'react';
import { Utterances } from './Utterances';
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

  useEffect(() => {
    setMounted(true);
  }, []);

  // 날짜 포맷팅 (서버와 클라이언트에서 동일한 결과 보장)
  const formattedDate = date
    ? dayjs(new Date(date)).format('YY년 MM월 DD일 HH:mm')
    : '';

  return (
    <div className="w-full">
      <div className="mx-auto flex w-full max-w-full flex-col gap-4 lg:max-w-7xl lg:flex-row lg:items-stretch lg:gap-6 xl:gap-8">
        {/* 메인 콘텐츠 */}
        <article className="min-w-0 flex-1 px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8 xl:pb-32">
          <div className="mx-auto w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl">
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

              <div className="prose max-w-full dark:prose-invert">
                <MarkdownViewer onHeadingsChange={setHeadings}>
                  {content}
                </MarkdownViewer>
              </div>

              {mounted && (
                <div className="mt-8 sm:mt-10 md:mt-12">
                  <Utterances repo="toris-dev/Toris_Blog" />
                </div>
              )}
            </div>
          </div>
        </article>

        {/* 목차 사이드바 (데스크톱에서만 표시) */}
        {mounted && headings.length > 0 && (
          <aside className="hidden shrink-0 lg:block lg:w-56 xl:w-64 2xl:w-72">
            <div className="sticky top-24 h-full max-h-[calc(100vh-8rem)] space-y-6 overflow-y-auto">
              <TableOfContents headings={headings} />
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
