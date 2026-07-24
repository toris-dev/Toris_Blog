import { describe, expect, it } from "vitest";
import { RuleBasedDraftEngine, parseFieldNotes } from "./draft.js";

describe("parseFieldNotes — 부품 추출", () => {
  it("부품명+수량+단위를 추출한다", () => {
    const draft = parseFieldNotes({ transcript: "6204 베어링 2개 교체함" });
    expect(draft.usedParts).toHaveLength(1);
    expect(draft.usedParts[0]).toMatchObject({
      name: "6204 베어링",
      quantity: 2,
      unit: "개",
    });
  });

  it("EA/세트 단위도 인식한다", () => {
    const draft = parseFieldNotes({ transcript: "오링 5EA 교체함. 씰킷 1세트 교체함" });
    expect(draft.usedParts).toHaveLength(2);
    expect(draft.usedParts[0]).toMatchObject({ name: "오링", quantity: 5, unit: "EA" });
    expect(draft.usedParts[1]).toMatchObject({ name: "씰킷", quantity: 1, unit: "세트" });
  });

  it("수량 미명시 시 quantity=1 + uncertainFields 추가", () => {
    const draft = parseFieldNotes({ transcript: "필터 교체함" });
    expect(draft.usedParts).toHaveLength(1);
    expect(draft.usedParts[0]).toMatchObject({ name: "필터", quantity: 1, unit: "개" });
    expect(draft.uncertainFields).toContain("usedParts[0].quantity");
  });

  it("숫자+한글 혼합 부품명은 model 필드도 uncertain 표시", () => {
    const draft = parseFieldNotes({ transcript: "6204 베어링 2개 교체함" });
    expect(draft.uncertainFields).toContain("usedParts[0].model");
  });

  it("순수 한글 부품명은 model uncertain을 표시하지 않는다", () => {
    const draft = parseFieldNotes({ transcript: "필터 교체함" });
    expect(draft.uncertainFields).not.toContain("usedParts[0].model");
  });

  it("입력 parts는 그대로 신뢰하고 uncertain을 추가하지 않는다", () => {
    const draft = parseFieldNotes({
      transcript: "정상 작동 확인함",
      parts: [{ name: "6204 베어링", quantity: 2, unit: "개" }],
    });
    expect(draft.usedParts).toEqual([{ name: "6204 베어링", quantity: 2, unit: "개" }]);
    expect(draft.uncertainFields).not.toContain("usedParts[0].quantity");
    expect(draft.uncertainFields).not.toContain("usedParts[0].model");
  });

  it("입력 parts + transcript 추출 부품이 함께 누적된다", () => {
    const draft = parseFieldNotes({
      transcript: "필터 교체함",
      parts: [{ name: "오링", quantity: 1, unit: "개" }],
    });
    expect(draft.usedParts).toHaveLength(2);
    expect(draft.usedParts[0]!.name).toBe("오링");
    expect(draft.usedParts[1]!.name).toBe("필터");
    expect(draft.uncertainFields).toContain("usedParts[1].quantity");
  });

  it("교체 '예정' 문구는 부품으로 추출하지 않는다 (권고로만 분류)", () => {
    const draft = parseFieldNotes({ transcript: "타이밍 벨트 교체 예정" });
    expect(draft.usedParts).toHaveLength(0);
    expect(draft.recommendations).toHaveLength(1);
  });
});

describe("parseFieldNotes — 문장 분류", () => {
  it("조치 문장 분류", () => {
    const draft = parseFieldNotes({ transcript: "펌프를 점검함. 배관을 청소함" });
    expect(draft.actions).toEqual(["펌프를 점검함", "배관을 청소함"]);
  });

  it("문제 문장 분류", () => {
    const draft = parseFieldNotes({ transcript: "베어링에서 소음 발생. 배관에 누수 확인" });
    expect(draft.issues).toEqual(["베어링에서 소음 발생", "배관에 누수 확인"]);
  });

  it("권고 문장 분류", () => {
    const draft = parseFieldNotes({ transcript: "다음 방문 시 재점검 필요함" });
    expect(draft.recommendations).toEqual(["다음 방문 시 재점검 필요함"]);
  });
});

