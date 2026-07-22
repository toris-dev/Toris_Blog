import { z } from "zod";

/**
 * BuilderStep 도메인 스키마 (Zod) 및 파생 타입.
 *
 * 이 파일은 스키마와 구조만 정의한다. 진단 설문 문항, 태스크 템플릿 등의
 * 실제 콘텐츠 값은 창업자 저작 영역이며 여기서 다루지 않는다
 * (참고: docs/content/survey-authoring.md, docs/content/template-board.md).
 */

// ---------------------------------------------------------------------------
// 공통
// ---------------------------------------------------------------------------

/** 사업화 8단계 (낮은 단계 → 높은 단계 순서). */
export const BUSINESS_STAGES = [
  "idea",
  "validation",
  "mvp",
  "launch",
  "user_acquisition",
  "first_revenue",
  "recurring_revenue",
  "growth",
] as const;

export const businessStageSchema = z.enum(BUSINESS_STAGES);
export type BusinessStage = z.infer<typeof businessStageSchema>;

/** BUSINESS_STAGES 상의 인덱스. 낮을수록 더 이른 단계. */
export function stageOrderIndex(stage: BusinessStage): number {
  return BUSINESS_STAGES.indexOf(stage);
}

// ---------------------------------------------------------------------------
// 1. Builder
// ---------------------------------------------------------------------------

export const authProviderSchema = z.enum(["google", "apple", "github"]);
export type AuthProvider = z.infer<typeof authProviderSchema>;

export const builderSchema = z.object({
  id: z.string().min(1),
  provider: authProviderSchema,
  email: z.string().email(),
  nickname: z.string().min(1),
  createdAt: z.coerce.date(),
});
export type Builder = z.infer<typeof builderSchema>;

// ---------------------------------------------------------------------------
// 2. Project
// ---------------------------------------------------------------------------

export const projectSchema = z.object({
  id: z.string().min(1),
  builderId: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  link: z.string().url().optional(),
  stage: businessStageSchema,
  createdAt: z.coerce.date(),
});
export type Project = z.infer<typeof projectSchema>;

// ---------------------------------------------------------------------------
// 3. StageHistory
// ---------------------------------------------------------------------------

export const stageChangeSourceSchema = z.enum(["diagnosis", "rediagnosis"]);
export type StageChangeSource = z.infer<typeof stageChangeSourceSchema>;

export const stageHistorySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  stage: businessStageSchema,
  changedAt: z.coerce.date(),
  source: stageChangeSourceSchema,
});
export type StageHistory = z.infer<typeof stageHistorySchema>;

// ---------------------------------------------------------------------------
// 5. DiagnosisQuestion (DiagnosisSurvey 이전에 선언되어야 참조 가능)
// ---------------------------------------------------------------------------

export const diagnosisOptionSchema = z.object({
  label: z.string().min(1),
  score: z.number(),
});
export type DiagnosisOption = z.infer<typeof diagnosisOptionSchema>;

export const diagnosisQuestionSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().nonnegative(),
  text: z.string().min(1),
  options: z.array(diagnosisOptionSchema).min(2),
});
export type DiagnosisQuestion = z.infer<typeof diagnosisQuestionSchema>;

// ---------------------------------------------------------------------------
// 4. DiagnosisSurvey
// ---------------------------------------------------------------------------

export const diagnosisSurveySchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  questions: z.array(diagnosisQuestionSchema).min(1),
});
export type DiagnosisSurvey = z.infer<typeof diagnosisSurveySchema>;

// ---------------------------------------------------------------------------
// 6. DiagnosisResponse
// ---------------------------------------------------------------------------

export const diagnosisAnswerSchema = z.object({
  questionId: z.string().min(1),
  optionIndex: z.number().int().nonnegative(),
  score: z.number(),
});
export type DiagnosisAnswer = z.infer<typeof diagnosisAnswerSchema>;

export const diagnosisResponseSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  surveyVersion: z.number().int().positive(),
  answers: z.array(diagnosisAnswerSchema).min(1),
  totalScore: z.number(),
  resultStage: businessStageSchema,
  createdAt: z.coerce.date(),
});
export type DiagnosisResponse = z.infer<typeof diagnosisResponseSchema>;

// ---------------------------------------------------------------------------
// 7. StageMapping
// ---------------------------------------------------------------------------

export const stageTieRuleSchema = z.literal("lower-stage");
export type StageTieRule = z.infer<typeof stageTieRuleSchema>;

export const stageRangeSchema = z
  .object({
    stage: businessStageSchema,
    minScore: z.number(),
    maxScore: z.number(),
  })
  .refine((range) => range.minScore <= range.maxScore, {
    message: "minScore must be <= maxScore",
  });
export type StageRange = z.infer<typeof stageRangeSchema>;

export const stageMappingSchema = z.object({
  version: z.number().int().positive(),
  ranges: z.array(stageRangeSchema).min(1),
  tieRule: stageTieRuleSchema,
});
export type StageMapping = z.infer<typeof stageMappingSchema>;

/**
 * 총점을 매핑 테이블에 따라 사업화 단계로 변환한다 (순수 함수).
 *
 * - 각 range 는 [minScore, maxScore] 양 끝을 포함한다.
 * - totalScore 가 여러 range 에 동시에 해당하면 tieRule 에 따라 해소한다.
 *   현재 지원하는 tieRule 은 'lower-stage' 뿐이며, 매칭된 단계 중
 *   BUSINESS_STAGES 순서상 더 낮은(이른) 단계를 채택한다.
 * - 매칭되는 range 가 없으면 null 을 반환한다.
 */
