'use client';

import { useMemo } from 'react';
import { FaClock } from '@/components/icons';
import { cn } from '@/utils/style';
import { calculateReadingTime, formatReadingTime } from '@/utils/readingTime';

interface ReadingTimeProps {
  content: string;
  className?: string;
  showIcon?: boolean;
}

export function ReadingTime({ content, className, showIcon = true }: ReadingTimeProps) {
  const readingTime = useMemo(() => {
    return calculateReadingTime(content);
  }, [content]);

  const formattedTime = formatReadingTime(readingTime);

  return (
    <div className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
      {showIcon && <FaClock className="size-4" />}
      <span>{formattedTime}</span>
    </div>
  );
}
