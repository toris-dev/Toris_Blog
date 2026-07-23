"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";

function FieldHeader() {
  const { logout, user } = useAuth();
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-shell-line bg-shell px-4 py-3 text-shell-ink">
      <span className="font-bold">현장완료</span>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-shell-dim">{user?.name}</span>
        <button onClick={logout} className="btn-ghost-shell tap-target rounded-lg px-3 py-1.5">
          로그아웃
        </button>
      </div>
    </header>
  );
}

export default function FieldLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-dvh bg-bg-2">
        <FieldHeader />
        <div className="mx-auto max-w-lg px-4 py-4">{children}</div>
      </div>
    </RequireAuth>
  );
}
