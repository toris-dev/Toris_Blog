import { describe, expect, it } from "vitest";
import {
  APPROVAL_LINK_TTL_DAYS,
  canTransition,
  canTransitionApproval,
  canTransitionBilling,
  canTransitionWork,
  computeBillingStatus,
  formatReportNumber,
} from "./status.js";

describe("work status transitions", () => {
  it("허용된 전이는 true", () => {
    expect(canTransitionWork("draft", "scheduled")).toBe(true);
    expect(canTransitionWork("draft", "canceled")).toBe(true);
    expect(canTransitionWork("scheduled", "in_progress")).toBe(true);
    expect(canTransitionWork("in_progress", "submitted")).toBe(true);
    expect(canTransitionWork("submitted", "reviewed")).toBe(true);
    expect(canTransitionWork("reviewed", "completed")).toBe(true);
  });

  it("금지된 전이는 false", () => {
    expect(canTransitionWork("draft", "in_progress")).toBe(false);
    expect(canTransitionWork("draft", "completed")).toBe(false);
    expect(canTransitionWork("completed", "draft")).toBe(false);
    expect(canTransitionWork("submitted", "canceled")).toBe(false);
    expect(canTransitionWork("canceled", "scheduled")).toBe(false);
  });

  it("canTransition 통합 헬퍼가 axis별로 위임한다", () => {
    expect(canTransition("work", "draft", "scheduled")).toBe(true);
    expect(canTransition("work", "draft", "completed")).toBe(false);
  });
});

describe("approval status transitions", () => {
  it("허용된 전이", () => {
    expect(canTransitionApproval("not_sent", "pending")).toBe(true);
    expect(canTransitionApproval("pending", "approved")).toBe(true);
    expect(canTransitionApproval("pending", "revision_requested")).toBe(true);
    expect(canTransitionApproval("pending", "expired")).toBe(true);
    expect(canTransitionApproval("approved", "revision_requested")).toBe(true);
    expect(canTransitionApproval("revision_requested", "pending")).toBe(true);
    expect(canTransitionApproval("expired", "pending")).toBe(true);
  });

  it("금지된 전이", () => {
    expect(canTransitionApproval("not_sent", "approved")).toBe(false);
    expect(canTransitionApproval("approved", "pending")).toBe(false);
    expect(canTransitionApproval("expired", "approved")).toBe(false);
  });

  it("canTransition 통합 헬퍼", () => {
    expect(canTransition("approval", "pending", "approved")).toBe(true);
    expect(canTransition("approval", "approved", "revision_requested")).toBe(true);
  });
});

describe("billing status transitions", () => {
  it("허용된 전이", () => {
    expect(canTransitionBilling("none", "billable")).toBe(true);
    expect(canTransitionBilling("billable", "billed")).toBe(true);
    expect(canTransitionBilling("billed", "overdue")).toBe(true);
    expect(canTransitionBilling("billed", "paid")).toBe(true);
    expect(canTransitionBilling("overdue", "paid")).toBe(true);
  });

  it("금지된 전이", () => {
    expect(canTransitionBilling("none", "billed")).toBe(false);
    expect(canTransitionBilling("paid", "billed")).toBe(false);
    expect(canTransitionBilling("overdue", "billable")).toBe(false);
  });

  it("canTransition 통합 헬퍼", () => {
    expect(canTransition("billing", "billed", "paid")).toBe(true);
    expect(canTransition("billing", "none", "billed")).toBe(false);
  });
});

describe("computeBillingStatus", () => {
  it("paidAt이 있으면 paid", () => {
    expect(
      computeBillingStatus(
        { billedAt: "2026-07-01", dueAt: "2026-07-10", paidAt: "2026-07-05" },
        "2026-07-23",
      ),
    ).toBe("paid");
  });

  it("납기 당일은 overdue가 아니다 (billed 유지)", () => {
    expect(
      computeBillingStatus(
        { billedAt: "2026-07-01", dueAt: "2026-07-23", paidAt: null },
        "2026-07-23",
      ),
    ).toBe("billed");
  });

  it("납기 익일은 overdue", () => {
    expect(
      computeBillingStatus(
        { billedAt: "2026-07-01", dueAt: "2026-07-22", paidAt: null },
        "2026-07-23",
      ),
    ).toBe("overdue");
  });

  it("billedAt만 있고 dueAt이 아직이면 billed", () => {
    expect(
      computeBillingStatus(
        { billedAt: "2026-07-01", dueAt: "2026-08-01", paidAt: null },
        "2026-07-23",
      ),
    ).toBe("billed");
  });

  it("아무것도 없으면 전환 없음(null)", () => {
    expect(
      computeBillingStatus({ billedAt: null, dueAt: null, paidAt: null }, "2026-07-23"),
    ).toBeNull();
  });
});

describe("formatReportNumber", () => {
  it("기본 prefix와 3자리 패딩", () => {
    expect(formatReportNumber("FS", "2026-07-23", 3)).toBe("FS-20260723-003");
  });

  it("두 자리 이상 순번도 패딩 없이 그대로", () => {
    expect(formatReportNumber("FS", "2026-01-05", 42)).toBe("FS-20260105-042");
    expect(formatReportNumber("FS", "2026-01-05", 1234)).toBe("FS-20260105-1234");
  });

  it("prefix 기본값 FS", () => {
    expect(formatReportNumber(undefined, "2026-07-23", 1)).toBe("FS-20260723-001");
  });
});

describe("APPROVAL_LINK_TTL_DAYS", () => {
  it("7일", () => {
    expect(APPROVAL_LINK_TTL_DAYS).toBe(7);
  });
});
