'use client';

import { MarkdownViewer } from '@/components/blog/Markdown';
import { FaCalendarAlt, FaFolder, FaTags } from '@/components/icons';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FC } from 'react';
import { Utterances } from './Utterances';

// 마크다운 파일에서 가져올 때 사용할 인터페이스에 맞게 props를 수정합니다
const PostPage: FC<{
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
  const formattedDate = dayjs(new Date(date || '')).format(
    'YY년 MM월 DD일 HH:mm'
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.42, 0, 0.58, 1] as const // easeOut cubic-bezier
      }
    }
  };

  return (
    <article className="mx-auto mt-12 max-w-4xl px-4 pb-32">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.header className="mb-12 text-center" variants={itemVariants}>
          <motion.h1
            className="neon-glow mb-4 text-4xl font-bold text-foreground"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {title}
          </motion.h1>
          <motion.div
            className="flex flex-wrap items-center justify-center gap-4"
            variants={itemVariants}
          >
            <motion.span
              className="flex items-center text-sm text-muted-foreground"
              whileHover={{ scale: 1.05 }}
            >
              <FaCalendarAlt className="mr-2" />
              {formattedDate}
            </motion.span>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                href={`/categories/${category}`}
                className="flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <FaFolder className="mr-2" />
                {category}
              </Link>
            </motion.div>
            <motion.span
              className="flex items-center text-sm text-muted-foreground"
              whileHover={{ scale: 1.05 }}
            >
              <FaTags className="mr-2" />
              {Array.isArray(tags)
                ? tags.join(', ')
                : typeof tags === 'string'
                  ? (tags as string)
                      .split(',')
                      .map((tag: string) => tag.trim())
                      .join(', ')
                  : ''}
            </motion.span>
          </motion.div>
        </motion.header>

        <motion.div
          className="prose max-w-full dark:prose-invert"
          variants={itemVariants}
        >
          <MarkdownViewer>{content}</MarkdownViewer>
        </motion.div>

        <div className="mt-12">
          <Utterances repo="toris-dev/Toris_Blog" />
        </div>
      </motion.div>
    </article>
  );
};

export default PostPage;
