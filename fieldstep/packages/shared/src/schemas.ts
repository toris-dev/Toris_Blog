/**
 * 현장완료 요청/응답 페이로드 Zod 스키마 (server/web 공용 검증 단일 출처).
 */
import { z } from "zod";
import {
  isValidCalendarDate,
  MAINTENANCE_FREQUENCIES,
} from "./date.js";
import { ROLES } from "./status.js";

const httpsUrlSchema = z
  .string()
  .trim()
  .max(2_000)
  .url()
  .refine((value) => value.startsWith("https://"), "HTTPS URL이어야 합니다");

const emailSchema = z.string().trim().toLowerCase().max(254).email();
const passwordSchema = z.string().min(8).max(128);
const identifierSchema = z.string().trim().min(1).max(128);
const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다")
  .refine(isValidCalendarDate, "실제로 존재하는 날짜여야 합니다");

const imageDataUrlSchema = (maximumCharacters: number, sizeMessage: string) =>
  z
    .string()
    .max(maximumCharacters, sizeMessage)
    .refine(
      (value) => {
        const match =
          /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/u.exec(
            value,
          );
        if (!match || match[2]!.length % 4 !== 0) return false;
        return (
          (match[1] === "png" && match[2]!.startsWith("iVBORw0KGgo")) ||
          (match[1] === "jpeg" && match[2]!.startsWith("/9j/")) ||
          (match[1] === "webp" && match[2]!.startsWith("UklGR"))
        );
      },
      "JPEG, PNG 또는 WebP base64 이미지여야 합니다",
    );

// ---------------------------------------------------------------------------
// 인증
// ---------------------------------------------------------------------------

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(100),
  orgName: z.string().trim().min(1).max(200),
  orgLogoUrl: httpsUrlSchema.nullable().optional(),
  orgBusinessNo: z.string().trim().max(32).nullable().optional(),
  orgAddress: z.string().trim().max(500).nullable().optional(),
  orgContactName: z.string().trim().max(100).nullable().optional(),
  orgContactPhone: z.string().trim().max(50).nullable().optional(),
  orgContactEmail: emailSchema.nullable().optional(),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type LoginInput = z.infer<typeof loginSchema>;

export const acceptInviteSchema = z.object({
  token: z.string().trim().min(1).max(256),
  name: z.string().trim().min(1).max(100),
  password: passwordSchema,
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

export const inviteCreateSchema = z.object({
  email: emailSchema,
  role: z.enum(ROLES),
});
export type InviteCreateInput = z.infer<typeof inviteCreateSchema>;

export const organizationUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    logoUrl: httpsUrlSchema.nullable().optional(),
    businessNo: z.string().trim().max(32).nullable().optional(),
    address: z.string().trim().max(500).nullable().optional(),
    contactName: z.string().trim().max(100).nullable().optional(),
    contactPhone: z.string().trim().max(50).nullable().optional(),
    contactEmail: emailSchema.nullable().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "수정할 조직 정보가 필요합니다",
  });
export type OrganizationUpdateInput = z.infer<typeof organizationUpdateSchema>;

// ---------------------------------------------------------------------------
// 고객 / 현장 / 자산
// ---------------------------------------------------------------------------

export const customerUpsertSchema = z.object({
  name: z.string().trim().min(1).max(200),
  bizNo: z.string().trim().max(32).optional(),
  address: z.string().trim().max(500).optional(),
  contactName: z.string().trim().max(100).optional(),
  contactPhone: z.string().trim().max(50).optional(),
  memo: z.string().trim().max(4_000).optional(),
  active: z.boolean().optional(),
});
export type CustomerUpsertInput = z.infer<typeof customerUpsertSchema>;

export const siteUpsertSchema = z.object({
  customerId: identifierSchema,
  name: z.string().trim().min(1).max(200),
  address: z.string().trim().max(500).optional(),
  accessInfo: z.string().trim().max(2_000).optional(),
  mapUrl: z.string().trim().max(2_000).optional(),
  active: z.boolean().optional(),
});
export type SiteUpsertInput = z.infer<typeof siteUpsertSchema>;

export const assetUpsertSchema = z.object({
  siteId: identifierSchema,
  name: z.string().trim().min(1).max(200),
  model: z.string().trim().max(200).optional(),
  serialNo: z.string().trim().max(200).optional(),
  installedAt: z
    .union([calendarDateSchema, z.literal("")])
    .optional()
    .transform((value) => value || undefined),
  active: z.boolean().optional(),
});
export type AssetUpsertInput = z.infer<typeof assetUpsertSchema>;

