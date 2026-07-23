/**
 * 현장완료 상태축 (work / approval / billing) 단일 출처.
 * server(Hono+D1)와 web(Next)이 동일한 전이표를 참조한다.
 */

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

export const ROLES = ["admin", "office", "field"] as const;
export type Role = (typeof ROLES)[number];

// ---------------------------------------------------------------------------
// 1. WorkStatus
// ---------------------------------------------------------------------------

export const WORK_STATUSES = [
  "draft",
  "scheduled",
  "in_progress",
  "submitted",
  "reviewed",
  "completed",
  "canceled",
] as const;
export type WorkStatus = (typeof WORK_STATUSES)[number];

export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  draft: "초안",
  scheduled: "예정",
  in_progress: "진행중",
  submitted: "현장제출",
  reviewed: "검토완료",
  completed: "완료",
  canceled: "취소",
};

const WORK_TRANSITIONS: Record<WorkStatus, readonly WorkStatus[]> = {
  draft: ["scheduled", "canceled"],
  scheduled: ["in_progress", "canceled"],
  in_progress: ["submitted", "canceled"],
  submitted: ["reviewed"],
  reviewed: ["completed"],
  completed: [],
  canceled: [],
};

export function canTransitionWork(from: WorkStatus, to: WorkStatus): boolean {
  return WORK_TRANSITIONS[from].includes(to);
}

// ---------------------------------------------------------------------------
// 2. ApprovalStatus
// ---------------------------------------------------------------------------

export const APPROVAL_STATUSES = [
  "not_sent",
  "pending",
  "approved",
  "revision_requested",
  "expired",
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  not_sent: "미발송",
  pending: "승인대기",
  approved: "승인완료",
  revision_requested: "수정요청",
  expired: "만료",
};

const APPROVAL_TRANSITIONS: Record<ApprovalStatus, readonly ApprovalStatus[]> = {
  not_sent: ["pending"],
  pending: ["approved", "revision_requested", "expired"],
  approved: [],
  revision_requested: ["pending"],
  expired: ["pending"],
};

export function canTransitionApproval(from: ApprovalStatus, to: ApprovalStatus): boolean {
  return APPROVAL_TRANSITIONS[from].includes(to);
}

/** 승인 요청 링크 유효기간 (일). */
export const APPROVAL_LINK_TTL_DAYS = 7;

// ---------------------------------------------------------------------------
// 3. BillingStatus
// ---------------------------------------------------------------------------

export const BILLING_STATUSES = ["none", "billable", "billed", "overdue", "paid"] as const;
export type BillingStatus = (typeof BILLING_STATUSES)[number];

export const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  none: "준비전",
  billable: "청구가능",
  billed: "청구완료",
  overdue: "미수",
  paid: "입금완료",
};

const BILLING_TRANSITIONS: Record<BillingStatus, readonly BillingStatus[]> = {
  none: ["billable"],
  billable: ["billed"],
  billed: ["overdue", "paid"],
  overdue: ["paid"],
  paid: [],
};

export function canTransitionBilling(from: BillingStatus, to: BillingStatus): boolean {
  return BILLING_TRANSITIONS[from].includes(to);
}

// ---------------------------------------------------------------------------
// 4. 통합 헬퍼
// ---------------------------------------------------------------------------

export type StatusAxis = "work" | "approval" | "billing";

export function canTransition(axis: "work", from: WorkStatus, to: WorkStatus): boolean;
export function canTransition(axis: "approval", from: ApprovalStatus, to: ApprovalStatus): boolean;
export function canTransition(axis: "billing", from: BillingStatus, to: BillingStatus): boolean;
export function canTransition(axis: StatusAxis, from: string, to: string): boolean {
  switch (axis) {
    case "work":
      return canTransitionWork(from as WorkStatus, to as WorkStatus);
    case "approval":
      return canTransitionApproval(from as ApprovalStatus, to as ApprovalStatus);
    case "billing":
      return canTransitionBilling(from as BillingStatus, to as BillingStatus);
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// 5. 청구 상태 파생 (결제/납기 레코드로부터 순수 계산)
// ---------------------------------------------------------------------------

export interface BillingRecordLike {
  billedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
}

/**
 * 청구 레코드로부터 다음 BillingStatus를 계산한다 (순수 함수).
 * 전환할 것이 없으면 null을 반환한다 (호출자가 현재 상태를 유지).
 * 날짜 문자열은 "YYYY-MM-DD" (사전순 비교로 충분) 기준.
 */
export function computeBillingStatus(
  rec: BillingRecordLike,
  today: string,
): BillingStatus | null {
  if (rec.paidAt) return "paid";
  if (rec.billedAt && rec.dueAt && rec.dueAt < today) return "overdue";
  if (rec.billedAt) return "billed";
  return null;
}

// ---------------------------------------------------------------------------
// 6. 리포트 번호
// ---------------------------------------------------------------------------

/**
 * 작업 리포트 번호를 생성한다. 예: formatReportNumber("FS", "2026-07-23", 3)
 * → "FS-20260723-003"
 */
export function formatReportNumber(
  prefix: string = "FS",
  dateIso: string,
  seq: number,
): string {
  const compactDate = dateIso.replaceAll("-", "");
  const paddedSeq = String(seq).padStart(3, "0");
  return `${prefix}-${compactDate}-${paddedSeq}`;
}

// ---------------------------------------------------------------------------
// 7. AiStatus / PhotoKind
// ---------------------------------------------------------------------------

export const AI_STATUSES = ["idle", "queued", "processing", "drafted", "failed"] as const;
export type AiStatus = (typeof AI_STATUSES)[number];

export const PHOTO_KINDS = ["before", "after", "other"] as const;
export type PhotoKind = (typeof PHOTO_KINDS)[number];
