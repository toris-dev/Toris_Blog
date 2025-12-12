import Link from 'next/link';
import { FaWifi, FaHome } from '@/components/icons';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          <div className="neon-border rounded-full border-4 border-primary/50 bg-primary/10 p-8">
            <FaWifi className="size-16 text-primary" />
          </div>
        </div>
        <h1 className="neon-glow mb-4 text-4xl font-bold text-foreground">
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
            className="neon-glow-animate rounded-lg border border-primary/50 bg-primary/20 px-6 py-3 font-medium text-primary transition-all hover:bg-primary/30"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="neon-border flex items-center gap-2 rounded-lg border border-primary/30 bg-card/50 px-6 py-3 font-medium text-foreground transition-all hover:bg-card/80"
          >
            <FaHome className="size-4" />
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