export function scoreToStage(
  totalScore: number,
  mapping: StageMapping,
): BusinessStage | null {
  const matches = mapping.ranges.filter(
    (range) => totalScore >= range.minScore && totalScore <= range.maxScore,
  );

  if (matches.length === 0) {
    return null;
  }

  // tie: 여러 range 가 겹치는 경우 tieRule 'lower-stage' 는

  // BUSINESS_STAGES 순서상 가장 낮은 단계를 채택한다. (단일 매칭이면 그대로 반환)
  return matches.reduce((lowest, candidate) =>
    stageOrderIndex(candidate.stage) < stageOrderIndex(lowest.stage)
      ? candidate
      : lowest,
  ).stage;
}

// ---------------------------------------------------------------------------
// 8. TaskTemplate
// ---------------------------------------------------------------------------

export const taskTemplateSchema = z.object({
  id: z.string().min(1),
  stage: businessStageSchema,
  title: z.string().min(1),
  goal: z.string().min(1),
  doneCriteria: z.string().min(1),
  estimatedHours: z.number().nonnegative(),
  order: z.number().int().nonnegative(),
});
export type TaskTemplate = z.infer<typeof taskTemplateSchema>;

// ---------------------------------------------------------------------------
// 9. Task
// ---------------------------------------------------------------------------

export const taskStatusSchema = z.enum(["todo", "done"]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  templateId: z.string().min(1),
  status: taskStatusSchema,
  completedAt: z.coerce.date().optional(),
});
export type Task = z.infer<typeof taskSchema>;

// ---------------------------------------------------------------------------
// 10. Metric
// ---------------------------------------------------------------------------

export const metricKindSchema = z.enum(["users", "revenue", "custom"]);
export type MetricKind = z.infer<typeof metricKindSchema>;

export const metricSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  kind: metricKindSchema,
  label: z.string().min(1),
  value: z.number(),
  recordedAt: z.coerce.date(),
});
export type Metric = z.infer<typeof metricSchema>;

// ---------------------------------------------------------------------------
// 11. RetroReport
// ---------------------------------------------------------------------------

export const metricDeltaSchema = z.object({
  kind: metricKindSchema,
  label: z.string().min(1),
  delta: z.number(),
});
export type MetricDelta = z.infer<typeof metricDeltaSchema>;

export const retroReportSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  /** ISO 형식 "YYYY-MM" 월 식별자. */
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "must be YYYY-MM"),
  stageHistoryIds: z.array(z.string().min(1)),
  completedTaskIds: z.array(z.string().min(1)),
  metricDeltas: z.array(metricDeltaSchema),
  createdAt: z.coerce.date(),
});
export type RetroReport = z.infer<typeof retroReportSchema>;

// ---------------------------------------------------------------------------
// 12. Post
// ---------------------------------------------------------------------------

export const postSchema = z.object({
  id: z.string().min(1),
  builderId: z.string().min(1),
  topic: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  /** RetroReport 등으로부터 자동 생성된 게시물인지 여부. */
  isAuto: z.boolean(),
  /** 자동 생성 게시물 공개에 대한 작성자의 명시적 동의 여부. */
  optIn: z.boolean(),
  createdAt: z.coerce.date(),
});
export type Post = z.infer<typeof postSchema>;

// ---------------------------------------------------------------------------
// 13. Comment
// ---------------------------------------------------------------------------

export const commentSchema = z.object({
  id: z.string().min(1),
  postId: z.string().min(1),
  builderId: z.string().min(1),
  body: z.string().min(1),
  createdAt: z.coerce.date(),
});
export type Comment = z.infer<typeof commentSchema>;

// ---------------------------------------------------------------------------
// 14. Entitlement
// ---------------------------------------------------------------------------

export const subscriptionPlanSchema = z.enum(["monthly", "yearly"]);
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export const subscriptionChannelSchema = z.enum(["PG", "APPLE", "GOOGLE"]);
export type SubscriptionChannel = z.infer<typeof subscriptionChannelSchema>;

export const subscriptionStatusSchema = z.enum([
  "active",
  "grace",
  "canceled",
  "expired",
  "refunded",
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const entitlementSchema = z.object({
  builderId: z.string().min(1),
  plan: subscriptionPlanSchema,
  channel: subscriptionChannelSchema,
  status: subscriptionStatusSchema,
  currentPeriodEnd: z.coerce.date(),
  originalTransactionId: z.string().min(1).optional(),
  billingKeyRef: z.string().min(1).optional(),
  updatedAt: z.coerce.date(),
});
export type Entitlement = z.infer<typeof entitlementSchema>;

// ---------------------------------------------------------------------------
// 15. BillingEvent
// ---------------------------------------------------------------------------

export const billingVerificationSchema = z.enum(["verified", "rejected"]);
export type BillingVerification = z.infer<typeof billingVerificationSchema>;

export const billingEventSchema = z.object({
  id: z.string().min(1),
  channel: subscriptionChannelSchema,
  /** 결제 채널이 발급한 원본 이벤트 식별자 (멱등 처리용). */
  eventId: z.string().min(1),
  type: z.string().min(1),
  payload: z.unknown(),
  receivedAt: z.coerce.date(),
  verification: billingVerificationSchema,
});
export type BillingEvent = z.infer<typeof billingEventSchema>;

// ---------------------------------------------------------------------------
// 16. PricingPlan
// ---------------------------------------------------------------------------

export const pricingPlanSchema = z.object({
  plan: subscriptionPlanSchema,
  priceKrw: z.number().int().nonnegative(),
});
export type PricingPlan = z.infer<typeof pricingPlanSchema>;

/** 가안 가격 (원화). 실제 정책 확정 전까지의 기본값. */
export const PRICING_DEFAULTS: readonly PricingPlan[] = [
  { plan: "monthly", priceKrw: 9900 },
  { plan: "yearly", priceKrw: 79000 },
];
