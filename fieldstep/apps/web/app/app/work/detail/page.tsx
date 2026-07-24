"use client";

import {
  canTransition,
  WORK_STATUS_LABELS,
  type ApprovalRequestStatus,
  type Member,
  type WorkStatus,
} from "@fieldstep/shared";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ProtectedAudio, ProtectedImage } from "@/components/ProtectedMedia";
import { api } from "@/lib/api";
import { ApprovalStatusBadge, BillingStatusBadge, WorkStatusBadge } from "@/components/StatusBadge";
import {
  generateApprovalPdfArtifact,
  recoverSignedPdfArtifact,
  type PdfArtifactProgress,
} from "@/lib/report-pdf";

type Detail = Awaited<ReturnType<typeof api.workOrders.get>>;

const NEXT_STATUS: Partial<Record<WorkStatus, WorkStatus>> = {
  scheduled: "in_progress",
  in_progress: "submitted",
};

const APPROVAL_REQUEST_STATUS_LABELS: Record<ApprovalRequestStatus, string> = {
  pending: "승인 대기",
  approved: "승인 완료",
  revision_requested: "수정 요청",
  expired: "만료",
  superseded: "재발급으로 무효",
};

function formatTimestamp(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function DetailContent() {
  const id = useSearchParams().get("id") ?? "";
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [invalidatePrevious, setInvalidatePrevious] = useState(true);
  const [correctionComment, setCorrectionComment] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [pdfProgress, setPdfProgress] = useState<PdfArtifactProgress | null>(
    null,
  );

  const load = useCallback(() => {
    if (!id) return;
    api.workOrders
      .get(id)
      .then((next) => {
        setData(next);
        setSelectedAssigneeIds(next.workOrder.assigneeIds);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기에 실패했습니다"));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.users()
      .then((response) => setMembers(response.members.filter((member) => member.active)))
      .catch((err) => setError(err instanceof Error ? err.message : "담당자 목록을 불러오지 못했습니다"));
  }, []);

  if (!id) return <p className="text-sm text-red-600">작업 id가 없습니다</p>;
  if (error && !data) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-muted">불러오는 중…</p>;

  const {
    workOrder,
    customer,
    site,
    asset,
    assignees,
    fieldRecord,
    photos,
    audio,
    draft,
    nextVisitCandidate,
    reportVersions,
    approval,
    billing,
  } = data;
  const nextStatus = NEXT_STATUS[workOrder.workStatus];
  const canAdvance = nextStatus ? canTransition("work", workOrder.workStatus, nextStatus) : false;
  const latestVersion = reportVersions.at(-1);

  async function advance() {
    if (!nextStatus) return;
    setBusy(true);
    setError(null);
    try {
      if (nextStatus === "in_progress") await api.workOrders.start(id);
      else if (nextStatus === "submitted") await api.workOrders.submit(id);
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
      const res = await api.workOrders.createApprovalLink(id, invalidatePrevious);
      setLinkUrl(res.url);
      const didCopy = await navigator.clipboard
        .writeText(res.url)
        .then(() => true)
        .catch(() => false);
      setCopied(didCopy);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "승인 링크 생성에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }

  async function preparePdf(version: number) {
    setBusy(true);
    setError(null);
    try {
      await generateApprovalPdfArtifact(id, version, setPdfProgress);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF 생성에 실패했습니다");
    } finally {
      setPdfProgress(null);
      setBusy(false);
    }
  }

  async function recoverSignedPdf(version: number) {
    setBusy(true);
    setError(null);
    try {
      await recoverSignedPdfArtifact(id, version, setPdfProgress);
      load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "서명 PDF 복구에 실패했습니다",
      );
    } finally {
      setPdfProgress(null);
      setBusy(false);
    }
  }

  async function requestCorrection() {
    const comment = correctionComment.trim();
    if (!comment) return;
    setBusy(true);
    setError(null);
    try {
      await api.workOrders.requestReportCorrection(id, comment);
      setCorrectionComment("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "승인본 정정을 시작하지 못했습니다");
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

  function toggleAssignee(userId: string) {
    setSelectedAssigneeIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  async function saveAssignments() {
    if (selectedAssigneeIds.length === 0) {
      setError("담당자를 한 명 이상 선택해주세요");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.workOrders.assign(id, selectedAssigneeIds);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "담당자 배정에 실패했습니다");
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
            </button>
          )}
        </div>
      </div>

      {(["draft", "scheduled", "in_progress"] as WorkStatus[]).includes(
        workOrder.workStatus,
      ) && (
        <section className="card space-y-3 p-4" aria-labelledby="assignment-heading">
          <div>
            <h2 id="assignment-heading" className="text-sm font-medium text-ink-dim">
              담당자 배정
            </h2>
            <p className="mt-1 text-xs text-muted">
              초안은 담당자를 한 명 이상 배정하면 예정 작업으로 전환되어 현장 홈에 표시됩니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {members.map((member) => {
              const selected = selectedAssigneeIds.includes(member.id);
              return (
                <button
                  key={member.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleAssignee(member.id)}
                  className={`tap-target rounded-full border px-3 py-1.5 text-sm ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-line text-ink-dim"
                  }`}
                >
                  {member.name}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={saveAssignments}
            disabled={busy || selectedAssigneeIds.length === 0}
            className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
          >
            {workOrder.workStatus === "draft"
              ? "담당자 배정·예정으로 전환"
              : "배정 변경 저장"}
          </button>
        </section>
      )}

      {data.assignmentHistory.length > 0 && (
        <section className="card p-4" aria-labelledby="assignment-history-heading">
          <h2 id="assignment-history-heading" className="text-sm font-medium text-ink-dim">
            배정 변경 이력
          </h2>
          <ol className="mt-2 space-y-1 text-xs text-muted">
            {data.assignmentHistory.map((event) => (
              <li key={event.id}>
                {event.createdAt} · {event.userName}{" "}
                {event.action === "assigned" ? "배정" : "해제"} · 처리{" "}
                {event.actorName ?? "시스템"}
              </li>
            ))}
          </ol>
        </section>
      )}

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
          {(fieldRecord.checklist?.length ?? 0) > 0 && (
            <ul className="space-y-1">
              {fieldRecord.checklist?.map((item) => (
                <li key={item.id}>
                  {item.checked ? "✓" : "○"} {item.label}
                  {item.note ? ` — ${item.note}` : ""}
                </li>
              ))}
            </ul>
          )}
          {fieldRecord.issues && <p>특이사항: {fieldRecord.issues}</p>}
          {fieldRecord.notes && <p className="whitespace-pre-wrap">현장 메모: {fieldRecord.notes}</p>}
          {fieldRecord.nextInspectionDate && (
            <p>현장 입력 다음 점검일: {fieldRecord.nextInspectionDate}</p>
          )}
        </div>
      )}

      {nextVisitCandidate && (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-medium text-ink-dim">
              확정 보고서의 다음 점검일
            </p>
            <p className="mt-1 font-semibold">
              {nextVisitCandidate.scheduledDate}
            </p>
          </div>
          {nextVisitCandidate.existingWorkOrderId ? (
            <Link
              href={`/app/work/detail?id=${nextVisitCandidate.existingWorkOrderId}`}
              className="btn-ghost rounded-lg px-4 py-2 text-sm font-medium"
            >
              등록된 다음 작업 보기
            </Link>
          ) : nextVisitCandidate.managedByScheduleId ? (
            <Link
              href="/app/maintenance"
              className="btn-ghost rounded-lg px-4 py-2 text-sm font-medium"
            >
              정기점검 일정에서 관리
            </Link>
          ) : (
            <Link
              href={`/app/work/new?${new URLSearchParams({
                sourceWorkOrderId: workOrder.id,
                sourceReportVersionId: nextVisitCandidate.reportVersionId,
                scheduledDate: nextVisitCandidate.scheduledDate,
                recurring: "1",
              }).toString()}`}
              className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
            >
              다음 정기점검 등록
            </Link>
          )}
        </div>
      )}

      {audio.length > 0 && (
        <div className="card space-y-2 p-4">
          <p className="text-sm font-medium text-ink-dim">음성 원본 ({audio.length})</p>
          {audio.map((memo, index) => (
            <ProtectedAudio
              key={memo.id}
              controls
              preload="metadata"
              src={memo.url}
              className="h-10 w-full"
              aria-label={`현장 음성 원본 ${index + 1}`}
            />
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <div className="card p-4">
          <p className="text-sm font-medium text-ink-dim">사진 ({photos.length})</p>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {photos.map((p) => (
              <ProtectedImage key={p.id} src={p.url} alt={p.caption ?? p.kind} className="aspect-square rounded object-cover" />
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
          {pdfProgress && (
            <p className="mt-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
              {pdfProgress.message}
            </p>
          )}
          <ul className="mt-2 space-y-1 text-sm">
            {reportVersions.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  v{v.version} · {v.reportNumber} · PDF{" "}
                  {v.artifact?.status ?? "없음"}
                </span>
                <span className="flex flex-wrap gap-3">
                  {v.artifact?.status === "ready" ? (
                    <Link href={`/app/print?id=${id}&v=${v.version}`} className="text-primary hover:underline">
                      승인 PDF
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void preparePdf(v.version)}
                      disabled={busy}
                      className="text-primary hover:underline disabled:opacity-50"
                    >
                      PDF 만들기
                    </button>
                  )}
                  {v.signedArtifact?.status === "ready" ? (
                    <Link
                      href={`/app/print?id=${id}&v=${v.version}&signed=1`}
                      className="text-done hover:underline"
                    >
                      서명 PDF
                    </Link>
                  ) : (Boolean(v.signedArtifact) ||
                      (approval?.status === "approved" &&
                        approval.reportVersionId === v.id)) ? (
                    <button
                      type="button"
                      onClick={() => void recoverSignedPdf(v.version)}
                      disabled={busy || v.artifact?.status !== "ready"}
                      className="text-primary hover:underline disabled:opacity-50"
                    >
                      서명본 복구
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card space-y-3 p-4">
        <p className="text-sm font-medium text-ink-dim">승인</p>
        {approval ? (
          <div className="grid gap-1 text-sm text-muted sm:grid-cols-2">
            <p>최근 요청 상태: {APPROVAL_REQUEST_STATUS_LABELS[approval.requestStatus]}</p>
            <p>요청: {formatTimestamp(approval.requestedAt)}</p>
            <p>열람: {approval.viewedAt ? formatTimestamp(approval.viewedAt) : "아직 열람 전"}</p>
            <p>만료: {formatTimestamp(approval.expiresAt)}</p>
          </div>
        ) : (
          <p className="text-sm text-muted">아직 승인 요청이 없습니다</p>
        )}
        {approval?.approvedAt && (
          <p className="text-sm text-done">
            {approval.approverName}
            {approval.approverTitle ? ` (${approval.approverTitle})` : ""} 승인 완료 · {approval.approvedAt}
          </p>
        )}
        {approval?.revisionComment && (
          <p className="text-sm text-red-600">
            {approval.correctionRequestedAt ? "사무실 정정 사유" : "고객 수정 요청"}: {approval.revisionComment}
          </p>
        )}
        {approval?.status === "approved" && (
          <div className="rounded-lg border border-line bg-bg-2 p-3">
            <label className="text-sm font-medium text-ink-dim" htmlFor="correction-comment">
              승인본 정정 시작
            </label>
            <p className="mt-1 text-xs text-muted">
              기존 승인본과 서명은 보존되고, 새 버전을 만든 뒤 다시 승인받습니다.
            </p>
            <textarea
              id="correction-comment"
              className="input mt-2 min-h-20 w-full"
              value={correctionComment}
              onChange={(event) => setCorrectionComment(event.target.value)}
              maxLength={2000}
              placeholder="정정 사유를 입력해주세요"
            />
            <button
              type="button"
              onClick={requestCorrection}
              disabled={busy || !correctionComment.trim()}
              className="btn-ghost mt-2 rounded-lg px-4 py-2 text-sm font-medium"
            >
              정정 작업 시작
            </button>
          </div>
        )}
        <label className="flex items-start gap-2 text-sm text-ink-dim">
          <input
            type="checkbox"
            checked={invalidatePrevious}
            onChange={(event) => setInvalidatePrevious(event.target.checked)}
            className="mt-0.5"
          />
          <span>
            기존 승인 링크 무효화 <span className="text-muted">(권장·기본값)</span>
          </span>
        </label>
        <button
          onClick={sendApprovalLink}
          disabled={
            busy ||
            reportVersions.length === 0 ||
            latestVersion?.artifact?.status !== "ready" ||
            approval?.status === "approved" ||
            (approval?.status === "revision_requested" &&
              approval.reportVersionId === latestVersion?.id)
          }
          className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
        >
          승인 링크 생성·복사
        </button>
        {approval?.status === "revision_requested" &&
          approval.reportVersionId === latestVersion?.id && (
            <p className="text-sm text-red-600">
              수정 요청 내용을 반영해 새 리포트 버전을 확정한 뒤 링크를 생성할 수 있습니다.
            </p>
          )}
        {approval?.status === "approved" && (
          <p className="text-sm text-amber-700">
            승인 완료본을 정정하려면 먼저 정정 사유를 입력해 새 버전 작업을
            시작해주세요.
          </p>
        )}
        {latestVersion && latestVersion.artifact?.status !== "ready" && (
          <p className="text-sm text-amber-700">
            승인 링크는 최신 버전 PDF가 준비된 뒤 생성할 수 있습니다.
          </p>
        )}
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
