import type { ChecklistItem } from "./domain.js";
import type { UsedPart } from "./draft.js";
import { z } from "zod";

export const FIELD_RECORD_LOCAL_DRAFT_VERSION = 1 as const;

export interface FieldRecordDraftPayload {
  workSummary: string;
  transcript: string;
  parts: UsedPart[];
  checklist: ChecklistItem[];
  issues: string;
  notes: string;
  nextInspectionDate: string | null;
}

export interface StoredFieldRecordDraft {
  version: typeof FIELD_RECORD_LOCAL_DRAFT_VERSION;
  workOrderId: string;
  savedAt: string;
  payload: FieldRecordDraftPayload;
}

export type FieldUploadState =
  | "idle"
  | "recording"
  | "uploading"
  | "failed";

const localFieldRecordDraftSchema = z.object({
  workSummary: z.string(),
  transcript: z.string(),
  parts: z.array(
    z.object({
      name: z.string(),
      model: z.string().optional(),
      quantity: z.number().finite(),
      unit: z.string(),
    }),
  ),
  checklist: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string(),
      checked: z.boolean(),
      note: z.string().optional(),
    }),
  ),
  issues: z.string(),
  notes: z.string(),
  nextInspectionDate: z.string().nullable(),
});

function isValidIsoInstant(value: unknown): value is string {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value))
  );
}

export function createStoredFieldRecordDraft(
  workOrderId: string,
  payload: FieldRecordDraftPayload,
  savedAt = new Date().toISOString(),
): StoredFieldRecordDraft {
  return {
    version: FIELD_RECORD_LOCAL_DRAFT_VERSION,
    workOrderId,
    savedAt,
    payload,
  };
}

/**
 * localStorage는 사용자 입력이므로 신뢰하지 않는다. 현재 작업 ID와 버전이
 * 일치하고 공용 현장기록 스키마를 통과한 경우에만 복구 후보로 사용한다.
 */
export function parseStoredFieldRecordDraft(
  raw: string | null,
  expectedWorkOrderId: string,
): StoredFieldRecordDraft | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredFieldRecordDraft>;
    if (
      value.version !== FIELD_RECORD_LOCAL_DRAFT_VERSION ||
      value.workOrderId !== expectedWorkOrderId ||
      !isValidIsoInstant(value.savedAt)
    ) {
      return null;
    }
    const parsed = localFieldRecordDraftSchema.safeParse(value.payload);
    if (!parsed.success) return null;
    const payload = parsed.data;
    return {
      version: FIELD_RECORD_LOCAL_DRAFT_VERSION,
      workOrderId: expectedWorkOrderId,
      savedAt: value.savedAt,
      payload: {
        workSummary: payload.workSummary,
        transcript: payload.transcript,
        parts: payload.parts,
        checklist: payload.checklist,
        issues: payload.issues,
        notes: payload.notes,
        nextInspectionDate: payload.nextInspectionDate,
      },
    };
  } catch {
    return null;
  }
}

export function shouldRestoreFieldRecordDraft(
  draft: StoredFieldRecordDraft,
  serverUpdatedAt: string | null | undefined,
): boolean {
  if (!serverUpdatedAt || !isValidIsoInstant(serverUpdatedAt)) return true;
  return Date.parse(draft.savedAt) > Date.parse(serverUpdatedAt);
}

export function fieldRecordSubmitIssues(input: {
  payload: FieldRecordDraftPayload;
  photoCount: number;
  uploadState: FieldUploadState;
}): string[] {
  const issues: string[] = [];
  if (!input.payload.transcript.trim() && !input.payload.workSummary.trim()) {
    issues.push("음성 전사 또는 작업 요약을 입력해주세요");
  }
  if (input.photoCount < 1) {
    issues.push("사진이 한 장도 없습니다");
  }
  if (input.uploadState === "recording") {
    issues.push("녹음을 정지한 뒤 제출해주세요");
  } else if (input.uploadState === "uploading") {
    issues.push("미디어 저장이 완료될 때까지 기다려주세요");
  } else if (input.uploadState === "failed") {
    issues.push("실패한 미디어를 재시도하거나 버린 뒤 제출해주세요");
  }
  input.payload.parts.forEach((part, index) => {
    if (!part.name.trim()) {
      issues.push(`사용 부품 ${index + 1}의 이름을 입력해주세요`);
    }
    if (!Number.isFinite(part.quantity) || part.quantity <= 0) {
      issues.push(`사용 부품 ${index + 1}의 수량은 0보다 커야 합니다`);
    }
    if (!part.unit.trim()) {
      issues.push(`사용 부품 ${index + 1}의 단위를 입력해주세요`);
    }
  });
  return issues;
}
