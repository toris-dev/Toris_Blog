import { describe, expect, it } from "vitest";
import {
  addCalendarDays,
  isValidCalendarDate,
  nextMaintenanceOccurrence,
  toSeoulDateString,
} from "./date.js";

describe("toSeoulDateString", () => {
  it("서울 자정 직전은 같은 날짜를 반환한다", () => {
    expect(toSeoulDateString(new Date("2026-07-22T14:59:59.999Z"))).toBe("2026-07-22");
  });

  it("서울 자정부터 다음 날짜를 반환한다", () => {
    expect(toSeoulDateString(new Date("2026-07-22T15:00:00.000Z"))).toBe("2026-07-23");
  });

  it("UTC 자정이 지나도 서울 날짜는 유지한다", () => {
    expect(toSeoulDateString(new Date("2026-07-23T00:00:00.000Z"))).toBe("2026-07-23");
  });
});

describe("maintenance calendar arithmetic", () => {
  it("주간 반복은 달력일 기준으로 정확히 7일씩 이동한다", () => {
    expect(
      nextMaintenanceOccurrence("2026-12-29", "weekly", 1),
    ).toBe("2027-01-05");
    expect(
      nextMaintenanceOccurrence("2026-07-23", "weekly", 2),
    ).toBe("2026-08-06");
  });

  it("월말 anchor를 보존해 2월 이후에도 날짜가 영구 이동하지 않는다", () => {
    const february = nextMaintenanceOccurrence(
      "2026-01-31",
      "monthly",
      1,
      "2026-01-31",
    );
    expect(february).toBe("2026-02-28");
    expect(
      nextMaintenanceOccurrence(
        february,
        "monthly",
        1,
        "2026-01-31",
      ),
    ).toBe("2026-03-31");
  });

  it("윤년 anchor는 평년 말일로 clamp한 뒤 다음 윤년에 복원된다", () => {
    const in2025 = nextMaintenanceOccurrence(
      "2024-02-29",
      "monthly",
      12,
      "2024-02-29",
    );
    expect(in2025).toBe("2025-02-28");
    expect(
      nextMaintenanceOccurrence(
        nextMaintenanceOccurrence(
          nextMaintenanceOccurrence(in2025, "monthly", 12, "2024-02-29"),
          "monthly",
          12,
          "2024-02-29",
        ),
        "monthly",
        12,
        "2024-02-29",
      ),
    ).toBe("2028-02-29");
  });

  it("실재하지 않는 날짜와 0 이하 주기를 거부한다", () => {
    expect(isValidCalendarDate("2026-02-29")).toBe(false);
    expect(isValidCalendarDate("2028-02-29")).toBe(true);
    expect(() => addCalendarDays("2026-02-30", 1)).toThrow(RangeError);
    expect(() =>
      nextMaintenanceOccurrence("2026-01-31", "monthly", 0),
    ).toThrow(RangeError);
  });
});
