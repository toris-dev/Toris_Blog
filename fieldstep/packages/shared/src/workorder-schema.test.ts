import { describe, expect, it } from "vitest";
import {
  assignSchema,
  workOrderCreateSchema,
  workOrderPatchSchema,
} from "./schemas.js";

const base = {
  scheduledDate: "2026-07-24",
  scheduledTime: "09:30",
  workType: "정기점검",
  customerId: "customer-1",
  siteId: "site-1",
};

describe("work-order input contracts", () => {
  it.each(["2026-02-30", "2026-13-01", "not-a-date"])(
    "실재하지 않는 작업일 %s를 거부한다",
    (scheduledDate) => {
      expect(
        workOrderCreateSchema.safeParse({
          ...base,
          scheduledDate,
          assigneeIds: ["field-1"],
          intent: "schedule",
        }).success,
      ).toBe(false);
    },
  );

  it.each(["9:30", "24:00", "12:60", "12:30:00"])(
    "잘못된 작업시간 %s를 거부한다",
    (scheduledTime) => {
      expect(
        workOrderCreateSchema.safeParse({
          ...base,
          scheduledTime,
          assigneeIds: ["field-1"],
          intent: "schedule",
        }).success,
      ).toBe(false);
    },
  );

  it("예정 등록은 한 명 이상, 초안 저장은 배정 없음으로 구분한다", () => {
    expect(
      workOrderCreateSchema.safeParse({
        ...base,
        assigneeIds: [],
        intent: "schedule",
      }).success,
    ).toBe(false);
    expect(
      workOrderCreateSchema.safeParse({
        ...base,
        assigneeIds: [],
        intent: "draft",
      }).success,
    ).toBe(true);
    expect(
      workOrderCreateSchema.safeParse({
        ...base,
        assigneeIds: ["field-1"],
        intent: "draft",
      }).success,
    ).toBe(false);
  });

  it("생성·수정·배정에서 담당자 중복을 거부한다", () => {
    expect(
      workOrderCreateSchema.safeParse({
        ...base,
        assigneeIds: ["field-1", "field-1"],
        intent: "schedule",
      }).success,
    ).toBe(false);
    expect(
      workOrderPatchSchema.safeParse({
        assigneeIds: ["field-1", "field-1"],
      }).success,
    ).toBe(false);
    expect(
      assignSchema.safeParse({
        userIds: ["field-1", "field-1"],
      }).success,
    ).toBe(false);
  });

  it("반복 일정은 유효한 예정 작업에만 설정할 수 있다", () => {
    expect(
      workOrderCreateSchema.safeParse({
        ...base,
        assigneeIds: ["field-1"],
        intent: "schedule",
        recurrence: {
          frequency: "monthly",
          intervalCount: 1,
          endDate: "2027-07-24",
        },
      }).success,
    ).toBe(true);
    expect(
      workOrderCreateSchema.safeParse({
        ...base,
        assigneeIds: [],
        intent: "draft",
        recurrence: { frequency: "weekly", intervalCount: 1 },
      }).success,
    ).toBe(false);
  });

  it("확정 보고서 버전 연결은 반복 일정에만 허용한다", () => {
    expect(
      workOrderCreateSchema.safeParse({
        ...base,
        assigneeIds: ["field-1"],
        intent: "schedule",
        sourceReportVersionId: "report-version-1",
      }).success,
    ).toBe(false);
    expect(
      workOrderCreateSchema.safeParse({
        ...base,
        assigneeIds: ["field-1"],
        intent: "schedule",
        recurrence: { frequency: "monthly", intervalCount: 1 },
        sourceReportVersionId: "report-version-1",
      }).success,
    ).toBe(true);
  });

  it("반복 간격과 종료일을 실제 달력 범위로 검증한다", () => {
    expect(
      workOrderCreateSchema.safeParse({
        ...base,
        assigneeIds: ["field-1"],
        intent: "schedule",
        recurrence: { frequency: "weekly", intervalCount: 0 },
      }).success,
    ).toBe(false);
    expect(
      workOrderCreateSchema.safeParse({
        ...base,
        assigneeIds: ["field-1"],
        intent: "schedule",
        recurrence: {
          frequency: "monthly",
          intervalCount: 1,
          endDate: "2026-02-30",
        },
      }).success,
    ).toBe(false);
    expect(
      workOrderCreateSchema.safeParse({
        ...base,
        assigneeIds: ["field-1"],
        intent: "schedule",
        recurrence: {
          frequency: "monthly",
          intervalCount: 1,
          endDate: "2026-07-23",
        },
      }).success,
    ).toBe(false);
  });
});
