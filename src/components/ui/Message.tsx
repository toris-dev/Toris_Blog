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
    success: 'border-green-500/30 bg-green-500/10 text-green-400',
    error: 'border-red-500/30 bg-red-500/10 text-red-400',
    warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    info: 'border-primary/30 bg-primary/10 text-primary'
  };

  return (
    <div className={cn(baseClasses, typeClasses[type], className)}>
      {children}
    </div>
  );
}
