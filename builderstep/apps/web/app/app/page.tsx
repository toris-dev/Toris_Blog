import type { Metadata } from "next";
import AppHub from "@/components/AppHub";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "내 빌더스텝 — 워크스페이스",
  description:
    "구독 회원 전용 워크스페이스. 단계 진단, 목표 트래킹, 맞춤 로드맵, 지표 대시보드, 전문가 상담, 커뮤니티를 관리자 대시보드에서 한 번에.",
};

export default function AppPage() {
  return (
    <main id="main" className="dash-ui">
      <ToastProvider>
        <AppHub />
      </ToastProvider>
    </main>
  );
}
