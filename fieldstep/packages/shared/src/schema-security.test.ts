import { describe, expect, it } from "vitest";
import {
  acceptInviteSchema,
  approveSchema,
  assetUpsertSchema,
  billingPutSchema,
  fieldRecordUpsertSchema,
  loginSchema,
  photoCreateSchema,
  signupSchema,
  workOrderCreateSchema,
} from "./schemas.js";

describe("request schema resource limits", () => {
  it("rejects oversized passwords before PBKDF2 work", () => {
    const oversizedPassword = "a".repeat(129);

    expect(
      loginSchema.safeParse({
        email: "worker@example.com",
        password: oversizedPassword,
      }).success,
    ).toBe(false);
    expect(
      signupSchema.safeParse({
        email: "admin@example.com",
        password: oversizedPassword,
        name: "관리자",
        orgName: "현장완료",
      }).success,
    ).toBe(false);
    expect(
      acceptInviteSchema.safeParse({
        token: "a".repeat(64),
        name: "현장 작업자",
        password: oversizedPassword,
      }).success,
    ).toBe(false);
  });

  it("bounds work-order, assignee, and field-record payloads", () => {
    expect(
      workOrderCreateSchema.safeParse({
        scheduledDate: "2026-07-23",
        workType: "점검",
        customerId: "customer-1",
        siteId: "site-1",
        request: "x".repeat(5_001),
        assigneeIds: [],
        intent: "draft",
      }).success,
    ).toBe(false);
    expect(
      workOrderCreateSchema.safeParse({
        scheduledDate: "2026-07-23",
        workType: "점검",
        customerId: "customer-1",
        siteId: "site-1",
        assigneeIds: Array.from({ length: 51 }, (_, index) => `user-${index}`),
        intent: "schedule",
      }).success,
    ).toBe(false);
    expect(
      fieldRecordUpsertSchema.safeParse({
        transcript: "x".repeat(50_001),
      }).success,
    ).toBe(false);
  });

  it("accepts only real calendar dates and bounded billing values", () => {
    expect(
      assetUpsertSchema.safeParse({
        siteId: "site-1",
        name: "펌프",
        installedAt: "2026-02-29",
      }).success,
    ).toBe(false);
    expect(
      billingPutSchema.safeParse({
        amount: Number.POSITIVE_INFINITY,
        billedAt: "2026-07-23",
      }).success,
    ).toBe(false);
    expect(
      billingPutSchema.safeParse({
        amount: 100_000,
        billedAt: "2026-07-23",
        dueAt: "2026-07-31",
        memo: "세금계산서 발행",
      }).success,
    ).toBe(true);
  });
});

describe("image data URL validation", () => {
  const validPng = "data:image/png;base64,iVBORw0KGgo=";

  it("rejects malformed and unsupported photo payloads", () => {
    expect(
      photoCreateSchema.safeParse({
        kind: "before",
        dataUrl: "data:image/svg+xml;base64,PHN2Zz4=",
      }).success,
    ).toBe(false);
    expect(
      photoCreateSchema.safeParse({
        kind: "before",
        dataUrl: "data:image/png;base64,not base64!",
      }).success,
    ).toBe(false);
    expect(
      photoCreateSchema.safeParse({
        kind: "before",
        dataUrl: validPng,
      }).success,
    ).toBe(true);
  });

  it("validates the approval signature image before storing consent", () => {
    expect(
      approveSchema.safeParse({
        name: "김승인",
        signatureDataUrl: "data:image/gif;base64,R0lGODlh",
        agree: true,
      }).success,
    ).toBe(false);
    expect(
      approveSchema.safeParse({
        name: "김승인",
        signatureDataUrl: validPng,
        agree: true,
      }).success,
    ).toBe(true);
  });
});
