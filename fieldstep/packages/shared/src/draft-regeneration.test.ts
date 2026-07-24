import { describe, expect, it } from "vitest";
import type { StructuredDraft } from "./draft.js";
import {
  draftRegenerationGroupForUncertainField,
  mergeSelectedDraftGroups,
} from "./draft-regeneration.js";

function currentDraft(): StructuredDraft {
  return {
    workSummary: "사무실에서 다듬은 요약",
    actions: ["수동 조치"],
    usedParts: [
      { name: "수동 부품", model: "M-1", quantity: 3, unit: "EA" },
    ],
    checklist: [
      { id: "manual", label: "수동 체크", checked: true, note: "유지" },
    ],
    fieldNotes: "수동 현장 메모",
    issues: ["수동 문제"],
    recommendations: ["수동 권고"],
    nextInspectionDate: "2026-12-31",
    uncertainFields: [
      "workSummary",
      "actions[0]",
      "usedParts[0].model",
      "checklist[0].note",
      "futureExtension.value",
    ],
  };
}

function freshDraft(): StructuredDraft {
  return {
    workSummary: "새 요약",
    actions: ["새 조치"],
    usedParts: [{ name: "새 부품", quantity: 1, unit: "개" }],
    checklist: [{ id: "fresh", label: "새 체크", checked: false }],
    fieldNotes: "새 현장 메모",
    issues: ["새 문제"],
    recommendations: ["새 권고"],
    nextInspectionDate: null,
    uncertainFields: [
      "actions[0]",
      "usedParts[0].quantity",
      "fieldNotes",
      "nextInspectionDate",
      "futureFreshExtension.value",
    ],
  };
}

describe("mergeSelectedDraftGroups", () => {
  it("선택 그룹만 새로 만들고 선택하지 않은 수동 편집값을 모두 보존한다", () => {
    const current = currentDraft();
    const currentSnapshot = currentDraft();
    const fresh = freshDraft();
    const freshSnapshot = freshDraft();

    const merged = mergeSelectedDraftGroups(current, fresh, [
      "actions",
      "parts",
      "fieldEvidence",
    ]);

    expect(merged.actions).toEqual(["새 조치"]);
    expect(merged.usedParts).toEqual([
      { name: "새 부품", quantity: 1, unit: "개" },
    ]);
    expect(merged.checklist).toEqual([
      { id: "fresh", label: "새 체크", checked: false },
    ]);
    expect(merged.fieldNotes).toBe("새 현장 메모");

    expect(merged.workSummary).toBe("사무실에서 다듬은 요약");
    expect(merged.issues).toEqual(["수동 문제"]);
    expect(merged.recommendations).toEqual(["수동 권고"]);
    expect(merged.nextInspectionDate).toBe("2026-12-31");
    expect(current).toEqual(currentSnapshot);
    expect(fresh).toEqual(freshSnapshot);
  });

  it("불확실성은 선택 그룹만 새 결과로 교체하고 미선택·미분류 경로를 보존한다", () => {
    const merged = mergeSelectedDraftGroups(currentDraft(), freshDraft(), [
      "actions",
      "parts",
      "fieldEvidence",
    ]);

    expect(merged.uncertainFields).toEqual([
      "workSummary",
      "futureExtension.value",
      "actions[0]",
      "usedParts[0].quantity",
      "fieldNotes",
    ]);
    expect(merged.uncertainFields).not.toContain("usedParts[0].model");
    expect(merged.uncertainFields).not.toContain("checklist[0].note");
    expect(merged.uncertainFields).not.toContain("nextInspectionDate");
    expect(merged.uncertainFields).not.toContain("futureFreshExtension.value");
  });

  it("아무 그룹도 선택하지 않으면 값과 불확실성을 그대로 둔다", () => {
    const current = currentDraft();
    const merged = mergeSelectedDraftGroups(current, freshDraft(), []);

    expect(merged).toEqual(current);
  });

  it("요약과 다음 점검일을 독립적으로 선택할 수 있다", () => {
    const merged = mergeSelectedDraftGroups(currentDraft(), freshDraft(), [
      "summary",
      "nextInspection",
    ]);

    expect(merged.workSummary).toBe("새 요약");
    expect(merged.nextInspectionDate).toBeNull();
    expect(merged.actions).toEqual(["수동 조치"]);
    expect(merged.uncertainFields).toEqual([
      "actions[0]",
      "usedParts[0].model",
      "checklist[0].note",
      "futureExtension.value",
      "nextInspectionDate",
    ]);
  });
});

describe("draftRegenerationGroupForUncertainField", () => {
  it("배열 하위 경로와 묶음 필드를 올바른 그룹으로 분류한다", () => {
    expect(draftRegenerationGroupForUncertainField("usedParts[2].model")).toBe(
      "parts",
    );
    expect(draftRegenerationGroupForUncertainField("checklist[1].note")).toBe(
      "fieldEvidence",
    );
    expect(draftRegenerationGroupForUncertainField("fieldNotes")).toBe(
      "fieldEvidence",
    );
    expect(
      draftRegenerationGroupForUncertainField("futureExtension.value"),
    ).toBeNull();
  });
});
