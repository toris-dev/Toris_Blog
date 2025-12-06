'use client';

import { FaArrowRight } from '@/components/icons';
import { SiNextDotJs } from '@/components/icons';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
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
        ease: [0.42, 0, 0.58, 1] as const
      }
    }
  };

  const scaleVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.42, 0, 0.58, 1] as const
      }
    }
  };

  return (
    <section className="relative px-4 py-20">
      <motion.div
        className="mx-auto max-w-4xl text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm text-primary"
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <SiNextDotJs className="mr-2 size-4" />
          개발 블로그
        </motion.div>

        <motion.h1
          className="mb-6 text-4xl font-bold tracking-tight md:text-6xl"
          variants={scaleVariants}
        >
          <span className="neon-glow animate-[gradient_3s_ease_infinite] bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] bg-clip-text text-transparent">
            토리스 블로그
          </span>
        </motion.h1>

        <motion.p
          className="mb-8 text-lg text-foreground md:text-xl"
          variants={itemVariants}
        >
          풀스택 웹 개발자 토리스의 기술 블로그
          <br />
          React, Next.js, TypeScript로 만드는 모던 웹 개발 이야기
        </motion.p>

        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:justify-center"
          variants={itemVariants}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/posts"
              className="neon-glow-animate inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-primary-foreground transition-all hover:bg-primary/90"
              aria-label="블로그 포스트 모아보기"
            >
              블로그 보기
              <FaArrowRight className="ml-2 size-4" />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/about"
              className="neon-border inline-flex items-center justify-center rounded-lg border border-primary/50 px-6 py-3 transition-all hover:border-primary hover:bg-primary/10"
              aria-label="토리스 소개 페이지"
            >
              소개
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
