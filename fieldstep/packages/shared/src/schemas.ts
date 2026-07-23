/**
 * 현장완료 요청/응답 페이로드 Zod 스키마 (server/web 공용 검증 단일 출처).
 */
import { z } from "zod";
import { ROLES } from "./status.js";

// ---------------------------------------------------------------------------
// 인증
// ---------------------------------------------------------------------------

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  orgName: z.string().min(1),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1),
  password: z.string().min(8),
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

export const inviteCreateSchema = z.object({
  email: z.string().email(),
  role: z.enum(ROLES),
});
export type InviteCreateInput = z.infer<typeof inviteCreateSchema>;

// ---------------------------------------------------------------------------
// 고객 / 현장 / 자산
// ---------------------------------------------------------------------------

export const customerUpsertSchema = z.object({
  name: z.string().min(1),
  bizNo: z.string().optional(),
  address: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  memo: z.string().optional(),
});
export type CustomerUpsertInput = z.infer<typeof customerUpsertSchema>;

export const siteUpsertSchema = z.object({
  customerId: z.string().min(1),
  name: z.string().min(1),
  address: z.string().optional(),
  accessInfo: z.string().optional(),
  mapUrl: z.string().optional(),
});
export type SiteUpsertInput = z.infer<typeof siteUpsertSchema>;

export const assetUpsertSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1),
  model: z.string().optional(),
  serialNo: z.string().optional(),
  installedAt: z.string().optional(),
});
export type AssetUpsertInput = z.infer<typeof assetUpsertSchema>;

// ---------------------------------------------------------------------------
// 작업 (WorkOrder)
// ---------------------------------------------------------------------------

export const workOrderCreateSchema = z.object({
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다"),
  scheduledTime: z.string().optional(),
  workType: z.string().min(1),
  customerId: z.string().min(1),
  siteId: z.string().min(1),
  assetId: z.string().optional(),
  request: z.string().optional(),
  assigneeIds: z.array(z.string()),
});
export type WorkOrderCreateInput = z.infer<typeof workOrderCreateSchema>;

export const workOrderPatchSchema = workOrderCreateSchema.partial();
export type WorkOrderPatchInput = z.infer<typeof workOrderPatchSchema>;

export const assignSchema = z.object({
  userIds: z.array(z.string()).min(1),
});
export type AssignInput = z.infer<typeof assignSchema>;

// ---------------------------------------------------------------------------
// 현장 기록 / 사진 / 리포트
// ---------------------------------------------------------------------------

export const usedPartSchema = z.object({
  name: z.string().min(1),
  model: z.string().optional(),
  quantity: z.number(),
  unit: z.string().min(1),
});

export const fieldRecordUpsertSchema = z.object({
  workSummary: z.string().optional(),
  transcript: z.string().optional(),
  parts: z.array(usedPartSchema).optional(),
  issues: z.string().optional(),
  notes: z.string().optional(),
  nextInspectionDate: z.string().nullable().optional(),
});
export type FieldRecordUpsertInput = z.infer<typeof fieldRecordUpsertSchema>;

/**
 * 업로드 data URL 상한 — 클라이언트는 1280px/JPEG q0.7로 압축해 통상 수백 KB지만,
 * 신뢰할 수 없는 클라이언트가 대용량을 보내 D1을 불안정화하지 못하도록 서버측에서도 강제한다.
 */
export const MAX_PHOTO_DATA_URL_CHARS = 2_800_000; // base64 기준 약 2MB 원본 이미지
export const MAX_SIGNATURE_DATA_URL_CHARS = 500_000; // 약 360KB

export const photoCreateSchema = z.object({
  kind: z.enum(["before", "after", "other"]),
  dataUrl: z
    .string()
    .startsWith("data:image/", "이미지 데이터 URL이어야 합니다")
    .max(MAX_PHOTO_DATA_URL_CHARS, "이미지 용량이 너무 큽니다"),
  caption: z.string().optional(),
});
export type PhotoCreateInput = z.infer<typeof photoCreateSchema>;

export const structuredDraftSchema = z.object({
  workSummary: z.string(),
  actions: z.array(z.string()),
  usedParts: z.array(usedPartSchema),
  issues: z.array(z.string()),
  recommendations: z.array(z.string()),
  nextInspectionDate: z.string().nullable(),
  uncertainFields: z.array(z.string()),
});

export const reportPutSchema = z.object({
  structured: structuredDraftSchema,
});
export type ReportPutInput = z.infer<typeof reportPutSchema>;

// ---------------------------------------------------------------------------
// 승인
// ---------------------------------------------------------------------------

export const approveSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  signatureDataUrl: z
    .string()
    .startsWith("data:image/", "이미지 데이터 URL이어야 합니다")
    .max(MAX_SIGNATURE_DATA_URL_CHARS, "서명 이미지 용량이 너무 큽니다"),
  agree: z.literal(true),
});
export type ApproveInput = z.infer<typeof approveSchema>;

export const revisionRequestSchema = z.object({
  comment: z.string().min(1),
});
export type RevisionRequestInput = z.infer<typeof revisionRequestSchema>;

// ---------------------------------------------------------------------------
// 청구
// ---------------------------------------------------------------------------

export const billingPutSchema = z.object({
  amount: z.number().optional(),
  billedAt: z.string().optional(),
  dueAt: z.string().optional(),
  paidAt: z.string().optional(),
  memo: z.string().optional(),
});
export type BillingPutInput = z.infer<typeof billingPutSchema>;
