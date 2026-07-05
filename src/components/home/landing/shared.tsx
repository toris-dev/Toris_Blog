'use client';

import { useEffect, useRef, useState } from 'react';

/** 프로젝트 전역에서 재사용하는 부드러운 ease-out 커브 */
export const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * 데스크톱(포인터 hover 가능 + 넓은 뷰포트) 여부.
 * SSR/hydration mismatch 방지를 위해 최초엔 false로 시작하고
 * 마운트 후 matchMedia로 갱신합니다. 모바일에서 3D 강도를 줄이는 데 사용.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 1024px) and (hover: hover)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isDesktop;
}

/**
 * 마우스 위치를 -1..1 범위로 반환 (데스크톱 히어로 패럴랙스용).
 * reduced-motion이거나 데스크톱이 아니면 항상 0,0을 반환해 비용 0.
 */
export function useMouseParallax(enabled: boolean) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) {
      setPos({ x: 0, y: 0 });
      return;
    }
    let frame = 0;
    const onMove = (e: MouseEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setPos({
          x: (e.clientX / window.innerWidth - 0.5) * 2,
          y: (e.clientY / window.innerHeight - 0.5) * 2
        });
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return pos;
}

/**
 * 요소가 처음 뷰포트에 들어왔는지 여부 (한 번만 true).
 * whileInView 대신 transform 계산을 게이트할 때 사용.
 */
export function useInViewOnce<T extends HTMLElement>(rootMargin = '-15% 0px') {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
