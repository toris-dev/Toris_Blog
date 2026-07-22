import { describe, expect, it } from "vitest";
import {
  buildCommandCards,
  buildWeeklyBriefing,
  commandCardSchema,
  computeRunway,
  daysBetween,
  impactScore,
  rankCommandCards,
  scoreIssue,
  sumLossPrevented,
  todayCommandCenter,
  triageFeatureRequests,
  type CommandCenterInput,
  type FeatureRequest,
  type FinancialSnapshot,
  type LossPrevented,
} from "./command-center.js";

const fr = (over: Partial<FeatureRequest>): FeatureRequest => ({
  id: "f",
  builderId: "b1",
  title: "기능",
  requestCount: 0,
  customerValueKrw: 0,
  revenueChurnImpactKrw: 0,
  strategyFit: 0.5,
  urgency: 0,
  estimatedEffortDays: 1,
  origin: "customer",
  status: "not_now",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  ...over,
});

const NOW = new Date("2026-02-01T09:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const daysAhead = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

const baseSnapshot: FinancialSnapshot = {
  builderId: "b1",
  cashKrw: 30_000_000,
  monthlyRevenueKrw: 5_000_000,
  monthlyFixedCostKrw: 6_000_000,
  monthlyVariableCostKrw: 2_000_000,
  recordedAt: NOW,
};

describe("computeRunway", () => {
  it("현금 / 순소모로 개월 수를 계산한다", () => {
    // burn = (6M + 2M) − 5M = 3M/월, 30M / 3M = 10개월
    const r = computeRunway(baseSnapshot);
    expect(r.netBurnKrw).toBe(3_000_000);
    expect(r.runwayMonths).toBeCloseTo(10);
    expect(r.status).toBe("healthy");
  });

  it("흑자면 runwayMonths=null, healthy", () => {
    const r = computeRunway({ ...baseSnapshot, monthlyRevenueKrw: 9_000_000 });
    expect(r.netBurnKrw).toBeLessThanOrEqual(0);
    expect(r.runwayMonths).toBeNull();
    expect(r.status).toBe("healthy");
  });

  it("3개월 미만이면 critical", () => {
    const r = computeRunway({ ...baseSnapshot, cashKrw: 6_000_000 }); // 2개월
    expect(r.status).toBe("critical");
  });

  it("3~6개월이면 tight", () => {
    const r = computeRunway({ ...baseSnapshot, cashKrw: 12_000_000 }); // 4개월
    expect(r.status).toBe("tight");
  });
});

describe("scoring", () => {
  it("impactScore 는 상한에서 clamp 된다", () => {
    expect(impactScore(0)).toBe(0);
    expect(impactScore(2_500_000)).toBeCloseTo(0.5);
    expect(impactScore(999_000_000)).toBe(1);
  });

  it("scoreIssue = 영향0.6 + 긴급0.4", () => {
    // 영향 상한(=1.0)*0.6 + 긴급1*0.4 = 1.0
    expect(scoreIssue(5_000_000, 1)).toBeCloseTo(1);
    // 영향0 + 긴급0.5*0.4 = 0.2
    expect(scoreIssue(0, 0.5)).toBeCloseTo(0.2);
  });

  it("daysBetween 은 부호 있는 일수", () => {
    expect(daysBetween(daysAgo(3), NOW)).toBeCloseTo(3);
    expect(daysBetween(NOW, daysAgo(3))).toBeCloseTo(-3);
  });
});

describe("buildCommandCards", () => {
  it("연체된 미수금만 카드로 만든다 (기한 전/수금완료 제외)", () => {
    const input: CommandCenterInput = {
      builderId: "b1",
      now: NOW,
      receivables: [
        {
          id: "r1",
          builderId: "b1",
          customer: "A사",
          amountKrw: 3_000_000,
          dueDate: daysAgo(10),
          paidAt: null,
          createdAt: daysAgo(40),
        },
        {
          id: "r2",
          builderId: "b1",
          customer: "B사",
          amountKrw: 1_000_000,
          dueDate: daysAhead(5), // 아직 기한 전
          paidAt: null,
          createdAt: daysAgo(5),
        },
        {
          id: "r3",
          builderId: "b1",
          customer: "C사",
          amountKrw: 9_000_000,
          dueDate: daysAgo(20),
          paidAt: daysAgo(1), // 수금 완료
          createdAt: daysAgo(40),
        },
      ],
    };
    const cards = buildCommandCards(input);
    expect(cards).toHaveLength(1);
    expect(cards[0]!.kind).toBe("receivable_overdue");
    expect(cards[0]!.source).toEqual({ kind: "receivable", id: "r1" });
    expect(cards[0]!.reason).toContain("10일 연체");
    // 모든 카드는 스키마를 만족한다
    expect(() => commandCardSchema.parse(cards[0]!)).not.toThrow();
  });

  it("결제 실패는 재시도 횟수로 긴급도가 오른다", () => {
    const cards = buildCommandCards({
      builderId: "b1",
      now: NOW,
      paymentFailures: [
        {
          id: "p1",
          builderId: "b1",
          subscriptionId: "s1",
          mrrKrw: 100_000,
          failedAt: daysAgo(1),
          retryCount: 2,
          resolvedAt: null,
        },
      ],
    });
    expect(cards).toHaveLength(1);
    expect(cards[0]!.kind).toBe("payment_failed");
    expect(cards[0]!.urgency).toBeCloseTo(0.9); // 0.7 + 2*0.1
  });

  it("마감은 2주 이내만, 초과 건은 긴급도 1", () => {
    const cards = buildCommandCards({
      builderId: "b1",
      now: NOW,
      deadlines: [
        { id: "d1", builderId: "b1", title: "세금 신고", dueDate: daysAgo(2), estimatedImpactKrw: 500_000, doneAt: null },
        { id: "d2", builderId: "b1", title: "먼 일정", dueDate: daysAhead(30), estimatedImpactKrw: 0, doneAt: null },
      ],
    });
    expect(cards).toHaveLength(1);
    expect(cards[0]!.kind).toBe("deadline_near");
    expect(cards[0]!.urgency).toBe(1);
    expect(cards[0]!.title).toContain("초과");
  });

  it("반복 문의는 임계 이상일 때만, 이탈 신호는 항상", () => {
    const cards = buildCommandCards({
      builderId: "b1",
      now: NOW,
      repeatInquiryThreshold: 3,
      signals: [
        { id: "sg1", builderId: "b1", channel: "email", kind: "inquiry", text: "가격 문의", count: 4, estimatedImpactKrw: 0, receivedAt: daysAgo(1) },
        { id: "sg2", builderId: "b1", channel: "chat", kind: "inquiry", text: "한 번", count: 1, estimatedImpactKrw: 0, receivedAt: daysAgo(1) },
        { id: "sg3", builderId: "b1", channel: "survey", kind: "churn", text: "너무 비싸요", count: 1, estimatedImpactKrw: 100_000, receivedAt: daysAgo(1) },
      ],
    });
    const kinds = cards.map((c) => c.kind).sort();
    expect(kinds).toEqual(["churn_risk", "repeat_inquiry"]);
  });

  it("비용 급증은 이전 스냅샷 대비 임계 초과 시", () => {
    const prev: FinancialSnapshot = { ...baseSnapshot, monthlyVariableCostKrw: 2_000_000 };
    const cur: FinancialSnapshot = { ...baseSnapshot, monthlyVariableCostKrw: 4_000_000, recordedAt: daysAhead(1) };
    // 이전 총비용 8M → 현재 10M = +25% (>20%)
    const cards = buildCommandCards({ builderId: "b1", now: NOW, snapshot: cur, previousSnapshot: prev });
    expect(cards).toHaveLength(1);
    expect(cards[0]!.kind).toBe("cost_spike");
    expect(cards[0]!.impactKrw).toBe(2_000_000);
    expect(cards[0]!.title).toContain("25%");
  });
});

describe("rankCommandCards / todayCommandCenter", () => {
  it("점수 내림차순 상위 N개, 동점은 영향 금액 우선", () => {
    const input: CommandCenterInput = {
      builderId: "b1",
      now: NOW,
      receivables: [
        { id: "small", builderId: "b1", customer: "소액", amountKrw: 200_000, dueDate: daysAgo(31), paidAt: null, createdAt: daysAgo(60) },
        { id: "big", builderId: "b1", customer: "거액", amountKrw: 5_000_000, dueDate: daysAgo(31), paidAt: null, createdAt: daysAgo(60) },
      ],
    };
    const top = todayCommandCenter(input, 3);
    // 둘 다 긴급도 1(31일>30 → clamp), 영향 금액 큰 게 먼저
    expect(top[0]!.source.id).toBe("big");
    expect(top[1]!.source.id).toBe("small");
  });

  it("topN 으로 자른다", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      id: `r${i}`,
      builderId: "b1",
      customer: `고객${i}`,
      amountKrw: 1_000_000 + i * 100_000,
      dueDate: daysAgo(15),
      paidAt: null,
      createdAt: daysAgo(40),
    }));
    const top = rankCommandCards(buildCommandCards({ builderId: "b1", now: NOW, receivables: many }), 3);
    expect(top).toHaveLength(3);
    // 점수는 단조 감소
    expect(top[0]!.score).toBeGreaterThanOrEqual(top[1]!.score);
    expect(top[1]!.score).toBeGreaterThanOrEqual(top[2]!.score);
  });
});

