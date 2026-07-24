import type { FieldRecord } from "@fieldstep/shared";
import { describe, expect, it } from "vitest";
import { generateRuleBasedDraftFromFieldRecord } from "./draft-regeneration";

function fieldRecord(overrides: Partial<FieldRecord> = {}): FieldRecord {
  return {
    workOrderId: "work-1",
    workSummary: null,
    transcript: "펌프를 점검함. 다음 점검일은 2026-10-01로 예정함",
    parts: [{ name: "필터", quantity: 2, unit: "EA" }],
    checklist: [
      { id: "safety", label: "안전 조치 확인", checked: true },
    ],
    issues: "고객 요청 확인",
    notes: "압력계 정상",
    nextInspectionDate: null,
    updatedAt: "2026-07-23T00:00:00.000Z",
    ...overrides,
  };
}

describe("generateRuleBasedDraftFromFieldRecord", () => {
  it("현재 현장 기록 전체를 결정적 초안 입력으로 사용한다", () => {
    const generated = generateRuleBasedDraftFromFieldRecord(fieldRecord());

    expect(generated.workSummary).toBe("펌프를 점검함");
    expect(generated.actions).toContain("펌프를 점검함");
    expect(generated.usedParts).toEqual([
      { name: "필터", quantity: 2, unit: "EA" },
    ]);
    expect(generated.checklist).toEqual([
      { id: "safety", label: "안전 조치 확인", checked: true },
    ]);
    expect(generated.fieldNotes).toBe("압력계 정상");
    expect(generated.issues[0]).toBe("고객 요청 확인");
    expect(generated.nextInspectionDate).toBe("2026-10-01");
  });

  it("현장 담당자가 명시한 요약과 점검일을 transcript 추론보다 우선한다", () => {
    const generated = generateRuleBasedDraftFromFieldRecord(
      fieldRecord({
        workSummary: "수동 현장 요약",
        nextInspectionDate: "2027-01-15",
      }),
    );

    expect(generated.workSummary).toBe("수동 현장 요약");
    expect(generated.nextInspectionDate).toBe("2027-01-15");
  });
});
