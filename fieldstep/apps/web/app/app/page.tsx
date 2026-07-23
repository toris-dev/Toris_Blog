"use client";

import type { DashboardCounts } from "@fieldstep/shared";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const CARDS: { key: keyof DashboardCounts; label: string; href: string }[] = [
  { key: "today", label: "오늘 작업", href: "/app/work?scope=today" },
  { key: "submitted", label: "미검토", href: "/app/work?status=submitted" },
  { key: "pendingApproval", label: "승인대기", href: "/app/work?approvalStatus=pending" },
  { key: "revisionRequested", label: "수정요청", href: "/app/work?approvalStatus=revision_requested" },
  { key: "billable", label: "청구가능", href: "/app/billing?status=billable" },
  { key: "overdue", label: "미수", href: "/app/billing?status=overdue" },
];

export default function DashboardPage() {
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.dashboard()
      .then((r) => setCounts(r.counts))
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기에 실패했습니다"));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold">대시보드</h1>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {CARDS.map((c) => (
          <Link key={c.key} href={c.href} className="card flex flex-col gap-1 p-5 hover:border-primary">
            <span className="text-sm text-muted">{c.label}</span>
            <span className="text-3xl font-bold">{counts ? counts[c.key] : "—"}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
