"use client";

import {
  draftRegenerationGroupForUncertainField,
  mergeSelectedDraftGroups,
  type DraftRegenerationGroup,
  type StructuredDraft,
  type UsedPart,
} from "@fieldstep/shared";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ProtectedAudio, ProtectedImage } from "@/components/ProtectedMedia";
import { api } from "@/lib/api";
import { generateRuleBasedDraftFromFieldRecord } from "@/lib/draft-regeneration";
import {
  generateApprovalPdfArtifact,
  type PdfArtifactProgress,
} from "@/lib/report-pdf";

type Detail = Awaited<ReturnType<typeof api.workOrders.get>>;

const REGENERATION_OPTIONS: readonly {
  id: DraftRegenerationGroup;
  label: string;
  description: string;
}[] = [
  {
    id: "summary",
    label: "작업 요약",
    description: "현장 요약 또는 전사 첫 문장",
  },
  { id: "actions", label: "조치 사항", description: "점검·교체·수리 문장" },
  { id: "issues", label: "문제 사항", description: "현장 특이사항과 문제 문장" },
  {
    id: "recommendations",
    label: "권고 사항",
    description: "재점검·권장 문장",
  },
  { id: "parts", label: "사용 부품", description: "현장 입력 및 전사 추출 부품" },
  {
    id: "fieldEvidence",
    label: "체크리스트·현장 메모",
    description: "현장 기록의 체크 상태와 메모",
  },
  {
    id: "nextInspection",
    label: "다음 점검일",
    description: "입력 날짜 또는 전사의 명시적 날짜",
  },
];

const INLINE_UNCERTAIN_PART_RE =
  /^usedParts\[\d+\]\.(?:model|quantity)$/u;

function uncertainFieldLabel(field: string): string {
  const group = draftRegenerationGroupForUncertainField(field);
  return (
    REGENERATION_OPTIONS.find((option) => option.id === group)?.label ??
    "추가 필드"
  );
}

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

