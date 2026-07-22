import type { ReactNode } from "react";
import Link from "next/link";

/** 마케팅 사이트 셸 — 다크 그라파이트 헤더/푸터(토리스 패밀리). /app 관리자 셸에는 적용되지 않는다. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-shell-line/70 bg-shell/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5" aria-label="주 메뉴">
          <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-step">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full bg-step shadow-[0_0_12px_2px_color-mix(in_srgb,var(--color-step)_60%,transparent)]"
            />
            <span className="whitespace-nowrap text-xl font-extrabold tracking-tight text-shell-ink">빌더스텝</span>
            <span className="hidden font-mono text-[10px] font-bold tracking-[0.28em] text-step-bright md:inline">BUILDERSTEP</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/#roadmap" className="hidden px-2 py-2 text-[15px] text-shell-dim transition-colors hover:text-shell-ink sm:block">
              8단계 로드맵
            </Link>
            <Link href="/#features" className="hidden px-2 py-2 text-[15px] text-shell-dim transition-colors hover:text-shell-ink sm:block">
              기능
            </Link>
            <Link href="/app" className="px-2 py-2 text-[15px] font-semibold text-shell-dim transition-colors hover:text-shell-ink">
              내 빌더스텝
            </Link>
            <Link
              href="/dashboard"
              className="btn-ember rounded-xl px-4 py-2.5 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-step-bright"
            >
              내 구독 확인
            </Link>
          </div>
        </nav>
      </header>
      {children}
      <footer className="border-t border-shell-line/70 bg-shell">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-12 text-sm text-shell-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-bold text-shell-ink">빌더스텝</span>
            <span className="text-shell-dim"> — 혼자 만드는 제품, 다음 단계는 함께</span>
          </p>
          <p>
            <a href="https://toris.kr" className="underline underline-offset-4 transition-colors hover:text-grow-bright">
              토리스 스튜디오의 제품 · toris.kr
            </a>
            <span className="mx-2" aria-hidden="true">·</span>
            <a href="mailto:korea@toris.kr" className="underline underline-offset-4 transition-colors hover:text-grow-bright">korea@toris.kr</a>
          </p>
        </div>
      </footer>
    </>
  );
}
