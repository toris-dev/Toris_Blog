'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/style';

const skeletonVariants = cva('animate-pulse rounded bg-muted', {
  variants: {
    variant: {
      default: 'bg-muted',
      card: 'overflow-hidden rounded-xl border border-border shadow-sm',
      text: 'h-4 rounded-md'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
});

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-sm">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-5">
        <Skeleton className="mb-2 h-6 w-3/4" />
        <div className="mb-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-1/4" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-10 rounded-full" />
            <Skeleton className="h-4 w-10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonPostList({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-6">
      <Skeleton className="mb-4 h-7 w-1/4" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonPostDetail() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-10 w-3/4" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}
