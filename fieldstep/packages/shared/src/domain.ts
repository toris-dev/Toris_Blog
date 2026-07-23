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

// ---------------------------------------------------------------------------
// 조직 / 사용자
// ---------------------------------------------------------------------------

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
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
}

export interface Site {
  id: string;
  customerId: string;
  name: string;
  address: string | null;
  accessInfo: string | null;
  mapUrl: string | null;
}

export interface Asset {
  id: string;
  siteId: string;
  name: string;
  model: string | null;
  serialNo: string | null;
  installedAt: string | null;
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

// ---------------------------------------------------------------------------
// 현장 기록 / 사진 / 리포트
// ---------------------------------------------------------------------------

export interface FieldRecord {
  workOrderId: string;
  workSummary: string | null;
  transcript: string | null;
  parts: { name: string; model?: string; quantity: number; unit: string }[];
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

export interface ApprovalInfo {
  workOrderId: string;
  status: ApprovalStatus;
  requestedAt: string | null;
  expiresAt: string | null;
  approvedAt: string | null;
  approverName: string | null;
  approverTitle: string | null;
  revisionComment: string | null;
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
