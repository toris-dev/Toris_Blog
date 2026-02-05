import { Skeleton } from '@/components/ui/Skeleton';

export default function GlobalLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-12 w-48 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
      </div>
    </div>
  );
}
