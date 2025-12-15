'use client';

import { FaArrowRight } from '@/components/icons';
import { Post } from '@/types';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface PostsSectionProps {
  featuredPosts: Post[];
}

export default function PostsSection({ featuredPosts }: PostsSectionProps) {
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

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.42, 0, 0.58, 1] as const
      }
    }
  };

  return (
    <section className="px-4 py-16" aria-labelledby="latest-posts-heading">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mb-12 flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2
            id="latest-posts-heading"
            className="text-3xl font-bold text-foreground"
          >
            최신 포스트
          </h2>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/posts"
              className="inline-flex items-center text-primary transition-colors hover:text-primary/80"
              aria-label="모든 블로그 포스트 보기"
            >
              모든 포스트 보기
              <FaArrowRight className="ml-2 size-4" />
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {featuredPosts.map((post: Post, index: number) => (
            <motion.article
              key={post.slug}
              className="shadow-soft hover:shadow-medium group rounded-lg border border-border bg-card p-6 transition-all hover:bg-muted"
              variants={cardVariants}
              whileHover={{
                y: -8,
                rotateX: 5,
                rotateY: 5,
                transition: { duration: 0.3 }
              }}
              style={{ perspective: 1000 }}
            >
              <Link
                href={`/posts/${encodeURIComponent(post.slug)}`}
                className="block"
              >
                <div className="mb-4 flex items-center">
                  <motion.span
                    className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                    whileHover={{ scale: 1.1 }}
                  >
                    {post.category || 'Blog'}
                  </motion.span>
                </div>
                <h3 className="mb-2 text-xl font-semibold transition-colors group-hover:text-primary">
                  {post.title}
                </h3>
                <p className="line-clamp-2 text-foreground/70">
                  {post.description || post.content?.substring(0, 100) + '...'}
                </p>
                <time
                  className="mt-4 block text-sm text-muted-foreground"
                  dateTime={post.date}
                >
                  {dayjs(post.date).format('YYYY년 MM월 DD일')}
                </time>
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