describe("triageFeatureRequests (Not Now)", () => {
  it("신호 없는 대표 착상은 Not Now에 남는다", () => {
    const r = triageFeatureRequests([
      fr({ id: "idea", origin: "founder", requestCount: 0, revenueChurnImpactKrw: 0 }),
    ]);
    expect(r.thisWeek).toHaveLength(0);
    expect(r.notNow.map((x) => x.id)).toEqual(["idea"]);
  });

  it("고객 요청이 임계 이상이면 이번 주로 승격", () => {
    const r = triageFeatureRequests(
      [fr({ id: "hot", requestCount: 4, customerValueKrw: 2_000_000 })],
      { promoteThreshold: 3 },
    );
    expect(r.thisWeek.map((x) => x.id)).toEqual(["hot"]);
    expect(r.notNow).toHaveLength(0);
  });

  it("요청 수가 적어도 매출·이탈 영향이 크면 승격", () => {
    const r = triageFeatureRequests(
      [fr({ id: "rev", requestCount: 0, revenueChurnImpactKrw: 3_000_000 })],
      { promoteImpactKrw: 1_000_000 },
    );
    expect(r.thisWeek.map((x) => x.id)).toEqual(["rev"]);
  });

  it("maxThisWeek 로 승격 개수를 제한하고 done 은 제외", () => {
    const reqs = Array.from({ length: 5 }, (_, i) =>
      fr({ id: `h${i}`, requestCount: 5, customerValueKrw: 1_000_000 * (i + 1) }),
    );
    reqs.push(fr({ id: "done", requestCount: 9, status: "done" }));
    const r = triageFeatureRequests(reqs, { maxThisWeek: 2 });
    expect(r.thisWeek).toHaveLength(2);
    expect(r.thisWeek.some((x) => x.id === "done")).toBe(false);
  });
});