describe("parseFieldNotes — 다음 점검일", () => {
  it("명시적 YYYY-MM-DD를 추출한다", () => {
    const draft = parseFieldNotes({ transcript: "다음 점검일은 2026-10-01로 예정함" });
    expect(draft.nextInspectionDate).toBe("2026-10-01");
    expect(draft.uncertainFields).not.toContain("nextInspectionDate");
  });

  it("'N개월 후' 상대 표현은 null + uncertain", () => {
    const draft = parseFieldNotes({ transcript: "3개월 후 재점검 필요함" });
    expect(draft.nextInspectionDate).toBeNull();
    expect(draft.uncertainFields).toContain("nextInspectionDate");
  });

  it("'다음 점검' 상대 표현도 uncertain", () => {
    const draft = parseFieldNotes({ transcript: "다음 점검 시 확인 요망" });
    expect(draft.nextInspectionDate).toBeNull();
    expect(draft.uncertainFields).toContain("nextInspectionDate");
  });

  it("입력 nextInspectionDate가 있으면 transcript보다 우선한다", () => {
    const draft = parseFieldNotes({
      transcript: "3개월 후 재점검 필요함",
      nextInspectionDate: "2026-12-01",
    });
    expect(draft.nextInspectionDate).toBe("2026-12-01");
    expect(draft.uncertainFields).not.toContain("nextInspectionDate");
  });

  it("입력 nextInspectionDate가 명시적 null이면 null을 그대로 유지한다", () => {
    const draft = parseFieldNotes({
      transcript: "다음 점검일은 2026-10-01",
      nextInspectionDate: null,
    });
    expect(draft.nextInspectionDate).toBeNull();
  });

  it("날짜 언급이 전혀 없으면 null이고 uncertain을 추가하지 않는다", () => {
    const draft = parseFieldNotes({ transcript: "펌프를 점검함" });
    expect(draft.nextInspectionDate).toBeNull();
    expect(draft.uncertainFields).not.toContain("nextInspectionDate");
  });
});

describe("parseFieldNotes — workSummary / 빈 입력", () => {
  it("입력 workSummary를 우선 사용한다", () => {
    const draft = parseFieldNotes({
      transcript: "펌프를 점검함",
      workSummary: "정기 점검 수행",
    });
    expect(draft.workSummary).toBe("정기 점검 수행");
  });

  it("workSummary 미입력 시 transcript 첫 문장을 사용한다", () => {
    const draft = parseFieldNotes({ transcript: "펌프를 점검함. 이상 없음" });
    expect(draft.workSummary).toBe("펌프를 점검함");
  });

  it("빈 transcript + 빈 입력이면 예외 없이 빈 초안을 반환한다", () => {
    const draft = parseFieldNotes({ transcript: "" });
    expect(draft).toEqual({
      workSummary: "",
      actions: [],
      usedParts: [],
      checklist: [],
      fieldNotes: "",
      issues: [],
      recommendations: [],
      nextInspectionDate: null,
      uncertainFields: ["workSummary"],
    });
  });

  it("현장 메모와 체크리스트를 초안 근거로 보존한다", () => {
    const draft = parseFieldNotes({
      transcript: "펌프 점검 완료",
      notes: "압력계 수치 정상",
      checklist: [
        { id: "safety", label: "안전 조치 확인", checked: true },
      ],
    });
    expect(draft.fieldNotes).toBe("압력계 수치 정상");
    expect(draft.checklist).toEqual([
      { id: "safety", label: "안전 조치 확인", checked: true },
    ]);
  });

  it("입력 issues는 그대로 신뢰되어 issues 배열 앞에 포함된다", () => {
    const draft = parseFieldNotes({ transcript: "배관에 누수 확인", issues: "고객 민원 접수" });
    expect(draft.issues[0]).toBe("고객 민원 접수");
    expect(draft.issues).toContain("배관에 누수 확인");
  });
});

describe("parseFieldNotes — 부품 중복 방지", () => {
  it("입력 parts에 이미 있는 부품은 transcript에서 다시 추출하지 않는다", () => {
    const result = parseFieldNotes({
      transcript: "6204 베어링 2개 교체 완료",
      parts: [{ name: "6204 베어링", quantity: 2, unit: "EA" }],
    });
    expect(result.usedParts).toHaveLength(1);
    expect(result.usedParts[0]).toEqual({ name: "6204 베어링", quantity: 2, unit: "EA" });
  });

  it("transcript 안에서 같은 부품이 두 번 언급되어도 한 번만 추출한다", () => {
    const result = parseFieldNotes({
      transcript: "에어필터 2개 교체. 에어필터 교체함",
    });
    expect(result.usedParts).toHaveLength(1);
    expect(result.usedParts[0]!.quantity).toBe(2);
  });

  it("부분 일치(포함 관계)도 같은 부품으로 본다", () => {
    const result = parseFieldNotes({
      transcript: "베어링 2개 교체 완료",
      parts: [{ name: "6204 베어링", quantity: 2, unit: "EA" }],
    });
    expect(result.usedParts).toHaveLength(1);
  });
});

describe("RuleBasedDraftEngine", () => {
  it("DraftEngine 인터페이스를 통해 parseFieldNotes와 동일한 결과를 비동기로 반환한다", async () => {
    const engine = new RuleBasedDraftEngine();
    const input = { transcript: "필터 교체함" };
    const result = await engine.generate(input);
    expect(result).toEqual(parseFieldNotes(input));
  });
});
