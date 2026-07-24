"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { NotificationItem } from "@fieldstep/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const LINKS = [
  { href: "/app", label: "대시보드" },
  { href: "/app/work", label: "작업" },
  { href: "/app/maintenance", label: "정기점검" },
  { href: "/app/masters", label: "고객/현장/장비" },
  { href: "/app/billing", label: "청구" },
  { href: "/app/settings", label: "설정" },
];

export function AppNav() {
  const pathname = usePathname();
  const { org, user, logout } = useAuth();
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
    setOpen(false);
    api.notifications
      .list(true)
      .then((r) => setNotifs(r.notifications))
      .catch(() => {});
  }, [pathname]);

  async function markAllRead() {
    if (notifs.length === 0) return;
    await api.notifications.markRead(notifs.map((n) => n.id));
    setNotifs([]);
  }

  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/app" className="font-bold">
            현장완료
          </Link>
          <nav className="hidden gap-4 text-sm sm:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`hover:text-primary ${
                  pathname === l.href || (l.href !== "/app" && pathname.startsWith(`${l.href}/`))
                    ? "font-semibold text-primary"
                    : "text-ink-dim"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setMobileNavOpen((value) => !value)}
            className="tap-target inline-flex items-center justify-center rounded-lg p-2 text-ink-dim hover:bg-bg-2 hover:text-ink sm:hidden"
            aria-label={mobileNavOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-app-navigation"
          >
            {mobileNavOpen ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="tap-target relative inline-flex items-center justify-center rounded-full p-2 hover:bg-bg-2"
              aria-label="알림"
              aria-expanded={open}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17H9m9-2V10a6 6 0 10-12 0v5l-2 2h16l-2-2zm-4 5a2 2 0 01-4 0"
                />
              </svg>
              {notifs.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />}
            </button>
            {open && (
              <div className="card absolute right-0 z-10 mt-2 w-72 p-2 shadow-lg">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-sm font-medium">알림</span>
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                    모두 읽음
                  </button>
                </div>
                {notifs.length === 0 ? (
                  <p className="px-2 py-4 text-center text-sm text-muted">새 알림이 없습니다</p>
                ) : (
                  <ul className="max-h-72 overflow-auto">
                    {notifs.map((n) => (
                      <li key={n.id} className="rounded px-2 py-2 text-sm hover:bg-bg-2">
                        {n.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <span className="hidden text-sm text-muted sm:inline">
            {org?.name} · {user?.name}
          </span>
          <button onClick={() => void logout()} className="btn-ghost hidden rounded-lg px-3 py-1.5 text-sm sm:inline-flex">
            로그아웃
          </button>
        </div>
      </div>
      {mobileNavOpen && (
        <nav id="mobile-app-navigation" aria-label="모바일 메뉴" className="border-t border-line px-4 py-3 sm:hidden">
          <div className="mx-auto grid max-w-6xl gap-1">
            {LINKS.map((link) => {
              const active =
                pathname === link.href || (link.href !== "/app" && pathname.startsWith(`${link.href}/`));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`tap-target flex items-center rounded-lg px-3 py-2 text-sm font-medium ${
                    active ? "bg-primary/10 text-primary" : "text-ink-dim hover:bg-bg-2 hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="mt-2 flex items-center justify-between border-t border-line px-3 pt-3">
              <span className="min-w-0 truncate text-sm text-muted">
                {org?.name} · {user?.name}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="btn-ghost tap-target ml-3 shrink-0 rounded-lg px-3 py-1.5 text-sm"
              >
                로그아웃
              </button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
