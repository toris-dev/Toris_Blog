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
  { href: "/app/masters", label: "고객/현장/장비" },
  { href: "/app/billing", label: "청구" },
  { href: "/app/settings", label: "설정" },
];

export function AppNav() {
  const pathname = usePathname();
  const { org, user, logout } = useAuth();
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
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
                className={`hover:text-primary ${pathname === l.href ? "font-semibold text-primary" : "text-ink-dim"}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="relative rounded-full p-2 hover:bg-bg-2"
              aria-label="알림"
            >
              🔔
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
          <button onClick={logout} className="btn-ghost rounded-lg px-3 py-1.5 text-sm">
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
