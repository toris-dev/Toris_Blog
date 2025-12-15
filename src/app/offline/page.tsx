'use client';

import Link from 'next/link';
import { FaWifi, FaHome } from '@/components/icons';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          <div className="shadow-medium rounded-full border-4 border-border bg-primary/10 p-8">
            <FaWifi className="size-16 text-primary" />
          </div>
        </div>
        <h1 className="mb-4 text-4xl font-bold text-foreground">
          오프라인 상태
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          인터넷 연결을 확인해주세요.
          <br />
          일부 캐시된 콘텐츠는 계속 사용할 수 있습니다.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="shadow-soft hover:shadow-medium rounded-lg border border-border bg-primary px-6 py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="shadow-soft hover:shadow-medium flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 font-medium text-foreground transition-all hover:bg-muted"
          >
            <FaHome className="size-4" />
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
