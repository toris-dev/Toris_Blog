import { Skeleton, SkeletonPostList } from '@/components/ui/Skeleton';

export default function PostsLoading() {
  return (
    <div className="container space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-full sm:w-64" />
      </div>
      <SkeletonPostList count={6} />
    </div>
  );
}
