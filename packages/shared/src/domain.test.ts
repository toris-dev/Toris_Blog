import { describe, expect, it } from "vitest";
import {
  BUSINESS_STAGES,
  PRICING_DEFAULTS,
  builderSchema,
  diagnosisQuestionSchema,
  diagnosisResponseSchema,
  entitlementSchema,
  pricingPlanSchema,
  projectSchema,
  scoreToStage,
  stageMappingSchema,
  type StageMapping,
} from "./domain.js";

const mapping: StageMapping = {
  version: 1,
  tieRule: "lower-stage",
  ranges: [
    { stage: "idea", minScore: 0, maxScore: 10 },
    { stage: "validation", minScore: 11, maxScore: 20 },
    { stage: "mvp", minScore: 21, maxScore: 30 },
  ],
};

describe("scoreToStage", () => {
  it("maps a score strictly inside a range", () => {
    expect(scoreToStage(5, mapping)).toBe("idea");
    expect(scoreToStage(15, mapping)).toBe("validation");
  });

  it("includes the lower boundary of a range", () => {
    expect(scoreToStage(0, mapping)).toBe("idea");
    expect(scoreToStage(11, mapping)).toBe("validation");
    expect(scoreToStage(21, mapping)).toBe("mvp");
  });

  it("includes the upper boundary of a range", () => {
    expect(scoreToStage(10, mapping)).toBe("idea");
    expect(scoreToStage(20, mapping)).toBe("validation");
    expect(scoreToStage(30, mapping)).toBe("mvp");
  });

  it("returns null when no range matches", () => {
    expect(scoreToStage(-1, mapping)).toBeNull();
    expect(scoreToStage(31, mapping)).toBeNull();
  });

  it("resolves overlapping ranges (ties) to the lower stage", () => {
    const overlapping: StageMapping = {
      version: 1,
      tieRule: "lower-stage",
      ranges: [
        { stage: "validation", minScore: 5, maxScore: 20 },
        { stage: "idea", minScore: 0, maxScore: 10 },
        { stage: "mvp", minScore: 8, maxScore: 15 },
      ],
    };

    // score 9 falls inside all three ranges; lower-stage must win regardless
    // of array order.
    expect(scoreToStage(9, overlapping)).toBe("idea");
  });

  it("keeps BUSINESS_STAGES ordered from idea to growth", () => {
    expect(BUSINESS_STAGES[0]).toBe("idea");
    expect(BUSINESS_STAGES[BUSINESS_STAGES.length - 1]).toBe("growth");
  });
});

describe("schema parsing", () => {
  it("parses a valid Builder", () => {
    const result = builderSchema.parse({
      id: "b1",
      provider: "google",
      email: "builder@example.com",
      nickname: "solo-dev",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(result.provider).toBe("google");
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("rejects a Builder with an invalid provider", () => {
    expect(() =>
      builderSchema.parse({
        id: "b1",
        provider: "kakao",
        email: "builder@example.com",
        nickname: "solo-dev",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toThrow();
  });

  it("parses a valid Project with an optional link omitted", () => {
    const result = projectSchema.parse({
      id: "p1",
      builderId: "b1",
      name: "My Product",
      description: "desc",
      stage: "idea",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(result.link).toBeUndefined();
  });

  it("rejects a StageMapping range where minScore > maxScore", () => {
    expect(() =>
      stageMappingSchema.parse({
        version: 1,
        tieRule: "lower-stage",
        ranges: [{ stage: "idea", minScore: 10, maxScore: 0 }],
      }),
    ).toThrow();
  });

  it("parses a valid DiagnosisResponse", () => {
    const result = diagnosisResponseSchema.parse({
      id: "r1",
      projectId: "p1",
      surveyVersion: 1,
      answers: [{ questionId: "q1", optionIndex: 0, score: 5 }],
      totalScore: 5,
      resultStage: "idea",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(result.answers).toHaveLength(1);
  });

  it("rejects a DiagnosisQuestion with fewer than 2 options", () => {
    expect(() =>
      diagnosisQuestionSchema.parse({
        id: "q1",
        order: 0,
        text: "질문",
        options: [{ label: "옵션1", score: 1 }],
      }),
    ).toThrow();
  });

  it("parses a valid Entitlement", () => {
    const result = entitlementSchema.parse({
      builderId: "b1",
      plan: "monthly",
      channel: "APPLE",
      status: "active",
      currentPeriodEnd: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(result.status).toBe("active");
  });

  it("rejects an Entitlement with an invalid status", () => {
    expect(() =>
      entitlementSchema.parse({
        builderId: "b1",
        plan: "monthly",
        channel: "APPLE",
        status: "pending",
        currentPeriodEnd: "2026-02-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toThrow();
  });

  it("exposes valid PRICING_DEFAULTS entries", () => {
    for (const plan of PRICING_DEFAULTS) {
      expect(() => pricingPlanSchema.parse(plan)).not.toThrow();
    }
    expect(PRICING_DEFAULTS.find((p) => p.plan === "monthly")?.priceKrw).toBe(
      9900,
    );
    expect(PRICING_DEFAULTS.find((p) => p.plan === "yearly")?.priceKrw).toBe(
      79000,
    );
  });
});
