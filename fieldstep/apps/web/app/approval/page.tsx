"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { SignaturePad, type SignaturePadHandle } from "@/components/SignaturePad";

type PublicApproval = Awaited<ReturnType<typeof api.public.approval>>;

function ApprovalContent() {
  const token = useSearchParams().get("token") ?? "";
  const [data, setData] = useState<PublicApproval | null>(null);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "approve" | "revision">("view");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [agree, setAgree] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | "approved" | "revision">(null);
  const sigRef = useRef<SignaturePadHandle | null>(null);

  useEffect(() => {
    if (!token) {
      setError("유효하지 않은 승인 링크입니다");
      return;
    }
    api.public
      .approval(token)
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 410) setExpired(true);
        else setError(err instanceof Error ? err.message : "불러오기에 실패했습니다");
      });
  }, [token]);

  async function submitApprove() {
    if (!agree || !name.trim()) return;
    const sig = sigRef.current?.toDataUrl();
    if (!sig) {
      setError("서명을 남겨주세요");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.public.approve(token, { name, title: title || undefined, signatureDataUrl: sig, agree: true });
      setDone("approved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "승인 처리에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }

  async function submitRevision() {
    if (!comment.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.public.requestRevision(token, comment);
      setDone("revision");
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정 요청에 실패했습니다");
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

  if (done) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg px-4 text-center">
        <div className="card max-w-sm p-8">
          <h1 className="text-lg font-bold">
            {done === "approved" ? "승인이 완료되었습니다" : "수정 요청을 전달했습니다"}
          </h1>
          <p className="mt-2 text-sm text-muted">확인해주셔서 감사합니다.</p>
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg px-4 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </main>
    );
  }

  if (!data || !data.reportVersion) {
    return <main className="p-8 text-center text-muted">불러오는 중…</main>;
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
            <button onClick={() => setMode("approve")} className="btn-primary tap-target flex-1 rounded-lg py-3 font-medium">
              승인하기
            </button>
            <button onClick={() => setMode("revision")} className="btn-ghost tap-target flex-1 rounded-lg py-3 font-medium">
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
            <div>
              <p className="mb-1 text-sm">서명</p>
              <SignaturePad ref={sigRef} />
              <button onClick={() => sigRef.current?.clear()} className="mt-1 text-xs text-muted hover:text-ink">
                지우기
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              위 보고서 내용을 확인했으며 승인에 동의합니다.
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
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
            {error && <p className="text-sm text-red-600">{error}</p>}
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
