'use client';

import { FC } from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const Loading: FC<LoadingProps> = ({ size = 'md', color = 'primary' }) => {
  const sizeClasses = {
    sm: 'size-6',
    md: 'size-10',
    lg: 'size-16'
  };

  const colorClasses = {
    primary: 'border-primary border-t-transparent',
    accent: 'border-accent-1 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-300 border-t-transparent dark:border-gray-600'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`animate-spin rounded-full border-4 ${sizeClasses[size]} ${colorClasses[color as keyof typeof colorClasses]}`}
      ></div>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
        로딩 중...
      </p>
    </div>
  );
};

export default Loading;
