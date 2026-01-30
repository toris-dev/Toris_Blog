/**
 * 포스트 목록 페이지 Suspense fallback용 스켈레톤
 * ClientSearchPage 레이아웃과 유사한 구조로 로딩 UX 개선
 */
export function PostsPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 검색/필터 영역 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-primary/10 sm:w-80" />
        <div className="flex gap-2">
          <div className="h-10 w-24 animate-pulse rounded-lg bg-primary/10" />
          <div className="h-10 w-24 animate-pulse rounded-lg bg-primary/10" />
        </div>
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-primary/20 shadow-sm"
            aria-hidden
          >
            <div className="h-48 w-full animate-pulse bg-primary/10" />
            <div className="p-5">
              <div className="mb-2 h-6 w-3/4 animate-pulse rounded-md bg-primary/10" />
              <div className="mb-4 space-y-2">
                <div className="h-4 w-full animate-pulse rounded-md bg-primary/10" />
                <div className="h-4 w-full animate-pulse rounded-md bg-primary/10" />
                <div className="h-4 w-2/3 animate-pulse rounded-md bg-primary/10" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-3 w-1/4 animate-pulse rounded-md bg-primary/10" />
                <div className="flex gap-1">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-primary/10" />
                  <div className="h-9 w-9 animate-pulse rounded-full bg-primary/10" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
