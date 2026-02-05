import { Skeleton, SkeletonPostList } from '@/components/ui/Skeleton';

export default function CategoryLoading() {
  return (
    <div className="container space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-9 w-64" />
      <SkeletonPostList count={6} />
    </div>
  );
}
