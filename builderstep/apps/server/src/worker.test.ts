import { describe, expect, it } from "vitest";
import { mapEventToStatus } from "./worker.js";
import { featuresFor, isPro } from "@builderstep/shared";

describe("mapEventToStatus", () => {
  it("결제 성공/구독 활성 이벤트는 active", () => {
    expect(mapEventToStatus("payment.succeeded")).toBe("active");
    expect(mapEventToStatus("subscription_activated")).toBe("active");
    expect(mapEventToStatus("subscription.renewed")).toBe("active");
  });
  it("유예/재시도는 grace", () => {
    expect(mapEventToStatus("subscription.past_due")).toBe("grace");
  });
  it("취소/만료/환불 매핑", () => {
    expect(mapEventToStatus("subscription.canceled")).toBe("canceled");
    expect(mapEventToStatus("subscription.expired")).toBe("expired");
    expect(mapEventToStatus("payment.refunded")).toBe("refunded");
  });
  it("모르는 이벤트는 null(저장만)", () => {
    expect(mapEventToStatus("customer.updated")).toBeNull();
  });
});

describe("entitlements", () => {
  it("active/grace만 pro", () => {
    expect(isPro("active")).toBe(true);
    expect(isPro("grace")).toBe(true);
    expect(isPro("canceled")).toBe(false);
    expect(isPro("none")).toBe(false);
  });
  it("무료 상태엔 pro 기능이 제외된다", () => {
    const free = featuresFor("none").map((f) => f.key);
    expect(free).toContain("stage_diagnosis");
    expect(free).not.toContain("expert_sessions");
    const pro = featuresFor("active").map((f) => f.key);
    expect(pro).toContain("expert_sessions");
  });
});

describe("verifyFirebaseToken", () => {
  it("형식이 아닌 토큰은 null", async () => {
    const { verifyFirebaseToken } = await import("./auth.js");
    expect(await verifyFirebaseToken("not-a-jwt")).toBeNull();
    expect(await verifyFirebaseToken("a.b")).toBeNull();
  });
  it("aud/iss가 다르면 서명 검증 전에 null", async () => {
    const { verifyFirebaseToken } = await import("./auth.js");
    const b64 = (o: object) =>
      Buffer.from(JSON.stringify(o)).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    const wrongAud = `${b64({ alg: "RS256", kid: "k" })}.${b64({
      aud: "other-project",
      iss: "https://securetoken.google.com/other-project",
      exp: now + 3600,
      iat: now,
      sub: "u1",
      email: "a@b.c",
    })}.sig`;
    expect(await verifyFirebaseToken(wrongAud)).toBeNull();
  });
  it("만료된 토큰은 null", async () => {
    const { verifyFirebaseToken } = await import("./auth.js");
    const b64 = (o: object) =>
      Buffer.from(JSON.stringify(o)).toString("base64url");
    const past = Math.floor(Date.now() / 1000) - 7200;
    const expired = `${b64({ alg: "RS256", kid: "k" })}.${b64({
      aud: "builderstep-toris",
      iss: "https://securetoken.google.com/builderstep-toris",
      exp: past + 3600,
      iat: past,
      sub: "u1",
      email: "a@b.c",
    })}.sig`;
    expect(await verifyFirebaseToken(expired)).toBeNull();
  });
});

describe("goal gating", () => {
  it("무료는 3개까지, PRO는 무제한", async () => {
    const { canCreateGoal, FREE_GOAL_LIMIT } = await import("@builderstep/shared");
    expect(FREE_GOAL_LIMIT).toBe(3);
    expect(canCreateGoal("none", 2)).toBe(true);
    expect(canCreateGoal("none", 3)).toBe(false);
    expect(canCreateGoal("canceled", 3)).toBe(false);
    expect(canCreateGoal("active", 999)).toBe(true);
    expect(canCreateGoal("grace", 3)).toBe(true);
  });
});
