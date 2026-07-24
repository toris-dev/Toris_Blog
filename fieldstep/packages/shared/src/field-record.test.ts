import { describe, expect, it } from "vitest";
import {
  createStoredFieldRecordDraft,
  fieldRecordSubmitIssues,
  parseStoredFieldRecordDraft,
  shouldRestoreFieldRecordDraft,
  type FieldRecordDraftPayload,
} from "./field-record.js";

const payload: FieldRecordDraftPayload = {
  workSummary: "펌프 점검",
  transcript: "",
  parts: [{ name: "필터", quantity: 1, unit: "개" }],
  checklist: [
    { id: "safety", label: "안전 조치 확인", checked: true },
  ],
  issues: "",
  notes: "압력 정상",
  nextInspectionDate: null,
};

describe("field record recovery", () => {
  it("현재 작업의 유효한 local draft만 복구한다", () => {
    const stored = createStoredFieldRecordDraft(
      "wo-1",
      payload,
      "2026-07-23T10:00:00.000Z",
    );
    expect(
      parseStoredFieldRecordDraft(JSON.stringify(stored), "wo-1"),
    ).toEqual(stored);
    expect(
      parseStoredFieldRecordDraft(JSON.stringify(stored), "wo-2"),
    ).toBeNull();
    expect(parseStoredFieldRecordDraft("{broken", "wo-1")).toBeNull();
  });

  it("서버 저장본보다 새로운 입력만 복구한다", () => {
    const stored = createStoredFieldRecordDraft(
      "wo-1",
      payload,
      "2026-07-23T10:00:00.000Z",
    );
    expect(
      shouldRestoreFieldRecordDraft(stored, "2026-07-23T09:59:59.000Z"),
    ).toBe(true);
    expect(
      shouldRestoreFieldRecordDraft(stored, "2026-07-23T10:00:01.000Z"),
    ).toBe(false);
  });
});

describe("field record submit guard", () => {
  it("실패 업로드와 비양수 부품 수량을 제출 차단한다", () => {
    const issues = fieldRecordSubmitIssues({
      payload: {
        ...payload,
        parts: [{ name: "필터", quantity: 0, unit: "개" }],
      },
      photoCount: 1,
      uploadState: "failed",
    });
    expect(issues).toContain(
      "실패한 미디어를 재시도하거나 버린 뒤 제출해주세요",
    );
    expect(issues).toContain("사용 부품 1의 수량은 0보다 커야 합니다");
  });

  it("사진과 텍스트가 있고 업로드가 끝나면 제출 가능하다", () => {
    expect(
      fieldRecordSubmitIssues({
        payload,
        photoCount: 1,
        uploadState: "idle",
      }),
    ).toEqual([]);
  });
});
