"use client";

import type { StructuredDraft, UsedPart } from "@fieldstep/shared";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Detail = Awaited<ReturnType<typeof api.workOrders.get>>;

function StringListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-ink-dim">{label}</p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="input flex-1"
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="btn-ghost rounded px-2 text-sm">
              삭제
            </button>
          </div>
        ))}
        <button onClick={() => onChange([...items, ""])} className="text-sm text-primary hover:underline">
          + 항목 추가
        </button>
      </div>
    </div>
  );
}

function ReviewContent() {
  const id = useSearchParams().get("id") ?? "";
  const [data, setData] = useState<Detail | null>(null);
  const [draft, setDraft] = useState<StructuredDraft | null>(null);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.workOrders
      .get(id)
      .then((d) => {
        setData(d);
        setDraft(d.draft);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기에 실패했습니다"));
  }, [id]);

  if (!id) return <p className="text-sm text-red-600">작업 id가 없습니다</p>;
  if (error && !data) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-muted">불러오는 중…</p>;
  if (!draft) return <p className="text-muted">아직 초안이 생성되지 않았습니다. 현장 제출 후 다시 확인해주세요.</p>;

  const uncertain = draft.uncertainFields;
  const allConfirmed = uncertain.every((f) => confirmed.has(f));

  function toggleConfirm(field: string) {
    setConfirmed((cur) => {
      const next = new Set(cur);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  }

  function updatePart(i: number, patch: Partial<UsedPart>) {
    if (!draft) return;
    const next = draft.usedParts.map((p, idx) => (idx === i ? { ...p, ...patch } : p));
    setDraft({ ...draft, usedParts: next });
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      await api.workOrders.putReport(id, draft);
      setSavedMsg("저장되었습니다");
      setTimeout(() => setSavedMsg(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }

  async function finalize() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      await api.workOrders.putReport(id, draft);
      await api.workOrders.finalizeReport(id);
      setSavedMsg("리포트가 확정되었습니다");
    } catch (err) {
      setError(err instanceof Error ? err.message : "확정에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }

  async function sendApproval() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.workOrders.createApprovalLink(id);
      await navigator.clipboard.writeText(res.url).catch(() => {});
      setSavedMsg(`승인 링크 생성됨: ${res.url}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "승인 링크 생성에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">검토: {data.workOrder.workType}</h1>
        <Link href={`/app/work/detail?id=${id}`} className="text-sm text-primary hover:underline">
          작업 상세로
        </Link>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {savedMsg && <p className="mt-2 text-sm text-done">{savedMsg}</p>}

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        {/* 원본 */}
        <div className="card space-y-3 p-4 text-sm">
          <p className="font-semibold">원본 (현장 입력)</p>
          {data.fieldRecord?.transcript && (
            <div>
              <p className="text-ink-dim">전사</p>
              <p className="mt-1 whitespace-pre-wrap">{data.fieldRecord.transcript}</p>
            </div>
          )}
          {data.fieldRecord?.workSummary && (
            <div>
              <p className="text-ink-dim">현장 요약</p>
              <p className="mt-1">{data.fieldRecord.workSummary}</p>
            </div>
          )}
          {data.fieldRecord?.issues && (
            <div>
              <p className="text-ink-dim">특이사항</p>
              <p className="mt-1">{data.fieldRecord.issues}</p>
            </div>
          )}
          {data.photos.length > 0 && (
            <div>
              <p className="text-ink-dim">사진 ({data.photos.length})</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {data.photos.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.id} src={p.url} alt={p.caption ?? p.kind} className="aspect-square rounded object-cover" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 초안 편집 */}
        <div className="card space-y-4 p-4 text-sm">
          <p className="font-semibold">초안 (편집 가능)</p>
          <label className="flex flex-col gap-1">
            작업 요약
            <textarea
              className="input min-h-16"
              value={draft.workSummary}
              onChange={(e) => setDraft({ ...draft, workSummary: e.target.value })}
            />
            {uncertain.includes("workSummary") && (
              <UncertainBadge confirmed={confirmed.has("workSummary")} onToggle={() => toggleConfirm("workSummary")} />
            )}
          </label>

          <StringListEditor label="조치 사항" items={draft.actions} onChange={(actions) => setDraft({ ...draft, actions })} />
          <StringListEditor label="문제 사항" items={draft.issues} onChange={(issues) => setDraft({ ...draft, issues })} />
          <StringListEditor
            label="권고 사항"
            items={draft.recommendations}
            onChange={(recommendations) => setDraft({ ...draft, recommendations })}
          />

          <div>
            <p className="mb-1 font-medium text-ink-dim">사용 부품</p>
            <div className="space-y-2">
              {draft.usedParts.map((p, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex gap-2">
                    <input className="input flex-1" placeholder="이름" value={p.name} onChange={(e) => updatePart(i, { name: e.target.value })} />
                    <input className="input w-24" placeholder="모델" value={p.model ?? ""} onChange={(e) => updatePart(i, { model: e.target.value })} />
                    <input
                      className="input w-16"
                      type="number"
                      value={p.quantity}
                      onChange={(e) => updatePart(i, { quantity: Number(e.target.value) })}
                    />
                    <input className="input w-14" value={p.unit} onChange={(e) => updatePart(i, { unit: e.target.value })} />
                    <button
                      onClick={() => setDraft({ ...draft, usedParts: draft.usedParts.filter((_, idx) => idx !== i) })}
                      className="btn-ghost rounded px-2"
                    >
                      삭제
                    </button>
                  </div>
                  {(uncertain.includes(`usedParts[${i}].model`) || uncertain.includes(`usedParts[${i}].quantity`)) && (
                    <UncertainBadge
                      confirmed={confirmed.has(`usedParts[${i}].model`) && confirmed.has(`usedParts[${i}].quantity`)}
                      onToggle={() => {
                        toggleConfirm(`usedParts[${i}].model`);
                        toggleConfirm(`usedParts[${i}].quantity`);
                      }}
                    />
                  )}
                </div>
              ))}
              <button
                onClick={() => setDraft({ ...draft, usedParts: [...draft.usedParts, { name: "", quantity: 1, unit: "개" }] })}
                className="text-sm text-primary hover:underline"
              >
                + 부품 추가
              </button>
            </div>
          </div>

          <label className="flex flex-col gap-1">
            다음 점검일
            <input
              type="date"
              className="input"
              value={draft.nextInspectionDate ?? ""}
              onChange={(e) => setDraft({ ...draft, nextInspectionDate: e.target.value || null })}
            />
            {uncertain.includes("nextInspectionDate") && (
              <UncertainBadge
                confirmed={confirmed.has("nextInspectionDate")}
                onToggle={() => toggleConfirm("nextInspectionDate")}
              />
            )}
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={save} disabled={busy} className="btn-ghost rounded-lg px-4 py-2 font-medium">
              저장
            </button>
            <button
              onClick={finalize}
              disabled={busy || !allConfirmed}
              title={!allConfirmed ? "확인이 필요한 항목이 남아있습니다" : undefined}
              className="btn-primary rounded-lg px-4 py-2 font-medium"
            >
              리포트 확정
            </button>
            <button onClick={sendApproval} disabled={busy} className="btn-ghost rounded-lg px-4 py-2 font-medium">
              승인링크 발송
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UncertainBadge({ confirmed, onToggle }: { confirmed: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`mt-1 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
        confirmed ? "bg-done/15 text-done" : "bg-amber-100 text-amber-800"
      }`}
    >
      {confirmed ? "✓ 확인됨" : "⚠ 확인 필요 — 클릭하여 확인"}
    </button>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">불러오는 중…</div>}>
      <ReviewContent />
    </Suspense>
  );
}
