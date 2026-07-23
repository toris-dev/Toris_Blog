"use client";

import type { Role } from "@fieldstep/shared";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export function RequireAuth({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Role[];
}) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (roles && role && !roles.includes(role)) {
      router.replace(role === "field" ? "/field" : "/app");
    }
  }, [loading, user, role, roles, router]);

  if (loading || !user) {
    return <div className="p-8 text-center text-sm text-muted">불러오는 중…</div>;
  }
  if (roles && role && !roles.includes(role)) return null;
  return <>{children}</>;
}
