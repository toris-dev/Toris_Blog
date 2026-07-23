"use client";

import { canTransition, WORK_STATUS_LABELS, type WorkStatus } from "@fieldstep/shared";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ApprovalStatusBadge, BillingStatusBadge, WorkStatusBadge } from "@/components/StatusBadge";

type Detail = Awaited<ReturnType<typeof api.workOrders.get>>;

const NEXT_STATUS: Partial<Record<WorkStatus, WorkStatus>> = {
  scheduled: "in_progress",
  in_progress: "submitted",
  submitted: "reviewed",
};

function DetailContent() {
  const id = useSearchParams().get("id") ?? "";
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    api.workOrders
      .get(id)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기에 실패했습니다"));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!id) return <p className="text-sm text-red-600">작업 id가 없습니다</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-muted">불러오는 중…</p>;

  const { workOrder, customer, site, asset, assignees, fieldRecord, photos, draft, reportVersions, approval, billing } = data;
  const nextStatus = NEXT_STATUS[workOrder.workStatus];
  const canAdvance = nextStatus ? canTransition("work", workOrder.workStatus, nextStatus) : false;

  async function advance() {
    if (!nextStatus) return;
    setBusy(true);
    setError(null);
    try {
      if (nextStatus === "in_progress") await api.workOrders.start(id);
      else if (nextStatus === "submitted") await api.workOrders.submit(id);
      else if (nextStatus === "reviewed") await api.workOrders.finalizeReport(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 전이에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }

  async function sendApprovalLink() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.workOrders.createApprovalLink(id);
      setLinkUrl(res.url);
      setCopied(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "승인 링크 생성에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }


  async function complete() {
    setBusy(true);
    setError(null);
    try {
      await api.workOrders.complete(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "완료 처리에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }

  async function cancelWorkOrder() {
    const reason = window.prompt("취소 사유를 입력해주세요");
    if (!reason || !reason.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.workOrders.cancel(id, reason.trim());
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "작업 취소에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">
            {workOrder.workType} · {customer.name} / {site.name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {workOrder.scheduledDate} {workOrder.scheduledTime ?? ""} · 담당 {assignees.map((a) => a.name).join(", ") || "-"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <WorkStatusBadge status={workOrder.workStatus} />
          <ApprovalStatusBadge status={workOrder.approvalStatus} />
          <BillingStatusBadge status={workOrder.billingStatus} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* 상태 타임라인 */}
      <div className="card flex flex-wrap items-center gap-2 p-4 text-sm">
        {(["draft", "scheduled", "in_progress", "submitted", "reviewed", "completed"] as WorkStatus[]).map((s, i, arr) => (
          <span key={s} className="flex items-center gap-2">
            <span className={s === workOrder.workStatus ? "font-semibold text-primary" : "text-muted"}>
              {WORK_STATUS_LABELS[s]}
            </span>
            {i < arr.length - 1 && <span className="text-line">→</span>}
          </span>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          {(workOrder.workStatus === "draft" || workOrder.workStatus === "scheduled" || workOrder.workStatus === "in_progress") && (
            <button onClick={cancelWorkOrder} disabled={busy} className="btn-danger rounded-lg px-4 py-2 text-sm font-medium">
              작업 취소
            </button>
          )}
          {workOrder.workStatus === "reviewed" && (
            <button onClick={complete} disabled={busy} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium">
              완료 처리
            </button>
          )}
          {nextStatus && (
            <button onClick={advance} disabled={busy || !canAdvance} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium">
              {nextStatus === "in_progress" && "시작 처리"}
              {nextStatus === "submitted" && "제출 처리"}
              {nextStatus === "reviewed" && "리포트 확정"}
            </button>
          )}
        </div>
      </div>

      {workOrder.request && (
        <div className="card p-4">
          <p className="text-sm font-medium text-ink-dim">요청 사항</p>
          <p className="mt-1 text-sm">{workOrder.request}</p>
        </div>
      )}

      {asset && (
        <div className="card p-4 text-sm">
          <p className="font-medium text-ink-dim">장비</p>
          <p className="mt-1">
            {asset.name} {asset.model ? `(${asset.model})` : ""} {asset.serialNo ? `S/N ${asset.serialNo}` : ""}
          </p>
        </div>
      )}

      {fieldRecord && (
        <div className="card space-y-2 p-4 text-sm">
          <p className="font-medium text-ink-dim">현장 기록</p>
          {fieldRecord.workSummary && <p>요약: {fieldRecord.workSummary}</p>}
          {fieldRecord.transcript && <p className="whitespace-pre-wrap text-ink-dim">전사: {fieldRecord.transcript}</p>}
          {fieldRecord.parts.length > 0 && (
            <ul className="list-disc pl-5">
              {fieldRecord.parts.map((p, i) => (
                <li key={i}>
                  {p.name} {p.model ? `(${p.model})` : ""} — {p.quantity}
                  {p.unit}
                </li>
              ))}
            </ul>
          )}
          {fieldRecord.issues && <p>특이사항: {fieldRecord.issues}</p>}
          {fieldRecord.nextInspectionDate && <p>다음 점검일: {fieldRecord.nextInspectionDate}</p>}
        </div>
      )}

      {photos.length > 0 && (
        <div className="card p-4">
          <p className="text-sm font-medium text-ink-dim">사진 ({photos.length})</p>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.id} src={p.url} alt={p.caption ?? p.kind} className="aspect-square rounded object-cover" />
            ))}
          </div>
        </div>
      )}

      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm">
          <p className="font-medium text-ink-dim">초안 / 리포트</p>
          <p className="mt-1 text-muted">{draft ? "초안이 생성되었습니다" : "초안이 아직 없습니다"}</p>
        </div>
        <Link href={`/app/review?id=${id}`} className="btn-ghost rounded-lg px-4 py-2 text-sm font-medium">
          검토 화면 열기
        </Link>
      </div>

      {reportVersions.length > 0 && (
        <div className="card p-4">
          <p className="text-sm font-medium text-ink-dim">리포트 버전</p>
          <ul className="mt-2 space-y-1 text-sm">
            {reportVersions.map((v) => (
              <li key={v.id} className="flex items-center justify-between">
                <span>
                  v{v.version} · {v.reportNumber} · {v.createdAt}
                </span>
                <Link href={`/app/print?id=${id}&v=${v.version}`} className="text-primary hover:underline">
                  인쇄 보기
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card space-y-3 p-4">
        <p className="text-sm font-medium text-ink-dim">승인</p>
        {approval?.approvedAt ? (
          <p className="text-sm text-done">
            {approval.approverName}
            {approval.approverTitle ? ` (${approval.approverTitle})` : ""} 승인 완료 · {approval.approvedAt}
          </p>
        ) : approval?.revisionComment ? (
          <p className="text-sm text-red-600">수정 요청: {approval.revisionComment}</p>
        ) : (
          <p className="text-sm text-muted">아직 승인 요청이 없습니다</p>
        )}
        <button
          onClick={sendApprovalLink}
          disabled={busy || reportVersions.length === 0}
          className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
        >
          승인 링크 발송
        </button>
        {linkUrl && (
          <div className="flex items-center gap-2 rounded-lg bg-bg-2 p-2 text-xs">
            <code className="flex-1 truncate">{linkUrl}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(linkUrl);
                setCopied(true);
              }}
              className="btn-ghost rounded px-2 py-1"
            >
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
        )}
      </div>

      <div className="card space-y-2 p-4 text-sm">
        <p className="font-medium text-ink-dim">청구</p>
        <div className="flex items-center justify-between">
          <BillingStatusBadge status={workOrder.billingStatus} />
          {billing?.amount != null && <span>₩{billing.amount.toLocaleString()}</span>}
        </div>
        <Link href="/app/billing" className="text-primary hover:underline">
          청구 관리로 이동
        </Link>
      </div>
    </div>
  );
}

export default function WorkDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">불러오는 중…</div>}>
      <DetailContent />
    </Suspense>
  );
}
