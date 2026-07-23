"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { WorkStatusBadge } from "@/components/StatusBadge";

type WorkOrderSummary = Awaited<ReturnType<typeof api.workOrders.list>>["workOrders"][number];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function FieldHomePage() {
  const router = useRouter();
  const [rows, setRows] = useState<WorkOrderSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api.workOrders
      .list({ date: todayIso(), mine: true })
      .then((r) => setRows(r.workOrders))
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기에 실패했습니다"));
  }, []);

  async function startAndGo(id: string, status: WorkOrderSummary["workStatus"]) {
    setBusyId(id);
    try {
      if (status === "scheduled") await api.workOrders.start(id);
      router.push(`/field/record?id=${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "시작 처리에 실패했습니다");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-ink">오늘 배정된 작업</h1>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 space-y-4">
        {rows.length === 0 && <p className="text-sm text-muted">오늘 배정된 작업이 없습니다.</p>}
        {rows.map((w) => (
          <div key={w.id} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{w.scheduledTime ?? "시간 미정"}</span>
              <WorkStatusBadge status={w.workStatus} />
            </div>
            <h2 className="mt-2 text-lg font-bold">{w.customerName}</h2>
            <p className="text-sm text-ink-dim">{w.siteName}</p>
            <p className="mt-1 text-sm text-muted">{w.workType}</p>
            <button
              onClick={() => startAndGo(w.id, w.workStatus)}
              disabled={busyId === w.id || w.workStatus === "submitted" || w.workStatus === "reviewed" || w.workStatus === "completed"}
              className="btn-primary tap-target mt-4 w-full rounded-lg py-3 text-base font-semibold"
            >
              {w.workStatus === "in_progress" ? "기록 이어하기" : "작업 시작"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
