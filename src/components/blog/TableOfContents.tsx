'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from '@/styles/markdown.module.css';

// SSR과 클라이언트 hydration mismatch 방지를 위한 유틸리티
const useIsMounted = () => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  return isMounted;
};

export interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
  className?: string;
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  headings,
  className,
  scrollContainerRef
}) => {
  const [activeId, setActiveId] = useState<string>('');
  const isScrollingRef = useRef(false);
  const isMounted = useIsMounted();
  const activeItemRef = useRef<HTMLButtonElement | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingAnimationRef = useRef(false);

  // 스크롤 시 현재 활성화된 헤딩 감지
  useEffect(() => {
    if (headings.length === 0) return;

    const observerOptions = {
      rootMargin: '-20% 0% -35% 0%',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, observerOptions);

    // 모든 헤딩 요소 관찰
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);

  // 활성화된 목차 항목이 자동으로 보이도록 스크롤
  useEffect(() => {
    if (!activeId || !activeItemRef.current) return;
    if (isScrollingRef.current) return; // 사용자가 클릭한 경우 스크롤하지 않음
    if (isScrollingAnimationRef.current) return; // 스크롤 애니메이션 중에는 추가 스크롤 방지

    // 기존 timeout 제거 (debounce)
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // debounce 적용 (100ms)
    scrollTimeoutRef.current = setTimeout(() => {
      const activeButton = activeItemRef.current;
      if (!activeButton) return;

      // scrollContainerRef가 제공되면 직접 사용, 없으면 부모 요소에서 찾기
      let scrollContainer: HTMLElement | null = null;

      if (scrollContainerRef?.current) {
        scrollContainer = scrollContainerRef.current;
      } else {
        // 가장 가까운 스크롤 가능한 부모 요소 찾기 (기존 로직)
        scrollContainer = activeButton.parentElement;
        while (scrollContainer) {
          const style = window.getComputedStyle(scrollContainer);
          if (
            scrollContainer.scrollHeight > scrollContainer.clientHeight &&
            (style.overflowY === 'auto' || style.overflowY === 'scroll')
          ) {
            break;
          }
          scrollContainer = scrollContainer.parentElement;
        }
      }

      // 스크롤 컨테이너가 있으면 해당 컨테이너 기준으로 확인
      if (scrollContainer) {
        // requestAnimationFrame을 사용하여 부드러운 스크롤 처리
        requestAnimationFrame(() => {
          const containerRect = scrollContainer!.getBoundingClientRect();
          const buttonRect = activeButton.getBoundingClientRect();

          // 항목이 컨테이너 뷰포트 밖에 있으면 스크롤
          if (
            buttonRect.top < containerRect.top ||
            buttonRect.bottom > containerRect.bottom
          ) {
            isScrollingAnimationRef.current = true;

            // 목차 컨테이너 내부 스크롤을 위해 scrollTop 직접 계산
            const containerScrollTop = scrollContainer?.scrollTop;
            const containerHeight = scrollContainer?.clientHeight;
            const buttonOffsetTop = activeButton.offsetTop;
            const buttonHeight = activeButton.offsetHeight;

            // 활성 항목을 컨테이너 중앙에 위치시키기 위한 계산
            const targetScrollTop =
              buttonOffsetTop -
              (containerHeight ?? 0) / 2 +
              buttonHeight / 2;

            // 부드러운 스크롤 애니메이션
            const startScrollTop = containerScrollTop;
            const distance = targetScrollTop - (startScrollTop ?? 0);
            const duration = 300; // 300ms
            const startTime = performance.now();

            const animateScroll = (currentTime: number) => {
              if (!scrollContainer) {
                isScrollingAnimationRef.current = false;
                return;
              }

              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);

              // easeOutCubic 이징 함수
              const easeOutCubic = 1 - Math.pow(1 - progress, 3);
              const currentScrollTop =
                (startScrollTop ?? 0) + distance * easeOutCubic;

              scrollContainer.scrollTop = currentScrollTop;

              if (progress < 1) {
                requestAnimationFrame(animateScroll);
              } else {
                isScrollingAnimationRef.current = false;
              }
            };

            requestAnimationFrame(animateScroll);
          }
        });
      } else {
        // 스크롤 컨테이너가 없으면 기본 동작
        requestAnimationFrame(() => {
          isScrollingAnimationRef.current = true;
          activeButton.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
          });

          // 스크롤 애니메이션 완료 후 플래그 리셋
          setTimeout(() => {
            isScrollingAnimationRef.current = false;
          }, 600);
        });
      }
    }, 100);

    // cleanup 함수
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [activeId, scrollContainerRef]);

  // 헤딩 클릭 시 스크롤
  const handleClick = (id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    isScrollingRef.current = true;
    isScrollingAnimationRef.current = true;

    // 기존 timeout 제거
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // 요소 찾기 (재시도 로직 포함)
    const findAndScrollToElement = (attempt = 0) => {
      // ID로 먼저 찾기
      let element = document.getElementById(id);

      // ID로 찾지 못한 경우, 목차의 텍스트로 찾기
      if (!element && attempt === 0) {
        const heading = headings.find((h) => h.id === id);
        if (heading) {
          // 모든 h2 요소를 순회하며 텍스트로 찾기
          const allH2s = document.querySelectorAll('h2');
          for (const h2 of Array.from(allH2s)) {
            const h2Text = h2.textContent?.trim();
            if (
              h2Text === heading.text ||
              h2Text?.includes(heading.text) ||
              heading.text.includes(h2Text || '')
            ) {
              element = h2 as HTMLElement;
              console.log('Found by text:', { id: element.id, text: h2Text });
              break;
            }
          }
        }
      }

      if (element) {
        // Sticky header 높이 고려
        // top-24 = 96px (6rem), 추가 여유 공간 포함
        const headerOffset = 120;

        // 요소의 절대 위치 계산
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const targetScrollY = absoluteElementTop - headerOffset;

        // 스크롤 실행
        window.scrollTo({
          top: Math.max(0, targetScrollY),
          behavior: 'smooth'
        });

        // 스크롤 완료 후 플래그 리셋
        setTimeout(() => {
          isScrollingRef.current = false;
          isScrollingAnimationRef.current = false;
        }, 1500);
        return;
      }

      // 요소를 찾지 못한 경우 재시도
      if (attempt < 5) {
        setTimeout(() => {
          findAndScrollToElement(attempt + 1);
        }, 300);
        return;
      }

      console.error(
        `Heading element with id "${id}" not found after ${attempt + 1} attempts`,
        {
          searchedId: id,
          availableIds: Array.from(document.querySelectorAll('h2')).map(
            (h) => h.id
          ),
          headings: headings.map((h) => ({ id: h.id, text: h.text }))
        }
      );
      isScrollingRef.current = false;
      isScrollingAnimationRef.current = false;
    };

    findAndScrollToElement();
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className={className || ''}>
      <motion.div
        className="shadow-soft rounded-lg border border-border bg-card p-3 sm:p-4"
        initial={false}
        animate={isMounted ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h3 className="mb-3 text-base font-bold text-foreground sm:mb-4 sm:text-lg">
          목차
        </h3>
        <ul className="space-y-1.5">
          {headings.map((heading, index) => {
            const isActive = activeId === heading.id;
            const indent = heading.level - 2; // h2부터 시작하므로 level 2가 기본
            // Tailwind CSS로 padding-left 처리 (일반적인 경우)
            const paddingClasses: Record<number, string> = {
              0: 'pl-0',
              1: 'pl-4',
              2: 'pl-8',
              3: 'pl-12',
              4: 'pl-16',
              5: 'pl-20'
            };
            const paddingClass = paddingClasses[indent] || '';
            // 동적 값이 필요한 경우를 위한 style (Tailwind로 처리 불가능한 경우만)
            const dynamicPadding = paddingClass
              ? undefined
              : { paddingLeft: `${indent * 16}px` };

            return (
              <motion.li
                key={heading.id}
                className={`transition-colors ${paddingClass}`}
                style={dynamicPadding}
                initial={false}
                animate={
                  isMounted ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }
                }
                transition={{
                  duration: 0.3,
                  delay: 0.5 + index * 0.05
                }}
              >
                <button
                  ref={isActive ? activeItemRef : null}
                  data-heading-id={heading.id}
                  onClick={(e) => handleClick(heading.id, e)}
                  type="button"
                  className={`w-full rounded px-1.5 py-0.5 text-left text-xs transition-all sm:px-2 sm:py-1 sm:text-sm ${
                    isActive
                      ? 'border-l-2 border-primary bg-primary/10 font-semibold text-primary'
                      : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  <motion.span
                    className="block truncate"
                    initial={false}
                    whileHover={isMounted ? { x: 4 } : undefined}
                    transition={{ duration: 0.2 }}
                  >
                    {heading.text}
                  </motion.span>
                </button>
              </motion.li>
            );
          })}
        </ul>
      </motion.div>
    </div>
  );
};
