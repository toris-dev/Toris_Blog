import { SkeletonPostDetail } from '@/components/ui/Skeleton';

export default function PostDetailLoading() {
  return (
    <div className="min-w-0 max-w-full px-4 py-8 sm:px-6 lg:px-8">
      <SkeletonPostDetail />
    </div>
  );
}