// ---------------------------------------------------------------------------
// 작업 (WorkOrder)
// ---------------------------------------------------------------------------

const clockTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM 형식이어야 합니다");

const workOrderFields = {
  scheduledDate: calendarDateSchema,
  scheduledTime: clockTimeSchema.optional(),
  workType: z.string().trim().min(1).max(200),
  customerId: identifierSchema,
  siteId: identifierSchema,
  assetId: identifierSchema.optional(),
  request: z.string().trim().max(5_000).optional(),
  assigneeIds: z.array(identifierSchema).max(50),
};

export const maintenanceRecurrenceSchema = z.object({
  frequency: z.enum(MAINTENANCE_FREQUENCIES),
  intervalCount: z.number().int().min(1).max(60),
  endDate: calendarDateSchema.optional(),
});
export type MaintenanceRecurrenceInput = z.infer<
  typeof maintenanceRecurrenceSchema
>;

function addUniqueAssigneeIssue(
  assigneeIds: string[] | undefined,
  ctx: z.RefinementCtx,
): void {
  if (
    assigneeIds &&
    new Set(assigneeIds).size !== assigneeIds.length
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["assigneeIds"],
      message: "같은 담당자를 중복 배정할 수 없습니다",
    });
  }
}

export const workOrderCreateSchema = z
  .object({
    ...workOrderFields,
    /**
     * draft는 담당자 없이 임시 저장하고, schedule은 한 명 이상 배정해
     * 즉시 현장 홈에 노출한다. 생략한 구버전 요청은 서버가 담당자 수로
     * 안전하게 추론한다.
    */
    intent: z.enum(["draft", "schedule"]).optional(),
    recurrence: maintenanceRecurrenceSchema.optional(),
    sourceReportVersionId: identifierSchema.optional(),
  })
  .superRefine((value, ctx) => {
    addUniqueAssigneeIssue(value.assigneeIds, ctx);
    if (value.intent === "schedule" && value.assigneeIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assigneeIds"],
        message: "예정 작업에는 담당자를 한 명 이상 배정해야 합니다",
      });
    }
    if (value.intent === "draft" && value.assigneeIds.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assigneeIds"],
        message: "초안 저장 시에는 담당자를 배정하지 않습니다",
      });
    }
    if (
      value.recurrence &&
      (value.intent === "draft" ||
        (value.intent === undefined && value.assigneeIds.length === 0))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recurrence"],
        message: "반복 일정은 담당자를 배정한 예정 작업에만 설정할 수 있습니다",
      });
    }
    if (
      value.recurrence?.endDate &&
      value.recurrence.endDate < value.scheduledDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recurrence", "endDate"],
        message: "반복 종료일은 첫 작업일보다 빠를 수 없습니다",
      });
    }
    if (value.sourceReportVersionId && !value.recurrence) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceReportVersionId"],
        message: "확정 보고서의 다음 점검일은 반복 일정에만 연결할 수 있습니다",
      });
    }
  });
export type WorkOrderCreateInput = z.infer<typeof workOrderCreateSchema>;

export const maintenanceScheduleSyncSchema = z.object({
  horizonDays: z.number().int().min(1).max(366).default(90),
  rowCap: z.number().int().min(1).max(100).default(50),
});
export type MaintenanceScheduleSyncInput = z.infer<
  typeof maintenanceScheduleSyncSchema
>;

export const maintenanceScheduleActionSchema = z.object({
  action: z.enum(["pause", "resume", "cancel"]),
});
export type MaintenanceScheduleActionInput = z.infer<
  typeof maintenanceScheduleActionSchema
>;

export const workOrderPatchSchema = z
  .object({
    scheduledDate: workOrderFields.scheduledDate.optional(),
    scheduledTime: workOrderFields.scheduledTime,
    workType: workOrderFields.workType.optional(),
    customerId: workOrderFields.customerId.optional(),
    siteId: workOrderFields.siteId.optional(),
    assetId: workOrderFields.assetId,
    request: workOrderFields.request,
    assigneeIds: workOrderFields.assigneeIds.optional(),
    intent: z.enum(["draft", "schedule"]).optional(),
  })
  .superRefine((value, ctx) => {
    addUniqueAssigneeIssue(value.assigneeIds, ctx);
    if (
      value.intent === "schedule" &&
      value.assigneeIds !== undefined &&
      value.assigneeIds.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assigneeIds"],
        message: "예정 작업에는 담당자를 한 명 이상 배정해야 합니다",
      });
    }
  });
