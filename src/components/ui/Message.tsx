'use client';

import { cn } from '@/utils/style';
import { ReactNode } from 'react';

interface MessageProps {
  children: ReactNode;
  type: 'success' | 'error' | 'warning' | 'info';
  className?: string;
}

export function Message({ children, type, className }: MessageProps) {
  const baseClasses = 'rounded-lg border p-4 text-sm';

  const typeClasses = {
    success:
      'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400',
    error:
      'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400',
    warning:
      'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
  };

  return (
    <div className={cn(baseClasses, typeClasses[type], className)}>
      {children}
    </div>
  );
}
