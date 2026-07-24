import {
  parseFieldNotes,
  type FieldRecord,
  type StructuredDraft,
} from "@fieldstep/shared";

/**
 * 서버 제출 시와 같은 결정적 규칙으로 현재 현장 기록에서 새 초안을 만든다.
 * null인 선택 입력은 undefined로 전달해 transcript의 명시적 날짜 등을 파싱할 수 있게 한다.
 */
export function generateRuleBasedDraftFromFieldRecord(
  fieldRecord: FieldRecord,
): StructuredDraft {
  return parseFieldNotes({
    transcript: fieldRecord.transcript ?? "",
    workSummary: fieldRecord.workSummary ?? undefined,
    parts: fieldRecord.parts.map((part) => ({ ...part })),
    checklist: fieldRecord.checklist.map((item) => ({ ...item })),
    issues: fieldRecord.issues ?? undefined,
    notes: fieldRecord.notes ?? undefined,
    nextInspectionDate: fieldRecord.nextInspectionDate ?? undefined,
  });
}