export type WorkOrderPatchInput = z.infer<typeof workOrderPatchSchema>;

export const assignSchema = z
  .object({
    userIds: z.array(identifierSchema).min(1).max(50),
  })
  .superRefine((value, ctx) => {
    if (new Set(value.userIds).size !== value.userIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["userIds"],
        message: "같은 담당자를 중복 배정할 수 없습니다",
      });
    }
  });
export type AssignInput = z.infer<typeof assignSchema>;

// ---------------------------------------------------------------------------
// 현장 기록 / 사진 / 리포트
// ---------------------------------------------------------------------------

export const usedPartSchema = z.object({
  name: z.string().trim().min(1).max(200),
  model: z.string().trim().max(200).optional(),
  quantity: z.number().finite().positive().max(1_000_000),
  unit: z.string().trim().min(1).max(30),
});

export const checklistItemSchema = z.object({
  id: z.string().trim().min(1).max(100),
  label: z.string().trim().min(1).max(300),
  checked: z.boolean(),
  note: z.string().trim().max(500).optional(),
});

export const fieldRecordUpsertSchema = z.object({
  workSummary: z.string().max(10_000).optional(),
  transcript: z.string().max(50_000).optional(),
  parts: z.array(usedPartSchema).max(100).optional(),
  checklist: z.array(checklistItemSchema).max(50).optional(),
  issues: z.string().max(10_000).optional(),
  notes: z.string().max(10_000).optional(),
  nextInspectionDate: calendarDateSchema.nullable().optional(),
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
  dataUrl: imageDataUrlSchema(
    MAX_PHOTO_DATA_URL_CHARS,
    "이미지 용량이 너무 큽니다",
  ),
  caption: z.string().trim().max(500).optional(),
});
export type PhotoCreateInput = z.infer<typeof photoCreateSchema>;

export const structuredDraftSchema = z.object({
  workSummary: z.string().max(10_000),
  actions: z.array(z.string().max(5_000)).max(100),
  usedParts: z.array(usedPartSchema).max(100),
  checklist: z.array(checklistItemSchema).max(50).default([]),
  fieldNotes: z.string().max(10_000).default(""),
  issues: z.array(z.string().max(5_000)).max(100),
  recommendations: z.array(z.string().max(5_000)).max(100),
  nextInspectionDate: calendarDateSchema.nullable(),
  uncertainFields: z.array(z.string().max(100)).max(50),
});

export const reportPutSchema = z.object({
  structured: structuredDraftSchema,
});
export type ReportPutInput = z.infer<typeof reportPutSchema>;

// ---------------------------------------------------------------------------
// 승인
// ---------------------------------------------------------------------------

export const approveSchema = z.object({
  name: z.string().trim().min(1).max(100),
  title: z.string().trim().max(100).optional(),
  signatureDataUrl: imageDataUrlSchema(
    MAX_SIGNATURE_DATA_URL_CHARS,
    "서명 이미지 용량이 너무 큽니다",
  ),
  agree: z.literal(true),
});
export type ApproveInput = z.infer<typeof approveSchema>;

export const revisionRequestSchema = z.object({
  comment: z.string().trim().min(1).max(2000),
});
export type RevisionRequestInput = z.infer<typeof revisionRequestSchema>;

export const approvalLinkCreateSchema = z.object({
  invalidatePrevious: z.boolean().default(true),
});
export type ApprovalLinkCreateInput = z.infer<typeof approvalLinkCreateSchema>;

export const reportCorrectionSchema = z.object({
  comment: z.string().trim().min(1).max(2000),
});
export type ReportCorrectionInput = z.infer<typeof reportCorrectionSchema>;

// ---------------------------------------------------------------------------
// 청구
// ---------------------------------------------------------------------------

export const billingPutSchema = z.object({
  amount: z.number().finite().nonnegative().max(1_000_000_000_000).nullable().optional(),
  billedAt: calendarDateSchema.nullable().optional(),
  dueAt: calendarDateSchema.nullable().optional(),
  paidAt: calendarDateSchema.nullable().optional(),
  memo: z.string().trim().max(4_000).nullable().optional(),
});
export type BillingPutInput = z.infer<typeof billingPutSchema>;
