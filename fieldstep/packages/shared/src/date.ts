const SEOUL_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const MAINTENANCE_FREQUENCIES = ["weekly", "monthly"] as const;
export type MaintenanceFrequency = (typeof MAINTENANCE_FREQUENCIES)[number];

type CalendarDateParts = {
  year: number;
  month: number;
  day: number;
};

function parseCalendarDate(value: string): CalendarDateParts | null {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month! - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year: year!, month: month!, day: day! };
}

function formatCalendarDate(parts: CalendarDateParts): string {
  if (
    !Number.isInteger(parts.year) ||
    parts.year < 0 ||
    parts.year > 9_999
  ) {
    throw new RangeError("Calendar date is outside the supported year range");
  }
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function requiredCalendarDate(value: string): CalendarDateParts {
  const parsed = parseCalendarDate(value);
  if (!parsed) {
    throw new RangeError(`Invalid calendar date: ${value}`);
  }
  return parsed;
}

export function isValidCalendarDate(value: string): boolean {
  return parseCalendarDate(value) !== null;
}

/** Adds whole calendar days without depending on the Worker runtime timezone. */
export function addCalendarDays(value: string, days: number): string {
  const parsed = requiredCalendarDate(value);
  if (!Number.isSafeInteger(days)) {
    throw new RangeError("Calendar day offset must be a safe integer");
  }
  const date = new Date(
    Date.UTC(parsed.year, parsed.month - 1, parsed.day + days),
  );
  return formatCalendarDate({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
}

/**
 * Returns the occurrence after `currentDate`.
 *
 * Monthly schedules always use the original anchor day. This keeps
 * 2026-01-31 → 2026-02-28 → 2026-03-31 instead of drifting to March 28.
 */
export function nextMaintenanceOccurrence(
  currentDate: string,
  frequency: MaintenanceFrequency,
  intervalCount: number,
  anchorDate: string = currentDate,
): string {
  const current = requiredCalendarDate(currentDate);
  const anchor = requiredCalendarDate(anchorDate);
  if (!Number.isSafeInteger(intervalCount) || intervalCount < 1) {
    throw new RangeError("Maintenance interval must be a positive integer");
  }
  if (frequency === "weekly") {
    return addCalendarDays(currentDate, intervalCount * 7);
  }
  if (frequency !== "monthly") {
    throw new RangeError(`Unsupported maintenance frequency: ${frequency}`);
  }

  const targetMonthIndex =
    current.year * 12 + (current.month - 1) + intervalCount;
  const targetYear = Math.floor(targetMonthIndex / 12);
  const targetMonthIndexInYear = targetMonthIndex % 12;
  if (targetYear < 0 || targetYear > 9_999) {
    throw new RangeError("Maintenance occurrence exceeds supported year range");
  }
  const lastDay = new Date(
    Date.UTC(targetYear, targetMonthIndexInYear + 1, 0),
  ).getUTCDate();
  return formatCalendarDate({
    year: targetYear,
    month: targetMonthIndexInYear + 1,
    day: Math.min(anchor.day, lastDay),
  });
}

/**
 * Returns the calendar date for an instant in Asia/Seoul as YYYY-MM-DD.
 */
export function toSeoulDateString(date: Date = new Date()): string {
  const parts = SEOUL_DATE_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new RangeError("Unable to format date in Asia/Seoul");
  }

  return `${year}-${month}-${day}`;
}
