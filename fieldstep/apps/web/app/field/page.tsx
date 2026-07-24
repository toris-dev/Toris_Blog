"use client";

import { toSeoulDateString } from "@fieldstep/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { WorkStatusBadge } from "@/components/StatusBadge";

type WorkOrderSummary = Awaited<ReturnType<typeof api.workOrders.list>>["workOrders"][number];

export default function FieldHomePage() {
  const router = useRouter();
  const [rows, setRows] = useState<WorkOrderSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api.workOrders
      .list({ date: toSeoulDateString(), mine: true })
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

  function actionLabel(status: WorkOrderSummary["workStatus"]) {
    if (status === "in_progress") return "기록 이어하기";
    if (status === "canceled") return "취소된 작업";
    if (status === "completed") return "완료된 작업";
    if (status === "submitted" || status === "reviewed") return "제출 완료";
    if (status === "draft") return "배정 대기";
    return "작업 시작";
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
            <dl className="mt-3 space-y-1 rounded-lg bg-bg-2 p-3 text-sm">
              {w.siteAddress && (
                <div className="grid grid-cols-[4.5rem_1fr] gap-2">
                  <dt className="text-muted">주소</dt>
                  <dd>{w.siteAddress}</dd>
                </div>
              )}
              {(w.contactName || w.contactPhone) && (
                <div className="grid grid-cols-[4.5rem_1fr] gap-2">
                  <dt className="text-muted">현장 연락</dt>
                  <dd>
                    {w.contactName ?? ""}
                    {w.contactName && w.contactPhone ? " · " : ""}
                    {w.contactPhone ? (
                      <a className="text-primary underline-offset-2 hover:underline" href={`tel:${w.contactPhone}`}>
                        {w.contactPhone}
                      </a>
                    ) : null}
                  </dd>
                </div>
              )}
              {w.accessInfo && (
                <div className="grid grid-cols-[4.5rem_1fr] gap-2">
                  <dt className="text-muted">출입 정보</dt>
                  <dd className="whitespace-pre-wrap">{w.accessInfo}</dd>
                </div>
              )}
              {w.request && (
                <div className="grid grid-cols-[4.5rem_1fr] gap-2">
                  <dt className="text-muted">요청 사항</dt>
                  <dd className="whitespace-pre-wrap">{w.request}</dd>
                </div>
              )}
            </dl>
            <button
              onClick={() => startAndGo(w.id, w.workStatus)}
              disabled={
                busyId === w.id ||
                w.workStatus === "draft" ||
                w.workStatus === "submitted" ||
                w.workStatus === "reviewed" ||
                w.workStatus === "completed" ||
                w.workStatus === "canceled"
              }
              className="btn-primary tap-target mt-4 w-full rounded-lg py-3 text-base font-semibold"
            >
              {actionLabel(w.workStatus)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
