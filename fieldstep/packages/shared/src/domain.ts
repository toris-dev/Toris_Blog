/**
 * 현장완료 도메인 엔터티 (API 응답 타이핑용).
 * web/server가 이 타입을 그대로 소비한다 — 실용적 수준(목록/상세 뷰 기준)으로 정의.
 */
import type {
  ApprovalStatus,
  BillingStatus,
  PhotoKind,
  Role,
  WorkStatus,
} from "./status.js";
import type { MaintenanceFrequency } from "./date.js";

// ---------------------------------------------------------------------------
// 조직 / 사용자
// ---------------------------------------------------------------------------

export interface Organization {
  id: string;
  name: string;
  logoUrl: string | null;
  businessNo: string | null;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
}

// ---------------------------------------------------------------------------
// 고객 / 현장 / 자산
// ---------------------------------------------------------------------------

export interface Customer {
  id: string;
  name: string;
  bizNo: string | null;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  memo: string | null;
  active: boolean;
}

export interface Site {
  id: string;
  customerId: string;
  name: string;
  address: string | null;
  accessInfo: string | null;
  mapUrl: string | null;
  active: boolean;
}

export interface Asset {
  id: string;
  siteId: string;
  name: string;
  model: string | null;
  serialNo: string | null;
  installedAt: string | null;
  active: boolean;
}

export interface AssetPhoto {
  id: string;
  assetId: string;
  siteId: string;
  url: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  caption: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// 작업 (WorkOrder)
// ---------------------------------------------------------------------------

/** 목록 뷰용 요약 — 상태 3축 + 일정/고객/현장명. */
export interface WorkOrderSummary {
  id: string;
  workStatus: WorkStatus;
  approvalStatus: ApprovalStatus;
  billingStatus: BillingStatus;
  scheduledDate: string;
  scheduledTime: string | null;
  workType: string;
  customerName: string;
  siteName: string;
  assigneeNames: string[];
  request?: string | null;
  siteAddress?: string | null;
  accessInfo?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
}

export interface WorkOrderDetail extends WorkOrderSummary {
  customerId: string;
  siteId: string;
  assetId: string | null;
  request: string | null;
  assigneeIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NextVisitCandidate {
  scheduledDate: string;
  reportVersionId: string;
  managedByScheduleId: string | null;
  existingWorkOrderId: string | null;
}

export interface AssignmentHistoryItem {
  id: string;
  workOrderId: string;
  userId: string;
  userName: string;
  action: "assigned" | "unassigned";
  actorUserId: string | null;
  actorName: string | null;
  createdAt: string;
}

export type MaintenanceScheduleStatus =
  | "active"
  | "paused"
  | "completed"
  | "canceled";

export interface MaintenanceOccurrence {
  id: string;
  occurrenceDate: string;
  workOrderId: string;
  createdAt: string;
}

export interface MaintenanceSchedule {
  id: string;
  sourceWorkOrderId: string;
  sourceReportVersionId: string | null;
  customerId: string;
  customerName: string;
  siteId: string;
  siteName: string;
  assetId: string | null;
  assetName: string | null;
  scheduledTime: string | null;
  workType: string;
  request: string | null;
  assigneeIds: string[];
  frequency: MaintenanceFrequency;
  intervalCount: number;
  anchorDate: string;
  nextOccurrenceDate: string | null;
  endDate: string | null;
  status: MaintenanceScheduleStatus;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  lastErrorAt: string | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
  occurrences: MaintenanceOccurrence[];
}

// ---------------------------------------------------------------------------
// 현장 기록 / 사진 / 리포트
// ---------------------------------------------------------------------------

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  note?: string;
}

export interface FieldRecord {
  workOrderId: string;
  workSummary: string | null;
  transcript: string | null;
  parts: { name: string; model?: string; quantity: number; unit: string }[];
  checklist: ChecklistItem[];
  issues: string | null;
  notes: string | null;
  nextInspectionDate: string | null;
  updatedAt: string;
}

export interface Photo {
  id: string;
  workOrderId: string;
  kind: PhotoKind;
  url: string;
  caption: string | null;
  createdAt: string;
}

export interface ReportVersionMeta {
  id: string;
  workOrderId: string;
  reportNumber: string;
  version: number;
  createdAt: string;
  createdBy: string;
}

// ---------------------------------------------------------------------------
// 승인 / 청구
// ---------------------------------------------------------------------------

export type ApprovalRequestStatus =
  | "pending"
  | "approved"
  | "revision_requested"
  | "expired"
  | "superseded";

export interface ApprovalInfo {
  workOrderId: string;
  reportVersionId: string;
  status: ApprovalStatus;
  requestStatus: ApprovalRequestStatus;
  requestedAt: string | null;
  expiresAt: string | null;
  viewedAt: string | null;
  approvedAt: string | null;
  approverName: string | null;
  approverTitle: string | null;
  revisionComment: string | null;
  correctionRequestedAt: string | null;
}

export interface BillingInfo {
  workOrderId: string;
  status: BillingStatus;
  amount: number | null;
  billedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  memo: string | null;
}

// ---------------------------------------------------------------------------
// 알림 / 대시보드
// ---------------------------------------------------------------------------

export interface NotificationItem {
  id: string;
  kind: string;
  message: string;
  workOrderId: string | null;
  read: boolean;
  createdAt: string;
}

export interface DashboardCounts {
  today: number;
  inProgress: number;
  submitted: number;
  pendingApproval: number;
  revisionRequested: number;
  billable: number;
  overdue: number;
}
