"use client";

import type { ReactNode } from "react";
import { AppNav } from "@/components/AppNav";
import { RequireAuth } from "@/components/RequireAuth";

export default function AppSectionLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth roles={["admin", "office"]}>
      <div className="dash-ui min-h-dvh bg-bg">
        <AppNav />
        <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
      </div>
    </RequireAuth>
  );
}
