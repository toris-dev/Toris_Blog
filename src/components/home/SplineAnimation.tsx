'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { Application } from '@splinetool/runtime';
import Spline from '@splinetool/react-spline';

interface SplineAnimationProps {
  scene: string;
  className?: string;
  height?: string;
}

export default function SplineAnimation({
  scene,
  className = '',
  height = '600px'
}: SplineAnimationProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // 부드러운 스프링 애니메이션
  const springConfig = { damping: 25, stiffness: 200 };
  const x = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-10, 10]),
    springConfig
  );
  const y = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [-10, 10]),
    springConfig
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // 마우스 움직임에 따른 패럴랙스 효과
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normalizedX = (e.clientX - centerX) / rect.width;
    const normalizedY = (e.clientY - centerY) / rect.height;

    mouseX.set(normalizedX);
    mouseY.set(normalizedY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleLoad = (spline: Application) => {
    setIsLoaded(true);
  };

  // 마우스 휠 이벤트 처리 - Spline 위에서 휠 스크롤 시 페이지 스크롤 방지
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Spline 컨테이너 위에서 휠 이벤트가 발생하면 스크롤 방지
      const rect = container.getBoundingClientRect();
      const isOverContainer =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (isOverContainer && isLoaded) {
        // Spline이 로드된 상태에서만 스크롤 방지
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // passive: false로 설정하여 preventDefault() 사용 가능
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isLoaded]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ height }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-muted/50">
          <div className="size-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
        animate={isInView ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="size-full overflow-hidden rounded-lg"
        style={{
          x,
          y,
          transformStyle: 'preserve-3d',
          perspective: '1000px',
          height
        }}
        whileHover={{ scale: 1.02 }}
      >
        <Spline scene={scene} onLoad={handleLoad} />
      </motion.div>
    </div>
  );
}
