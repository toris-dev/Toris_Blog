"use client";

import type { ApprovalStatus, BillingStatus, WorkStatus } from "@fieldstep/shared";
import { WORK_STATUS_LABELS } from "@fieldstep/shared";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ApprovalStatusBadge, BillingStatusBadge, WorkStatusBadge } from "@/components/StatusBadge";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

type WorkOrderSummary = Awaited<ReturnType<typeof api.workOrders.list>>["workOrders"][number];

function WorkListContent() {
  const router = useRouter();
  const params = useSearchParams();
  const scope = params.get("scope");
  const dateFilter = scope === "today" ? todayIso() : params.get("date") ?? "";
  const statusFilter = (params.get("status") as WorkStatus | null) ?? "";
  const approvalFilter = params.get("approvalStatus") as ApprovalStatus | null;
  const billingFilter = params.get("billingStatus") as BillingStatus | null;

  const [rows, setRows] = useState<WorkOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.workOrders
      .list({ date: dateFilter || undefined, status: statusFilter || undefined })
      .then((r) => setRows(r.workOrders))
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기에 실패했습니다"))
      .finally(() => setLoading(false));
  }, [dateFilter, statusFilter]);

  const filtered = rows.filter((w) => {
    if (approvalFilter && w.approvalStatus !== approvalFilter) return false;
    if (billingFilter && w.billingStatus !== billingFilter) return false;
    return true;
  });

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "scope") next.delete("scope");
    router.push(`/app/work?${next.toString()}`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">작업</h1>
        <Link href="/app/work/new" className="btn-primary rounded-lg px-4 py-2 text-sm font-medium">
          작업 등록
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="date"
          className="input"
          value={dateFilter}
          onChange={(e) => updateParam("date", e.target.value)}
        />
        <select className="input" value={statusFilter} onChange={(e) => updateParam("status", e.target.value)}>
          <option value="">전체 상태</option>
          {Object.entries(WORK_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        {(approvalFilter || billingFilter || dateFilter || statusFilter) && (
          <button onClick={() => router.push("/app/work")} className="btn-ghost rounded-lg px-3 py-2 text-sm">
            필터 초기화
          </button>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-muted">
            <tr>
              <th className="px-4 py-3">일정</th>
              <th className="px-4 py-3">고객/현장</th>
              <th className="px-4 py-3">유형</th>
              <th className="px-4 py-3">담당자</th>
              <th className="px-4 py-3">작업</th>
              <th className="px-4 py-3">승인</th>
              <th className="px-4 py-3">청구</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  불러오는 중…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  조건에 맞는 작업이 없습니다
                </td>
              </tr>
            ) : (
              filtered.map((w) => (
                <tr key={w.id} className="border-b border-line last:border-0 hover:bg-bg-2">
                  <td className="px-4 py-3">
                    <Link href={`/app/work/detail?id=${w.id}`} className="hover:text-primary">
                      {w.scheduledDate} {w.scheduledTime ?? ""}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {w.customerName} / {w.siteName}
                  </td>
                  <td className="px-4 py-3">{w.workType}</td>
                  <td className="px-4 py-3">{w.assigneeNames.join(", ") || "-"}</td>
                  <td className="px-4 py-3">
                    <WorkStatusBadge status={w.workStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <ApprovalStatusBadge status={w.approvalStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <BillingStatusBadge status={w.billingStatus} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function WorkListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">불러오는 중…</div>}>
      <WorkListContent />
    </Suspense>
  );
}
