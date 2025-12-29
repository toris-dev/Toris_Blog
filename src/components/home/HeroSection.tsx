'use client';

import { FaArrowRight } from '@/components/icons';
import { SiNextDotJs } from '@/components/icons';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function HeroSection() {
  const [displayText, setDisplayText] = useState('');
  const fullText = 'Toris Blog';
  const [isTyping, setIsTyping] = useState(true);
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

  // 타이핑 애니메이션
  useEffect(() => {
    if (!isTyping) return;

    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 100); // 각 글자마다 100ms 간격

    return () => clearInterval(typingInterval);
  }, [isTyping, fullText]);

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
          className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl"
          variants={scaleVariants}
        >
          {displayText}
          {isTyping && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
            >
              |
            </motion.span>
          )}
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
              className="shadow-soft hover:shadow-medium inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90"
              aria-label="블로그 포스트 모아보기"
            >
              블로그 보기
              <FaArrowRight className="ml-2 size-4" />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/about"
              className="shadow-soft hover:shadow-medium inline-flex items-center justify-center rounded-lg border border-border bg-card px-6 py-3 font-medium transition-all hover:border-primary hover:bg-primary/10"
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
