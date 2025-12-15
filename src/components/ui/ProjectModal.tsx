'use client';

import {
  AiFillGithub,
  FaTimes,
  FaCode,
  FaCalendarAlt,
  FaUser,
  FaServer,
  FaArrowRight
} from '@/components/icons';
import { HiLightBulb, HiBriefcase, HiBadgeCheck } from '@/components/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    name: string;
    period: string;
    team?: string;
    description: string;
    role?: string[];
    techStack: string[];
    achievements?: string[];
    learnings?: string[];
    features?: string[];
    github?: string;
    demo?: string;
    link?: string | null;
    isDeveloping?: boolean;
  };
  type: 'company' | 'personal';
}

export default function ProjectModal({
  isOpen,
  onClose,
  project,
  type
}: ProjectModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* 모달 컨텐츠 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300
            }}
            className="relative z-10 max-h-[90vh] w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {/* 개발중 배지 - 모달 상단 */}
              {project.isDeveloping && (
                <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
                  <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full border-2 border-yellow-500 bg-yellow-500/90 px-4 py-1.5 text-sm font-bold text-yellow-950 shadow-[0_0_15px_rgba(234,179,8,0.6)] backdrop-blur-sm">
                    🔨 개발중
                  </span>
                </div>
              )}
              <div
                className={`shadow-large relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card ${
                  project.isDeveloping
                    ? 'border-yellow-500/80 shadow-[0_0_30px_rgba(234,179,8,0.2)]'
                    : ''
                }`}
              >
                {/* 헤더 */}
                <div className="shrink-0 border-b border-border bg-muted/30 px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <h2 className="truncate text-2xl font-bold text-foreground">
                          {project.name}
                        </h2>
                        {type === 'company' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            <HiBriefcase className="size-3" />
                            회사
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                            <FaUser className="size-3" />
                            개인
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {project.period && (
                          <div className="flex items-center gap-1.5">
                            <FaCalendarAlt className="size-3.5" />
                            <span>{project.period}</span>
                          </div>
                        )}
                        {project.team && (
                          <div className="flex items-center gap-1.5">
                            <FaUser className="size-3.5" />
                            <span>{project.team}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="닫기"
                    >
                      <FaTimes className="size-5" />
                    </button>
                  </div>
                </div>

                {/* 스크롤 가능한 컨텐츠 */}
                <div className="custom-scrollbar flex-1 overflow-y-auto">
                  <div className="p-6">
                    {/* 프로젝트 소개 */}
                    <section className="mb-8">
                      <h3 className="sticky top-0 z-20 flex items-center gap-2 bg-card pb-3 text-lg font-semibold text-foreground">
                        <HiBriefcase className="size-4 text-primary" />
                        프로젝트 소개
                      </h3>
                      <div className="pt-4">
                        <p className="whitespace-pre-wrap break-words leading-relaxed text-foreground/90">
                          {project.description}
                        </p>
                      </div>
                    </section>

                    {/* 구분선 */}
                    <div className="my-8 border-t border-border" />

                    {/* 기술 스택 */}
                    <section className="mb-8">
                      <h3 className="sticky top-0 z-20 flex items-center gap-2 bg-card pb-3 text-lg font-semibold text-foreground">
                        <FaCode className="size-4 text-accent" />
                        기술 스택
                      </h3>
                      <div className="flex flex-wrap gap-2 pt-4">
                        {project.techStack.map((tech, index) => (
                          <span
                            key={index}
                            className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </section>

                    {/* 주요 업무 */}
                    {project.role && project.role.length > 0 && (
                      <>
                        {/* 구분선 */}
                        <div className="my-8 border-t border-border" />
                        <section className="mb-8">
                          <h3 className="sticky top-0 z-20 flex items-center gap-2 bg-card pb-3 text-lg font-semibold text-foreground">
                            <FaCode className="size-4 text-primary" />
                            주요 업무
                          </h3>
                          <div className="pt-4">
                            <ul className="space-y-2">
                              {project.role.map((role, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-3"
                                >
                                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                                  <span className="flex-1 break-words text-sm text-foreground/90">
                                    {role}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </section>
                      </>
                    )}

                    {/* 주요 기능 */}
                    {project.features && project.features.length > 0 && (
                      <>
                        {/* 구분선 */}
                        <div className="my-8 border-t border-border" />
                        <section className="mb-8">
                          <h3 className="sticky top-0 z-20 flex items-center gap-2 bg-card pb-3 text-lg font-semibold text-foreground">
                            <FaServer className="size-4 text-accent" />
                            주요 기능
                          </h3>
                          <div className="pt-4">
                            <ul className="space-y-2">
                              {project.features.map((feature, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-3"
                                >
                                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                                  <span className="flex-1 break-words text-sm text-foreground/90">
                                    {feature}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </section>
                      </>
                    )}

                    {/* 주요 성과 */}
                    {project.achievements &&
                      project.achievements.length > 0 && (
                        <>
                          {/* 구분선 */}
                          <div className="my-8 border-t border-border" />
                          <section className="mb-8">
                            <h3 className="sticky top-0 z-20 flex items-center gap-2 bg-card pb-3 text-lg font-semibold text-foreground">
                              <HiBadgeCheck className="size-4 text-yellow-600 dark:text-yellow-500" />
                              주요 성과
                            </h3>
                            <div className="grid gap-3 pt-4 sm:grid-cols-2">
                              {project.achievements.map(
                                (achievement, index) => (
                                  <div
                                    key={index}
                                    className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4"
                                  >
                                    <p className="break-words text-sm font-medium text-foreground">
                                      {achievement}
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </section>
                        </>
                      )}

                    {/* 느낀 점 */}
                    {project.learnings && project.learnings.length > 0 && (
                      <>
                        {/* 구분선 */}
                        <div className="my-8 border-t border-border" />
                        <section className="mb-8">
                          <h3 className="sticky top-0 z-20 flex items-center gap-2 bg-card pb-3 text-lg font-semibold text-foreground">
                            <HiLightBulb className="size-4 text-yellow-600 dark:text-yellow-500" />
                            느낀 점
                          </h3>
                          <div className="space-y-3 pt-4">
                            {project.learnings.map((learning, index) => (
                              <div
                                key={index}
                                className="rounded-lg border-l-4 border-primary bg-muted/50 p-4"
                              >
                                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
                                  {learning}
                                </p>
                              </div>
                            ))}
                          </div>
                        </section>
                      </>
                    )}
                  </div>
                </div>

                {/* 하단 버튼 */}
                {(project.github || project.demo || project.link) && (
                  <div className="flex shrink-0 gap-3 border-t border-border bg-muted/30 px-6 py-4">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <AiFillGithub className="size-5" />
                        GitHub
                      </a>
                    )}
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <FaArrowRight className="size-4" />
                        사이트 보기
                      </a>
                    )}
                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <FaArrowRight className="size-4" />
                        사이트 보기
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
