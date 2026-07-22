import type { Metadata } from "next";
import EntitlementPanel from "@/components/EntitlementPanel";

export const metadata: Metadata = {
  title: "내 구독 — 빌더스텝",
  description: "구글로 로그인해 구독 상태와 사용 가능한 기능을 확인하세요.",
};

export default function DashboardPage() {
  return (
    <main id="main" className="mx-auto max-w-6xl px-5 pb-24 pt-16 sm:pt-20">
      <p className="font-mono text-[11px] font-bold tracking-[0.28em] text-step-bright">
        MY SUBSCRIPTION
      </p>
      <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
        내 구독과 기능
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-ink-dim">
        구글로 로그인하면 본인 계정의 구독 상태와 사용 가능한 기능이 바로
        표시됩니다. 결제는 래피드에서 처리되며, 결제 웹훅으로 구독 상태가
        자동 동기화됩니다.
      </p>
      <div className="mt-10">
        <EntitlementPanel />
      </div>
    </main>
  );
}