function ReviewContentForWorkOrder({ id }: { id: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [draft, setDraft] = useState<StructuredDraft | null>(null);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [invalidatePrevious, setInvalidatePrevious] = useState(true);
  const [selectedRegenerationGroups, setSelectedRegenerationGroups] = useState<
    Set<DraftRegenerationGroup>
  >(new Set());
  const [isDirty, setIsDirty] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<PdfArtifactProgress | null>(
    null,
  );

  useEffect(() => {
    if (!id) return;
    api.workOrders
      .get(id)
      .then((d) => {
        setData(d);
        setDraft(
          d.draft
            ? {
                ...d.draft,
                checklist: d.draft.checklist ?? [],
                fieldNotes: d.draft.fieldNotes ?? "",
              }
            : null,
        );
        setConfirmed(new Set());
        setSelectedRegenerationGroups(new Set());
        setIsDirty(false);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기에 실패했습니다"));
  }, [id]);

  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [isDirty]);

  if (!id) return <p className="text-sm text-red-600">작업 id가 없습니다</p>;
  if (error && !data) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-muted">불러오는 중…</p>;
  if (!draft) return <p className="text-muted">아직 초안이 생성되지 않았습니다. 현장 제출 후 다시 확인해주세요.</p>;

  const uncertain = draft.uncertainFields;
  const allConfirmed = uncertain.every((f) => confirmed.has(f));
  const latestVersion = data.reportVersions.at(-1);
  const revisionOpen =
    (data.workOrder.workStatus === "reviewed" ||
      data.workOrder.workStatus === "completed") &&
    data.approval?.status === "revision_requested" &&
    data.approval.reportVersionId === latestVersion?.id;
  const canEdit = data.workOrder.workStatus === "submitted" || revisionOpen;
  const canCreateApprovalLink =
    Boolean(latestVersion) &&
    !canEdit &&
    data.approval?.status !== "approved" &&
    latestVersion?.artifact?.status === "ready";
  const selectedRegenerationLabels = REGENERATION_OPTIONS.filter((option) =>
    selectedRegenerationGroups.has(option.id),
  ).map((option) => option.label);
  const fallbackUncertainFields = uncertain.filter(
    (field) =>
      field !== "workSummary" &&
      field !== "usedParts" &&
      field !== "nextInspectionDate" &&
      !INLINE_UNCERTAIN_PART_RE.test(field),
  );

  function editDraft(patch: Partial<StructuredDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setIsDirty(true);
    setSavedMsg(null);
  }

  function toggleRegenerationGroup(group: DraftRegenerationGroup) {
    setSelectedRegenerationGroups((current) => {
      const next = new Set(current);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  function regenerateSelectedGroups() {
    const fieldRecord = data?.fieldRecord;
    const currentDraft = draft;
    if (
      !fieldRecord ||
      !currentDraft ||
      selectedRegenerationGroups.size === 0 ||
      !canEdit
    ) {
      return;
    }
    try {
      const fresh = generateRuleBasedDraftFromFieldRecord(fieldRecord);
      const next = mergeSelectedDraftGroups(
        currentDraft,
        fresh,
        selectedRegenerationGroups,
      );
      const nextUncertain = new Set(next.uncertainFields);
      setConfirmed((current) => {
        const preserved = new Set<string>();
        for (const field of current) {
          const group = draftRegenerationGroupForUncertainField(field);
          if (
            nextUncertain.has(field) &&
            (group === null || !selectedRegenerationGroups.has(group))
          ) {
            preserved.add(field);
          }
        }
        return preserved;
      });
      setDraft(next);
      setSelectedRegenerationGroups(new Set());
      setIsDirty(true);
      setSavedMsg(null);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "선택 항목을 다시 만들지 못했습니다",
      );
    }
  }

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
    editDraft({ usedParts: next });
  }

  function removePart(index: number) {
    if (!draft) return;
    const uncertainFields = draft.uncertainFields.flatMap((field) => {
      const match = /^usedParts\[(\d+)\]\.(model|quantity)$/u.exec(field);
      if (!match) return [field];
      const currentIndex = Number(match[1]);
      if (currentIndex === index) return [];
      return currentIndex > index
        ? [`usedParts[${currentIndex - 1}].${match[2]}`]
        : [field];
    });
    setConfirmed((current) => {
      const next = new Set<string>();
      for (const field of current) {
        const match = /^usedParts\[(\d+)\]\.(model|quantity)$/u.exec(field);
        if (!match) {
          next.add(field);
          continue;
        }
        const currentIndex = Number(match[1]);
        if (currentIndex === index) continue;
        next.add(
          currentIndex > index
            ? `usedParts[${currentIndex - 1}].${match[2]}`
            : field,
        );
      }
      return next;
    });
    editDraft({
      usedParts: draft.usedParts.filter((_, currentIndex) => currentIndex !== index),
      uncertainFields,
    });
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.workOrders.putReport(id, draft);
      const uncertaintyReconciled =
        draft.uncertainFields.length !== result.draft.uncertainFields.length ||
        draft.uncertainFields.some(
          (field, index) => result.draft.uncertainFields[index] !== field,
        );
      setDraft(result.draft);
      setConfirmed((current) => {
        const serverUncertain = new Set(result.draft.uncertainFields);
        return new Set(
          [...current].filter((field) => serverUncertain.has(field)),
        );
      });
      setIsDirty(false);
      setSavedMsg(
        uncertaintyReconciled
          ? "저장되었습니다. 확인 필요 표시는 서버 검증 결과로 동기화되었습니다."
          : "저장되었습니다",
      );
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
      const saved = await api.workOrders.putReport(id, draft);
      setDraft(saved.draft);
      setIsDirty(false);
      const finalized = await api.workOrders.finalizeReport(id, [...confirmed]);
      setSavedMsg(
        `리포트 v${finalized.reportVersion.version}가 확정되었습니다. 승인 PDF를 생성합니다.`,
      );
      try {
        await generateApprovalPdfArtifact(
          id,
          finalized.reportVersion.version,
          setPdfProgress,
        );
        setSavedMsg(
          `리포트 v${finalized.reportVersion.version}와 승인 PDF가 준비되었습니다`,
        );
      } catch (pdfError) {
        setError(
          `리포트 v${finalized.reportVersion.version}는 확정됐지만 PDF 생성에 실패했습니다. 아래 'PDF 다시 만들기'로 복구해주세요. ${
            pdfError instanceof Error ? pdfError.message : ""
          }`,
        );
      }
      const next = await api.workOrders.get(id);
      setData(next);
      setDraft(next.draft);
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "확정에 실패했습니다");
    } finally {
      setPdfProgress(null);
      setBusy(false);
    }
  }

  async function prepareLatestPdf() {
    if (!latestVersion) return;
    setBusy(true);
    setError(null);
    try {
      await generateApprovalPdfArtifact(
        id,
        latestVersion.version,
        setPdfProgress,
      );
      const next = await api.workOrders.get(id);
      setData(next);
      setSavedMsg(`리포트 v${latestVersion.version} 승인 PDF가 준비되었습니다`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF 생성에 실패했습니다");
    } finally {
      setPdfProgress(null);
      setBusy(false);
    }
  }

  async function sendApproval() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.workOrders.createApprovalLink(id, invalidatePrevious);
      const copied = await navigator.clipboard
        .writeText(res.url)
        .then(() => true)
        .catch(() => false);
      setSavedMsg(
        copied
          ? `승인 링크를 생성해 클립보드에 복사했습니다: ${res.url}`
          : `승인 링크가 생성되었습니다. 직접 복사해주세요: ${res.url}`,
      );
      const next = await api.workOrders.get(id);
      setData(next);
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
      {pdfProgress && (
        <p className="mt-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          {pdfProgress.message}
        </p>
      )}
      {data.approval?.revisionComment && revisionOpen && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {data.approval.correctionRequestedAt ? "사무실 정정 사유" : "고객 수정 요청"}:{" "}
          {data.approval.revisionComment} · 수정 후 새 버전으로 확정해주세요.
        </p>
      )}
      {!canEdit && data.workOrder.workStatus === "reviewed" && (
        <p className="mt-2 rounded-lg bg-bg-2 px-3 py-2 text-sm text-muted">
          확정된 버전은 수정할 수 없습니다. 고객 수정 요청이 접수되면 새 버전을 편집할 수 있습니다.
        </p>
      )}

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
          {data.fieldRecord?.parts.length ? (
            <div>
              <p className="text-ink-dim">현장 입력 부품</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {data.fieldRecord.parts.map((part, index) => (
                  <li key={`${part.name}-${index}`}>
                    {part.name}
                    {part.model ? ` (${part.model})` : ""} · {part.quantity}
                    {part.unit}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {data.fieldRecord?.checklist?.length ? (
            <div>
              <p className="text-ink-dim">체크리스트</p>
              <ul className="mt-1 space-y-1">
                {data.fieldRecord.checklist.map((item) => (
                  <li key={item.id}>
                    {item.checked ? "✓" : "○"} {item.label}
                    {item.note ? ` — ${item.note}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {data.fieldRecord?.notes && (
            <div>
              <p className="text-ink-dim">현장 메모</p>
              <p className="mt-1 whitespace-pre-wrap">{data.fieldRecord.notes}</p>
            </div>
          )}
          {data.fieldRecord?.nextInspectionDate && (
            <div>
              <p className="text-ink-dim">다음 점검일</p>
              <p className="mt-1">{data.fieldRecord.nextInspectionDate}</p>
            </div>
          )}
          {data.audio.length > 0 && (
            <div>
              <p className="text-ink-dim">음성 원본 ({data.audio.length})</p>
              <div className="mt-2 space-y-2">
                {data.audio.map((audio, index) => (
                  <ProtectedAudio
                    key={audio.id}
                    controls
                    preload="metadata"
                    src={audio.url}
                    className="h-10 w-full"
                    aria-label={`현장 음성 원본 ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
          {data.photos.length > 0 && (
            <div>
              <p className="text-ink-dim">사진 ({data.photos.length})</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {data.photos.map((p) => (
                  <ProtectedImage key={p.id} src={p.url} alt={p.caption ?? p.kind} className="aspect-square rounded object-cover" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 초안 편집 */}
        <div className="card space-y-4 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">초안 (편집 가능)</p>
            <p
              className={isDirty ? "font-medium text-amber-700" : "text-muted"}
              role="status"
              aria-live="polite"
            >
              {isDirty
                ? "● 저장되지 않은 변경이 있습니다"
                : "서버에 저장된 상태입니다"}
            </p>
          </div>

          <section
            className="rounded-xl border border-line bg-bg-2 p-3"
            aria-labelledby="selective-regeneration-title"
          >
            <div>
              <h2
                id="selective-regeneration-title"
                className="font-semibold text-ink"
              >
                선택 항목 다시 만들기
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted">
                현재 현장 기록을 규칙 기반 엔진으로 다시 읽습니다. 외부 AI로
                전송하지 않으며, 선택하지 않은 수동 편집값은 그대로 유지됩니다.
              </p>
            </div>
            <fieldset
              className="mt-3 grid gap-2 sm:grid-cols-2"
              disabled={!canEdit || !data.fieldRecord}
            >
              <legend className="sr-only">다시 만들 초안 항목 선택</legend>
              {REGENERATION_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-start gap-2 rounded-lg border border-line bg-white p-2.5 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="checkbox"
                    checked={selectedRegenerationGroups.has(option.id)}
                    onChange={() => toggleRegenerationGroup(option.id)}
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <span>
                    <span className="block font-medium text-ink">
                      {option.label}
                    </span>
                    <span className="block text-xs leading-5 text-muted">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
            {!data.fieldRecord ? (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                현장 기록이 없어 다시 만들 수 없습니다.
              </p>
            ) : selectedRegenerationLabels.length > 0 ? (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                <strong>덮어쓰기 주의:</strong>{" "}
                {selectedRegenerationLabels.join(", ")}의 현재 편집값만 현장
                기록 기준으로 교체됩니다. 실행 후에는 아직 저장되지 않은
                상태이며, 아래 저장 버튼을 눌러야 서버에 반영됩니다.
              </p>
            ) : (
              <p className="mt-3 text-xs text-muted">
                기본 선택은 없음입니다. 다시 만들 항목을 직접 선택해주세요.
              </p>
            )}
            <button
              type="button"
              onClick={regenerateSelectedGroups}
              disabled={
                busy ||
                !canEdit ||
                !data.fieldRecord ||
                selectedRegenerationGroups.size === 0
              }
              className="btn-ghost mt-3 rounded-lg px-3 py-2 font-medium"
            >
              선택한 {selectedRegenerationGroups.size}개 항목 다시 만들기
            </button>
          </section>

          <label className="flex flex-col gap-1">
            작업 요약
            <textarea
              className="input min-h-16"
              value={draft.workSummary}
              onChange={(e) => editDraft({ workSummary: e.target.value })}
            />
            {uncertain.includes("workSummary") && (
              <UncertainBadge confirmed={confirmed.has("workSummary")} onToggle={() => toggleConfirm("workSummary")} />
            )}
          </label>

          <StringListEditor label="조치 사항" items={draft.actions} onChange={(actions) => editDraft({ actions })} />
          <StringListEditor label="문제 사항" items={draft.issues} onChange={(issues) => editDraft({ issues })} />
          <StringListEditor
            label="권고 사항"
            items={draft.recommendations}
            onChange={(recommendations) => editDraft({ recommendations })}
          />
          <label className="flex flex-col gap-1">
            현장 메모
            <textarea
              className="input min-h-16"
              value={draft.fieldNotes ?? ""}
              onChange={(e) => editDraft({ fieldNotes: e.target.value })}
            />
          </label>

          <div>
            <p className="mb-1 font-medium text-ink-dim">체크리스트</p>
            <div className="space-y-2">
              {(draft.checklist ?? []).map((item, index) => (
                <div key={item.id} className="flex items-center gap-2 rounded border border-line p-2">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => {
                      const checklist = [...draft.checklist];
                      checklist[index] = { ...item, checked: e.target.checked };
                      editDraft({ checklist });
                    }}
                    className="h-5 w-5 accent-primary"
                    aria-label={`${item.label} 완료`}
                  />
                  <input
                    className="input min-w-0 flex-1"
                    value={item.label}
                    onChange={(e) => {
                      const checklist = [...draft.checklist];
                      checklist[index] = { ...item, label: e.target.value };
                      editDraft({ checklist });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

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
                      min="0.000001"
                      step="any"
                      value={p.quantity}
                      onChange={(e) => updatePart(i, { quantity: Number(e.target.value) })}
                    />
                    <input className="input w-14" value={p.unit} onChange={(e) => updatePart(i, { unit: e.target.value })} />
                    <button
                      onClick={() => removePart(i)}
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
                onClick={() => editDraft({ usedParts: [...draft.usedParts, { name: "", quantity: 1, unit: "개" }] })}
                className="text-sm text-primary hover:underline"
              >
                + 부품 추가
              </button>
              {uncertain.includes("usedParts") && (
                <UncertainBadge
                  confirmed={confirmed.has("usedParts")}
                  onToggle={() => toggleConfirm("usedParts")}
                />
              )}
            </div>
          </div>

          <label className="flex flex-col gap-1">
            다음 점검일
            <input
              type="date"
              className="input"
              value={draft.nextInspectionDate ?? ""}
              onChange={(e) => editDraft({ nextInspectionDate: e.target.value || null })}
            />
            {uncertain.includes("nextInspectionDate") && (
              <UncertainBadge
                confirmed={confirmed.has("nextInspectionDate")}
                onToggle={() => toggleConfirm("nextInspectionDate")}
              />
            )}
          </label>

          {fallbackUncertainFields.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="font-medium text-amber-900">
                추가 확인이 필요한 항목
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                규칙 엔진이 표시한 항목을 원본과 대조한 뒤 각각 확인해주세요.
              </p>
              <div className="mt-2 space-y-2">
                {fallbackUncertainFields.map((field, index) => (
                  <div
                    key={`${field}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2"
                  >
                    <span>
                      <span className="font-medium text-ink">
                        {uncertainFieldLabel(field)}
                      </span>
                      <code className="ml-2 text-xs text-muted">{field}</code>
                    </span>
                    <UncertainBadge
                      confirmed={confirmed.has(field)}
                      onToggle={() => toggleConfirm(field)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={save} disabled={busy || !canEdit} className="btn-ghost rounded-lg px-4 py-2 font-medium">
              {isDirty ? "변경사항 저장" : "저장"}
            </button>
            <button
              onClick={finalize}
              disabled={busy || isDirty || !allConfirmed || !canEdit}
              title={
                !canEdit
                  ? "현재 상태에서는 새 버전을 확정할 수 없습니다"
                  : isDirty
                    ? "변경사항을 먼저 저장한 뒤 확정해주세요"
                  : !allConfirmed
                    ? "확인이 필요한 항목이 남아있습니다"
                    : undefined
              }
              className="btn-primary rounded-lg px-4 py-2 font-medium"
            >
              {revisionOpen ? "새 버전 확정" : "리포트 확정"}
            </button>
            {latestVersion &&
              !canEdit &&
              latestVersion.artifact?.status !== "ready" && (
                <button
                  onClick={prepareLatestPdf}
                  disabled={busy}
                  className="btn-ghost rounded-lg px-4 py-2 font-medium"
                >
                  PDF 다시 만들기
                </button>
              )}
            {latestVersion?.artifact?.status === "ready" &&
              latestVersion.artifact.pdfUrl && (
                <Link
                  href={`/app/print?id=${encodeURIComponent(id)}&v=${latestVersion.version}`}
                  className="btn-ghost rounded-lg px-4 py-2 font-medium"
                >
                  PDF 확인
                </Link>
              )}
            <button
              onClick={sendApproval}
              disabled={busy || !canCreateApprovalLink}
              className="btn-ghost rounded-lg px-4 py-2 font-medium"
            >
              승인 링크 생성·복사
            </button>
          </div>
          {latestVersion &&
            !canEdit &&
            !canCreateApprovalLink &&
            data.approval?.status !== "approved" && (
              <p className="text-xs text-amber-700">
                승인 링크는 v{latestVersion.version} PDF가 준비된 뒤 생성할 수
                있습니다. 현재 상태: {latestVersion.artifact?.status ?? "없음"}
              </p>
            )}
          {data.approval?.status === "approved" && (
            <p className="text-xs text-amber-700">
              승인 완료본은 작업 상세에서 정정을 시작한 뒤 새 버전으로 다시
              발송할 수 있습니다.
            </p>
          )}
          {canCreateApprovalLink && (
            <label className="flex items-start gap-2 text-xs text-ink-dim">
              <input
                type="checkbox"
                checked={invalidatePrevious}
                onChange={(event) => setInvalidatePrevious(event.target.checked)}
                className="mt-0.5"
              />
              기존 승인 링크 무효화 (권장·기본값)
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewContent() {
  const id = useSearchParams().get("id") ?? "";
  return <ReviewContentForWorkOrder key={id} id={id} />;
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
