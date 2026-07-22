import { describe, expect, it } from "vitest";
import type { EntitlementStatus } from "@builderstep/shared";
import { PRO_PATHS, isProPath, proGateDecision } from "./features.js";

const FREE_STATUSES: EntitlementStatus[] = [
  "none",
  "canceled",
  "expired",
  "refunded",
];
const PRO_STATUSES: EntitlementStatus[] = ["active", "grace"];

describe("isProPath", () => {
  it("PRO_PATHS 프리픽스를 포함하는 경로는 pro 경로다", () => {
    for (const p of PRO_PATHS) {
      expect(isProPath(`/api/command-center${p}`)).toBe(true);
      expect(isProPath(`${p}/latest`)).toBe(true);
    }
  });

  it("무료 미리보기 경로(/command-center, /me, /goals 등)는 pro 경로가 아니다", () => {
    expect(isProPath("/api/command-center")).toBe(false);
    expect(isProPath("/api/me")).toBe(false);
    expect(isProPath("/api/goals")).toBe(false);
    expect(isProPath("/api/posts")).toBe(false);
    expect(isProPath("/api/metrics")).toBe(false);
    expect(isProPath("/health")).toBe(false);
  });

  it("PRO_PATHS는 8개 프리픽스를 정확히 정의한다", () => {
    expect([...PRO_PATHS]).toEqual([
      "/finance",
      "/receivables",
      "/payment-failures",
      "/deadlines",
      "/signals",
      "/feature-requests",
      "/loss-prevented",
      "/weekly-briefing",
    ]);
  });
});

describe("proGateDecision", () => {
  it("무료 상태는 모든 PRO 경로에서 차단된다", () => {
    for (const status of FREE_STATUSES) {
      for (const p of PRO_PATHS) {
        expect(proGateDecision(status, `/api/command-center${p}`)).toBe("block");
      }
    }
  });

  it("pro 상태(active/grace)는 모든 PRO 경로를 통과한다", () => {
    for (const status of PRO_STATUSES) {
      for (const p of PRO_PATHS) {
        expect(proGateDecision(status, `/api/command-center${p}`)).toBe("allow");
      }
    }
  });

  it("무료 미리보기 경로는 무료 상태에서도 항상 통과한다", () => {
    for (const status of FREE_STATUSES) {
      expect(proGateDecision(status, "/api/command-center")).toBe("allow");
      expect(proGateDecision(status, "/api/me")).toBe("allow");
      expect(proGateDecision(status, "/api/goals")).toBe("allow");
    }
  });

  it("payment-failures가 receivables/finance 프리픽스와 혼동되지 않는다", () => {
    expect(proGateDecision("none", "/api/command-center/payment-failures")).toBe(
      "block",
    );
    expect(proGateDecision("active", "/api/command-center/payment-failures")).toBe(
      "allow",
    );
  });
});