describe("sumLossPrevented (핵심 차별점)", () => {
  const items: LossPrevented[] = [
    { id: "l1", builderId: "b1", kind: "recovered_receivable", amountKrw: 3_000_000, note: "", occurredAt: new Date("2026-01-20") },
    { id: "l2", builderId: "b1", kind: "recovered_payment", amountKrw: 100_000, note: "", occurredAt: new Date("2026-01-25") },
    { id: "l3", builderId: "b1", kind: "canceled_subscription", amountKrw: 50_000, note: "", occurredAt: new Date("2026-01-31") },
    { id: "l4", builderId: "b1", kind: "recovered_receivable", amountKrw: 1_000_000, note: "", occurredAt: new Date("2025-12-01") },
  ];

  it("종류별·합계·건수를 집계한다", () => {
    const s = sumLossPrevented(items);
    expect(s.totalKrw).toBe(4_150_000);
    expect(s.byKind.recovered_receivable).toBe(4_000_000);
    expect(s.count).toBe(4);
  });

  it("기간 필터를 적용한다", () => {
    const s = sumLossPrevented(items, { from: new Date("2026-01-01"), to: new Date("2026-02-01") });
    expect(s.totalKrw).toBe(3_150_000); // 12월 건 제외
    expect(s.count).toBe(3);
  });
});

describe("buildWeeklyBriefing", () => {
  it("변화·런웨이·방지손실·위험·다음3개를 한 장으로, 미승인 상태", () => {
    const current: FinancialSnapshot = { ...baseSnapshot };
    const previous: FinancialSnapshot = { ...baseSnapshot, monthlyRevenueKrw: 4_000_000, cashKrw: 33_000_000 };
    const openCards = buildCommandCards({
      builderId: "b1",
      now: NOW,
      deadlines: [
        { id: "d1", builderId: "b1", title: "세금 신고", dueDate: daysAgo(1), estimatedImpactKrw: 500_000, doneAt: null },
        { id: "d2", builderId: "b1", title: "도메인 갱신", dueDate: daysAhead(3), estimatedImpactKrw: 200_000, doneAt: null },
      ],
    });
    const b = buildWeeklyBriefing({
      builderId: "b1",
      weekStart: new Date("2026-01-26"),
      weekEnd: new Date("2026-02-01T23:59:59Z"),
      current,
      previous,
      customerCount: 42,
      prevCustomerCount: 40,
      openCards,
      resolvedCards: [],
      lossPrevented: [
        { id: "l1", builderId: "b1", kind: "recovered_receivable", amountKrw: 2_000_000, note: "", occurredAt: new Date("2026-01-28") },
      ],
      featureRequests: [fr({ id: "idea", origin: "founder", requestCount: 0 })],
    });
    expect(b.revenue.delta).toBe(1_000_000);
    expect(b.cash.delta).toBe(-3_000_000);
    expect(b.customers.delta).toBe(2);
    expect(b.runway.status).toBe("healthy");
    expect(b.lossPrevented.totalKrw).toBe(2_000_000);
    expect(b.remainingRisks.length).toBe(2);
    expect(b.nextFocus.length).toBeLessThanOrEqual(3);
    expect(b.toStop).toContain("기능"); // 신호 없는 대표 착상
    expect(b.approved).toBe(false);
  });
});
