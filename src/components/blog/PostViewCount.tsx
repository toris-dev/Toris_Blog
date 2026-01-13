'use client';

import { useEffect, useState } from 'react';
import { FaEye } from '@/components/icons';
import { cn } from '@/utils/style';
import { getViewCount, hasViewedRecently, incrementViewCount, markAsViewed } from '@/utils/postViews';

interface PostViewCountProps {
  postId: string;
  className?: string;
  showIcon?: boolean;
}

export function PostViewCount({ postId, className, showIcon = true }: PostViewCountProps) {
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 초기 조회수 로드
    const loadViewCount = async () => {
      try {
        const count = await getViewCount(postId);
        setViewCount(count);
      } catch (error) {
        console.error('Error loading view count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadViewCount();

    // 조회수 증가 (24시간 내 중복 방지)
    const incrementView = async () => {
      if (hasViewedRecently(postId)) {
        return;
      }

      try {
        const newCount = await incrementViewCount(postId);
        if (newCount !== null) {
          setViewCount(newCount);
          markAsViewed(postId);
        }
      } catch (error) {
        console.error('Error incrementing view count:', error);
      }
    };

    // 페이지 로드 후 조회수 증가
    const timer = setTimeout(() => {
      incrementView();
    }, 1000); // 1초 후 실행 (페이지 로드 완료 후)

    return () => clearTimeout(timer);
  }, [postId]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
        {showIcon && <FaEye className="size-4" />}
        <span>...</span>
      </div>
    );
  }

  const formattedCount = viewCount !== null ? viewCount.toLocaleString() : '0';

  return (
    <div className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
      {showIcon && <FaEye className="size-4" />}
      <span>{formattedCount}</span>
    </div>
  );
}
