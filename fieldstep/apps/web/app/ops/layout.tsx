"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clearOpsToken, opsApi, type Operator } from "@/lib/opsApi";

const LINKS = [
  { href: "/ops", label: "조직" },
  { href: "/ops/audit", label: "감사 로그" },
];

function OperatorNav({ operator }: { operator: Operator }) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onLogout() {
    setBusy(true);
    try {
      await opsApi.logout();
    } catch {
      // 서버 세션 정리 실패해도 클라이언트 로그아웃은 항상 완료한다.
    } finally {
      clearOpsToken();
      router.replace("/ops/login");
    }
  }

  return (
    <header className="border-b border-shell-line bg-shell text-shell-ink">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/ops" className="shrink-0 font-bold">
            현장완료 <span className="text-shell-dim">통합관리자</span>
          </Link>
          <nav className="hidden gap-4 text-sm sm:flex">
            {LINKS.map((link) => {
              const active =
                link.href === "/ops"
                  ? pathname === "/ops" || pathname.startsWith("/ops/org")
                  : pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? "font-semibold text-shell-ink"
                      : "text-shell-dim hover:text-shell-ink"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden truncate text-sm text-shell-dim sm:inline">
            {operator.email}
          </span>
          <button
            type="button"
            onClick={() => void onLogout()}
            disabled={busy}
            className="btn-ghost-shell rounded-lg px-3 py-1.5 text-sm"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}

function RequireOperator({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [operator, setOperator] = useState<Operator | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoginRoute = pathname === "/ops/login";

  useEffect(() => {
    // 로그인 페이지는 가드를 적용하지 않는다(진입점). 리다이렉트 루프 방지.
    if (isLoginRoute) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    opsApi
      .me()
      .then((res) => {
        if (!alive) return;
        setOperator(res.operator);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setOperator(null);
        setLoading(false);
        router.replace("/ops/login");
      });
    return () => {
      alive = false;
    };
  }, [isLoginRoute, router]);

  // 로그인 페이지는 셸/가드 없이 그대로 렌더한다.
  if (isLoginRoute) return <>{children}</>;

  if (loading || !operator) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary"
          role="status"
          aria-label="불러오는 중"
        />
      </div>
    );
  }

  return (
    <>
      <OperatorNav operator={operator} />
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </>
  );
}

export default function OpsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dash-ui min-h-dvh bg-bg">
      <RequireOperator>{children}</RequireOperator>
    </div>
  );
}
