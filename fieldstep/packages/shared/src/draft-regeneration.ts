import type { StructuredDraft } from "./draft.js";

/**
 * 리뷰 화면에서 사용자가 명시적으로 다시 만들 수 있는 초안 단위.
 * fieldEvidence는 같은 현장 입력에서 오는 체크리스트와 현장 메모를 한 번에 다룬다.
 */
export const DRAFT_REGENERATION_GROUPS = [
  "summary",
  "actions",
  "issues",
  "recommendations",
  "parts",
  "fieldEvidence",
  "nextInspection",
] as const;

export type DraftRegenerationGroup =
  (typeof DRAFT_REGENERATION_GROUPS)[number];

/**
 * uncertainFields 경로를 선택 재생성 그룹으로 분류한다.
 * 미래에 추가되는 알 수 없는 경로는 null로 남겨 병합 과정에서 유실하지 않는다.
 */
export function draftRegenerationGroupForUncertainField(
  field: string,
): DraftRegenerationGroup | null {
  if (field === "workSummary" || field.startsWith("workSummary.")) {
    return "summary";
  }
  if (field === "actions" || field.startsWith("actions[") || field.startsWith("actions.")) {
    return "actions";
  }
  if (field === "issues" || field.startsWith("issues[") || field.startsWith("issues.")) {
    return "issues";
  }
  if (
    field === "recommendations" ||
    field.startsWith("recommendations[") ||
    field.startsWith("recommendations.")
  ) {
    return "recommendations";
  }
  if (
    field === "usedParts" ||
    field.startsWith("usedParts[") ||
    field.startsWith("usedParts.")
  ) {
    return "parts";
  }
  if (
    field === "checklist" ||
    field.startsWith("checklist[") ||
    field.startsWith("checklist.") ||
    field === "fieldNotes" ||
    field.startsWith("fieldNotes.")
  ) {
    return "fieldEvidence";
  }
  if (
    field === "nextInspectionDate" ||
    field.startsWith("nextInspectionDate.")
  ) {
    return "nextInspection";
  }
  return null;
}

/**
 * 새 규칙 엔진 결과를 사용자가 선택한 필드 그룹에만 적용한다.
 *
 * 불변식:
 * - 선택하지 않은 모든 값은 current 그대로 유지한다.
 * - 선택 그룹의 배열/객체는 fresh에서 복제해 가져오며 입력 객체를 변경하지 않는다.
 * - uncertainFields는 선택 그룹에 속한 기존 경로만 제거하고 fresh 경로로 교체한다.
 * - 분류할 수 없는 uncertainFields는 미래 호환성을 위해 항상 보존한다.
 */
export function mergeSelectedDraftGroups(
  current: StructuredDraft,
  fresh: StructuredDraft,
  selectedGroups: Iterable<DraftRegenerationGroup>,
): StructuredDraft {
  const selected = new Set(selectedGroups);
  const merged: StructuredDraft = {
    ...current,
    uncertainFields: [...current.uncertainFields],
  };
  if (selected.size === 0) {
    return merged;
  }

  if (selected.has("summary")) {
    merged.workSummary = fresh.workSummary;
  }
  if (selected.has("actions")) {
    merged.actions = [...fresh.actions];
  }
  if (selected.has("issues")) {
    merged.issues = [...fresh.issues];
  }
  if (selected.has("recommendations")) {
    merged.recommendations = [...fresh.recommendations];
  }
  if (selected.has("parts")) {
    merged.usedParts = fresh.usedParts.map((part) => ({ ...part }));
  }
  if (selected.has("fieldEvidence")) {
    merged.checklist = fresh.checklist.map((item) => ({ ...item }));
    merged.fieldNotes = fresh.fieldNotes;
  }
  if (selected.has("nextInspection")) {
    merged.nextInspectionDate = fresh.nextInspectionDate;
  }

  const preservedUncertain = current.uncertainFields.filter((field) => {
    const group = draftRegenerationGroupForUncertainField(field);
    return group === null || !selected.has(group);
  });
  const regeneratedUncertain = fresh.uncertainFields.filter((field) => {
    const group = draftRegenerationGroupForUncertainField(field);
    return group !== null && selected.has(group);
  });
  merged.uncertainFields = [...preservedUncertain];
  for (const field of regeneratedUncertain) {
    if (!merged.uncertainFields.includes(field)) {
      merged.uncertainFields.push(field);
    }
  }

  return merged;
}
