"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type ReportArtifactDescriptor } from "@/lib/api";
import { RecoverableError } from "@/components/RecoverableError";
import {
  createTypedSignatureDataUrl,
  SignaturePad,
  type SignaturePadHandle,
} from "@/components/SignaturePad";

type PublicApproval = Awaited<ReturnType<typeof api.public.approval>>;

function ApprovalContent() {
  const token = useSearchParams().get("token") ?? "";
  const [data, setData] = useState<PublicApproval | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "approve" | "revision">("view");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [signatureMethod, setSignatureMethod] = useState<"draw" | "type">("draw");
  const [typedSignature, setTypedSignature] = useState("");
  const [agree, setAgree] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | "approved" | "revision">(null);
  const [signedArtifact, setSignedArtifact] =
    useState<ReportArtifactDescriptor | null>(null);
  const sigRef = useRef<SignaturePadHandle | null>(null);

  const loadApproval = useCallback(async () => {
    setLoading(true);
    setData(null);
    setExpired(false);
    setLoadError(null);
    if (!token) {
      setLoading(false);
      setLoadError("승인 토큰이 링크에 포함되어 있지 않습니다.");
      return;
    }
    try {
      const approval = await api.public.approval(token);
      setData(approval);
    } catch (error) {
      if (error instanceof ApiError && error.status === 410) setExpired(true);
      else setLoadError(error instanceof Error ? error.message : "보고서를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadApproval();
  }, [loadApproval]);

  async function submitApprove() {
    if (!agree || !name.trim()) return;
    const sig =
      signatureMethod === "draw"
        ? sigRef.current?.toDataUrl()
        : createTypedSignatureDataUrl(typedSignature);
    if (!sig) {
      setActionError(
        signatureMethod === "draw"
          ? "서명 영역에 손글씨 서명을 남겨주세요."
          : "서명으로 사용할 이름을 입력해주세요.",
      );
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      const result = await api.public.approve(token, {
        name,
        title: title || undefined,
        signatureDataUrl: sig,
        agree: true,
      });
      setDone("approved");
      setSignedArtifact(result.signedArtifact);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "승인 처리에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }

  async function submitRevision() {
    if (!comment.trim()) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.public.requestRevision(token, comment);
      setDone("revision");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "수정 요청에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }

  if (expired) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg px-4 text-center">
        <div className="card max-w-sm p-8">
          <h1 className="text-lg font-bold">승인 링크가 만료되었습니다</h1>
          <p className="mt-2 text-sm text-muted">담당자에게 새 링크 발송을 요청해주세요.</p>
        </div>
      </main>
    );
  }

  const completedDecision =
    done ??
    (data?.approvalRequestStatus === "approved"
      ? "approved"
      : data?.approvalRequestStatus === "revision_requested"
        ? "revision"
        : null);

  if (completedDecision) {
    const completedSignedArtifact = signedArtifact ?? data?.signedArtifact ?? null;
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg px-4 text-center">
        <div className="card max-w-sm p-8">
          <h1 className="text-lg font-bold">
            {completedDecision === "approved" ? "승인이 완료되었습니다" : "수정 요청을 전달했습니다"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {done ? "확인해주셔서 감사합니다." : "이 링크의 결정은 이미 처리되어 다시 제출할 수 없습니다."}
          </p>
          {completedDecision === "approved" &&
            completedSignedArtifact?.status === "ready" &&
            completedSignedArtifact.pdfUrl && (
              <a
                href={completedSignedArtifact.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary mt-5 inline-flex rounded-lg px-4 py-3 text-sm font-medium"
              >
                서명 완료 PDF 열기
              </a>
            )}
          {completedDecision === "approved" &&
            completedSignedArtifact?.status !== "ready" && (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-left text-sm text-amber-800">
                승인은 정상 완료됐습니다. 서명 PDF는 사무실 담당자가 동일한
                승인 증빙으로 생성하며, 완료 후 이 링크에서 확인할 수 있습니다.
              </p>
            )}
        </div>
      </main>
    );
  }

  if (loadError && !data) {
    const canRetry = Boolean(token);
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg px-4 text-center">
        <div className="w-full max-w-sm">
          <RecoverableError
            title={canRetry ? "승인 보고서를 불러오지 못했습니다" : "승인 링크를 확인할 수 없습니다"}
            message={loadError}
            nextAction={
              canRetry
                ? "네트워크 연결을 확인한 뒤 보고서를 다시 불러와주세요."
                : "받은 메시지에서 링크 전체를 다시 열거나 담당자에게 새 링크를 요청해주세요."
            }
            onRetry={canRetry ? () => void loadApproval() : undefined}
            retryLabel="보고서 다시 불러오기"
          />
        </div>
      </main>
    );
  }

  if (loading || !data || !data.reportVersion) {
    return (
      <main role="status" className="p-8 text-center text-muted">
        승인 보고서를 불러오는 중…
      </main>
    );
  }

  const { reportVersion } = data;
  const s = reportVersion.structured;

  return (
    <main className="min-h-dvh bg-bg px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <p className="text-sm text-muted">{data.org.name}</p>
          <h1 className="text-xl font-bold">작업완료보고서 승인</h1>
          <p className="mt-1 text-sm text-muted">
            {reportVersion.reportNumber} · v{reportVersion.version} · {reportVersion.workOrder.scheduledDate}
          </p>
        </header>

        {reportVersion.artifact?.status === "ready" &&
          reportVersion.artifact.pdfUrl && (
            <a
              href={reportVersion.artifact.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="mb-4 inline-flex items-center rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-primary"
            >
              공식 PDF 원본 열기
            </a>
          )}

        <div className="card space-y-4 p-6">
          <Row label="고객" value={reportVersion.customer.name} />
          <Row label="현장" value={reportVersion.site.name} />
          <Row label="장비" value={reportVersion.asset?.name ?? "-"} />
          <Row label="작업 요약" value={s.workSummary || "-"} />
          {s.actions.length > 0 && <ListRow label="조치 사항" items={s.actions} />}
          {s.issues.length > 0 && <ListRow label="문제 사항" items={s.issues} />}
          {s.recommendations.length > 0 && <ListRow label="권고 사항" items={s.recommendations} />}
          {s.usedParts.length > 0 && (
            <div>
              <p className="text-sm font-medium text-ink-dim">사용 부품</p>
              <ul className="mt-1 text-sm">
                {s.usedParts.map((p, i) => (
                  <li key={i}>
                    {p.name} {p.model ? `(${p.model})` : ""} — {p.quantity}
                    {p.unit}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(s.checklist?.length ?? 0) > 0 && (
            <div>
              <p className="text-sm font-medium text-ink-dim">현장 체크리스트</p>
              <ul className="mt-1 space-y-1 text-sm">
                {s.checklist.map((item) => (
                  <li key={item.id}>
                    {item.checked ? "✓" : "○"} {item.label}
                    {item.note ? ` — ${item.note}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {s.fieldNotes && <Row label="현장 메모" value={s.fieldNotes} />}
          {s.nextInspectionDate && (
            <Row label="다음 점검일" value={s.nextInspectionDate} />
          )}
          {reportVersion.photos.length > 0 && (
            <div>
              <p className="text-sm font-medium text-ink-dim">사진</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {reportVersion.photos.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.id} src={p.url} alt={p.caption ?? p.kind} className="aspect-square rounded object-cover" />
                ))}
              </div>
            </div>
          )}
        </div>

        {mode === "view" && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setActionError(null);
                setMode("approve");
              }}
              className="btn-primary tap-target flex-1 rounded-lg py-3 font-medium"
            >
              승인하기
            </button>
            <button
              onClick={() => {
                setActionError(null);
                setMode("revision");
              }}
              className="btn-ghost tap-target flex-1 rounded-lg py-3 font-medium"
            >
              수정 요청
            </button>
          </div>
        )}

        {mode === "approve" && (
          <div className="card mt-6 space-y-4 p-6">
            <h2 className="font-semibold">서명 및 승인</h2>
            <label className="flex flex-col gap-1 text-sm">
              이름
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              직책 (선택)
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">서명 방법</legend>
              <div className="grid grid-cols-2 gap-2">
                <label className="tap-target flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="signature-method"
                    value="draw"
                    checked={signatureMethod === "draw"}
                    onChange={() => {
                      setActionError(null);
                      setSignatureMethod("draw");
                    }}
                  />
                  직접 그리기
                </label>
                <label className="tap-target flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="signature-method"
                    value="type"
                    checked={signatureMethod === "type"}
                    onChange={() => {
                      setActionError(null);
                      setSignatureMethod("type");
                    }}
                  />
                  이름으로 서명
                </label>
              </div>
              {signatureMethod === "draw" ? (
                <div>
                  <p className="mb-1 text-xs leading-5 text-muted">
                    아래 영역에 마우스나 손가락으로 서명하세요. 키보드 사용자는 이름으로
                    서명을 선택할 수 있습니다.
                  </p>
                  <SignaturePad ref={sigRef} />
                  <button
                    type="button"
                    onClick={() => sigRef.current?.clear()}
                    className="btn-ghost tap-target mt-2 rounded-lg px-3 py-2 text-sm text-muted hover:text-ink"
                  >
                    손글씨 서명 지우기
                  </button>
                </div>
              ) : (
                <label className="flex flex-col gap-1 text-sm">
                  서명으로 사용할 이름
                  <input
                    className="input"
                    value={typedSignature}
                    onChange={(event) => {
                      setActionError(null);
                      setTypedSignature(event.target.value);
                    }}
                    autoComplete="name"
                    placeholder={name || "이름 입력"}
                  />
                  <span className="text-xs leading-5 text-muted">
                    입력한 이름이 서명 이미지로 저장됩니다.
                  </span>
                </label>
              )}
            </fieldset>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              위 보고서 내용을 확인했으며 승인에 동의합니다.
            </label>
            {actionError && (
              <RecoverableError
                title="승인을 완료하지 못했습니다"
                message={actionError}
                nextAction="필수 입력과 서명을 확인한 뒤 승인 확정을 다시 눌러주세요."
                onRetry={() => void submitApprove()}
                retryLabel="승인 다시 시도"
              />
            )}
            <button
              onClick={submitApprove}
              disabled={busy || !agree || !name.trim()}
              className="btn-primary tap-target w-full rounded-lg py-3 font-medium"
            >
              {busy ? "처리 중…" : "승인 확정"}
            </button>
          </div>
        )}

        {mode === "revision" && (
          <div className="card mt-6 space-y-4 p-6">
            <h2 className="font-semibold">수정 요청</h2>
            <textarea
              className="input min-h-28"
              placeholder="수정이 필요한 내용을 적어주세요"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            {actionError && (
              <RecoverableError
                title="수정 요청을 보내지 못했습니다"
                message={actionError}
                nextAction="수정 내용을 확인한 뒤 다시 보내주세요."
                onRetry={() => void submitRevision()}
                retryLabel="수정 요청 다시 보내기"
              />
            )}
            <button
              onClick={submitRevision}
              disabled={busy || !comment.trim()}
              className="btn-primary tap-target w-full rounded-lg py-3 font-medium"
            >
              {busy ? "전송 중…" : "수정 요청 보내기"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function ListRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-medium text-ink-dim">{label}</p>
      <ul className="mt-1 list-disc pl-5 text-sm">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ApprovalPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">불러오는 중…</div>}>
      <ApprovalContent />
    </Suspense>
  );
}
