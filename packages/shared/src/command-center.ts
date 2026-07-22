import { z } from "zod";

// ===========================================================================
// CEO Command Center 도메인
//
// 대표자가 매일 아침 확인해야 할 이슈(미수금·결제실패·반복문의·이탈징후·
// 마감임박·비용급증)를 "사업 영향도 × 긴급도"로 평가해 오늘의 3개로 압축한다.
// 모든 추천 카드는 이유(reason)·출처(source)·다음 행동(nextAction)을 함께 담는다.
//
// 이 모듈은 DB/UI에 의존하지 않는 순수 도메인이다. 서버 라우트는 원천 데이터를
// 이 스키마로 정규화한 뒤 buildCommandCards()/rankCommandCards()에 넘기면 된다.
// ===========================================================================

// ---------------------------------------------------------------------------
// 1. 공통 타입
// ---------------------------------------------------------------------------

/** 원화 정수 금액 (음수 불가). */
const krw = () => z.number().int().nonnegative();

/** 카드가 참조하는 원천 데이터의 종류. 출처 추적(감사) 용도. */
export const sourceKindSchema = z.enum([
  "receivable",
  "payment_failure",
  "signal",
  "deadline",
  "financial_snapshot",
  "manual",
]);
export type SourceKind = z.infer<typeof sourceKindSchema>;

/** 추천 카드의 출처 참조. UI에서 원본으로 이동/감사할 수 있게 한다. */
export const sourceRefSchema = z.object({
  kind: sourceKindSchema,
  id: z.string().min(1),
});
export type SourceRef = z.infer<typeof sourceRefSchema>;

/** 대표자가 인지해야 할 이슈의 종류. */
export const issueKindSchema = z.enum([
  "receivable_overdue", // 미수금 연체
  "payment_failed", // 결제 실패
  "repeat_inquiry", // 반복 문의
  "churn_risk", // 이탈 징후
  "deadline_near", // 마감 임박
  "cost_spike", // 비용 급증
]);
export type IssueKind = z.infer<typeof issueKindSchema>;

// ---------------------------------------------------------------------------
// 2. 원천 데이터 스키마 (서버가 정규화해 넘긴다)
// ---------------------------------------------------------------------------

/** 미수금 — 청구했으나 아직 수금되지 않은 건. */
export const receivableSchema = z.object({
  id: z.string().min(1),
  builderId: z.string().min(1),
  customer: z.string().min(1),
  amountKrw: krw(),
  dueDate: z.coerce.date(),
  /** 수금 완료 시각. null 이면 미수 상태. */
  paidAt: z.coerce.date().nullable().default(null),
  createdAt: z.coerce.date(),
});
export type Receivable = z.infer<typeof receivableSchema>;

/** 결제 실패 — 구독 갱신 등에서 카드 승인이 거절된 건. */
export const paymentFailureSchema = z.object({
  id: z.string().min(1),
  builderId: z.string().min(1),
  subscriptionId: z.string().min(1),
  /** 이 건이 위협하는 월 반복 매출(MRR). */
  mrrKrw: krw(),
  failedAt: z.coerce.date(),
  /** 재시도 횟수. 높을수록 이탈 임박 → 긴급도 상승. */
  retryCount: z.number().int().nonnegative().default(0),
  resolvedAt: z.coerce.date().nullable().default(null),
});
export type PaymentFailure = z.infer<typeof paymentFailureSchema>;

/** 마감/리스크 — 기한이 있는 할 일. */
export const deadlineSchema = z.object({
  id: z.string().min(1),
  builderId: z.string().min(1),
  title: z.string().min(1),
  dueDate: z.coerce.date(),
  /** 놓쳤을 때 추정 사업 영향(원). */
  estimatedImpactKrw: krw().default(0),
  doneAt: z.coerce.date().nullable().default(null),
});
export type Deadline = z.infer<typeof deadlineSchema>;

/** 고객 신호 — 이메일/웹폼/채팅/설문/수동으로 들어온 문의·피드백·이탈 신호. */
export const signalChannelSchema = z.enum([
  "email",
  "webform",
  "chat",
  "survey",
  "manual",
]);
export type SignalChannel = z.infer<typeof signalChannelSchema>;

export const signalKindSchema = z.enum(["inquiry", "feedback", "churn", "bug"]);
export type SignalKind = z.infer<typeof signalKindSchema>;

export const signalSchema = z.object({
  id: z.string().min(1),
  builderId: z.string().min(1),
  channel: signalChannelSchema,
  kind: signalKindSchema,
  text: z.string().default(""),
  /** 동일 주제로 묶인 횟수(중복 제거 후). 반복 문의 판정에 사용. */
  count: z.number().int().positive().default(1),
  /** 이탈 시 위협 매출 등, 알려진 경우의 추정 영향(원). */
  estimatedImpactKrw: krw().default(0),
  receivedAt: z.coerce.date(),
});
export type Signal = z.infer<typeof signalSchema>;

/** 재무 스냅샷 — 런웨이/비용급증 판정을 위한 시점별 현금·매출·비용. */
export const financialSnapshotSchema = z.object({
  builderId: z.string().min(1),
  cashKrw: krw(),
  monthlyRevenueKrw: krw(),
  monthlyFixedCostKrw: krw(),
  monthlyVariableCostKrw: krw(),
  recordedAt: z.coerce.date(),
});
export type FinancialSnapshot = z.infer<typeof financialSnapshotSchema>;

// ---------------------------------------------------------------------------
// 3. 추천 카드 (Today Command Center 출력)
// ---------------------------------------------------------------------------

export const commandCardSchema = z.object({
  id: z.string().min(1),
  builderId: z.string().min(1),
  kind: issueKindSchema,
  title: z.string().min(1),
  /** 사업 영향도 (원). 랭킹의 impact 축. */
  impactKrw: krw(),
  /** 긴급도 0..1. 랭킹의 urgency 축. */
  urgency: z.number().min(0).max(1),
  /** 종합 점수 0..1 (impact 정규화 × 0.6 + urgency × 0.4). */
  score: z.number().min(0).max(1),
  /** 이 카드가 뜬 이유 (숫자 근거 포함). */
  reason: z.string().min(1),
  /** 원천 출처 참조. */
  source: sourceRefSchema,
  /** 대표가 지금 취할 다음 행동. */
  nextAction: z.string().min(1),
  createdAt: z.coerce.date(),
});
export type CommandCard = z.infer<typeof commandCardSchema>;

// ---------------------------------------------------------------------------
// 4. 순수 계산 — 런웨이 (Feature 2: Runway Lite)
// ---------------------------------------------------------------------------

export const runwayStatusSchema = z.enum(["healthy", "tight", "critical"]);
export type RunwayStatus = z.infer<typeof runwayStatusSchema>;

export interface RunwayResult {
  /** 월 순소모 = (고정비 + 변동비) − 매출. 0 이하면 흑자(소모 없음). */
  netBurnKrw: number;
  /** 남은 개월 수. 흑자면 null(무한). */
  runwayMonths: number | null;
  status: RunwayStatus;
}

/**
 * 현금 / 월 순소모로 남은 런웨이(개월)를 계산한다.
 * - netBurn ≤ 0 → 흑자, runwayMonths = null, status = healthy
 * - runwayMonths > 6 → healthy, 3~6 → tight, < 3 → critical
 */
export function computeRunway(snapshot: FinancialSnapshot): RunwayResult {
  const cost = snapshot.monthlyFixedCostKrw + snapshot.monthlyVariableCostKrw;
  const netBurnKrw = cost - snapshot.monthlyRevenueKrw;

  if (netBurnKrw <= 0) {
    return { netBurnKrw, runwayMonths: null, status: "healthy" };
  }

  const runwayMonths = snapshot.cashKrw / netBurnKrw;
  const status: RunwayStatus =
    runwayMonths >= 6 ? "healthy" : runwayMonths >= 3 ? "tight" : "critical";
  return { netBurnKrw, runwayMonths, status };
}

// ---------------------------------------------------------------------------
// 5. 순수 계산 — 우선순위 점수 (Today Command Center 랭킹의 핵심 판단 규칙)
// ---------------------------------------------------------------------------

/** 영향도 정규화 상한(원). 이 금액 이상은 모두 1.0 으로 본다. */
export const IMPACT_CEILING_KRW = 5_000_000;
const IMPACT_WEIGHT = 0.6;
const URGENCY_WEIGHT = 0.4;

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/** 0..1 로 정규화된 영향 점수. 한 건이 랭킹을 독식하지 않도록 상한을 둔다. */
export function impactScore(
  impactKrw: number,
  ceilingKrw: number = IMPACT_CEILING_KRW,
): number {
  if (ceilingKrw <= 0) return 0;
  return clamp01(impactKrw / ceilingKrw);
}

/** 투명한 종합 점수: 영향 정규화 × 0.6 + 긴급 × 0.4. */
export function scoreIssue(
  impactKrw: number,
  urgency: number,
  ceilingKrw: number = IMPACT_CEILING_KRW,
): number {
  return (
    impactScore(impactKrw, ceilingKrw) * IMPACT_WEIGHT +
    clamp01(urgency) * URGENCY_WEIGHT
  );
}

/** 두 시각 사이의 일수(부호 있음): b − a 를 일 단위로. */
export function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

// ---------------------------------------------------------------------------
// 6. 카드 생성 — 원천 데이터 → 추천 카드
// ---------------------------------------------------------------------------

export interface CommandCenterInput {
  builderId: string;
  now: Date;
  receivables?: Receivable[];
  paymentFailures?: PaymentFailure[];
  deadlines?: Deadline[];
  signals?: Signal[];
  /** 최신 재무 스냅샷 (비용급증 판정에 이전 스냅샷과 비교). */
  snapshot?: FinancialSnapshot;
  previousSnapshot?: FinancialSnapshot;
  /** 반복 문의로 판정하는 최소 누적 횟수. 기본 3. */
  repeatInquiryThreshold?: number;
  /** 비용급증으로 판정하는 월비용 증가율. 기본 0.2 (20%). */
  costSpikeRatio?: number;
}

const won = (n: number): string => `${Math.round(n).toLocaleString("ko-KR")}원`;

function card(
  input: Omit<CommandCard, "score" | "createdAt">,
  now: Date,
  ceilingKrw?: number,
): CommandCard {
  return {
    ...input,
    score: scoreIssue(input.impactKrw, input.urgency, ceilingKrw),
    createdAt: now,
  };
}

/**
 * 원천 데이터를 결정론적 규칙으로 추천 카드로 변환한다.
 * 각 카드는 숫자 근거가 담긴 reason 과 구체적 nextAction 을 갖는다.
 */
export function buildCommandCards(input: CommandCenterInput): CommandCard[] {
  const { builderId, now } = input;
  const cards: CommandCard[] = [];
  const repeatThreshold = input.repeatInquiryThreshold ?? 3;
  const costSpikeRatio = input.costSpikeRatio ?? 0.2;

  // 6.1 미수금 연체
  for (const r of input.receivables ?? []) {
    if (r.paidAt) continue;
    const daysOverdue = daysBetween(r.dueDate, now);
    if (daysOverdue <= 0) continue;
    cards.push(
      card(
        {
          id: `receivable:${r.id}`,
          builderId,
          kind: "receivable_overdue",
          title: `${r.customer} 미수금 ${won(r.amountKrw)} (${Math.floor(daysOverdue)}일 연체)`,
          impactKrw: r.amountKrw,
          urgency: clamp01(daysOverdue / 30),
          reason: `${r.customer} 건이 기한(${r.dueDate.toISOString().slice(0, 10)}) 대비 ${Math.floor(daysOverdue)}일 연체되어 ${won(r.amountKrw)}이 미수 상태입니다.`,
          source: { kind: "receivable", id: r.id },
          nextAction: "고객에게 수금 리마인드를 보내고 필요 시 결제 링크를 재발송하세요.",
        },
        now,
      ),
    );
  }

  // 6.2 결제 실패
  for (const p of input.paymentFailures ?? []) {
    if (p.resolvedAt) continue;
    cards.push(
      card(
        {
          id: `payment:${p.id}`,
          builderId,
          kind: "payment_failed",
          title: `결제 실패 — MRR ${won(p.mrrKrw)} 위협 (재시도 ${p.retryCount}회)`,
          impactKrw: p.mrrKrw,
          urgency: clamp01(0.7 + p.retryCount * 0.1),
          reason: `구독 ${p.subscriptionId}의 결제가 실패해 월 ${won(p.mrrKrw)} 매출이 이탈 위험에 있습니다. 재시도 ${p.retryCount}회.`,
          source: { kind: "payment_failure", id: p.id },
          nextAction: "고객에게 카드 갱신 안내를 보내고 결제 수단 업데이트를 요청하세요.",
        },
        now,
      ),
    );
  }

  // 6.3 마감 임박 / 초과
  for (const d of input.deadlines ?? []) {
    if (d.doneAt) continue;
    const daysUntil = daysBetween(now, d.dueDate);
    if (daysUntil > 14) continue; // 2주 밖은 아직 오늘의 이슈 아님
    const overdue = daysUntil < 0;
    cards.push(
      card(
        {
          id: `deadline:${d.id}`,
          builderId,
          kind: "deadline_near",
          title: overdue
            ? `${d.title} — 마감 ${Math.abs(Math.floor(daysUntil))}일 초과`
            : `${d.title} — 마감 D-${Math.ceil(daysUntil)}`,
          impactKrw: d.estimatedImpactKrw,
          urgency: overdue ? 1 : clamp01(1 - daysUntil / 14),
          reason: overdue
            ? `"${d.title}" 마감이 ${Math.abs(Math.floor(daysUntil))}일 지났습니다.`
            : `"${d.title}" 마감이 ${Math.ceil(daysUntil)}일 남았습니다.`,
          source: { kind: "deadline", id: d.id },
          nextAction: "일정을 확인하고 오늘 처리하거나 기한을 재조정하세요.",
        },
        now,
      ),
    );
  }

  // 6.4 반복 문의 / 이탈 징후 (고객 신호)
  for (const s of input.signals ?? []) {
    if (s.kind === "churn") {
      cards.push(
        card(
          {
            id: `signal:${s.id}`,
            builderId,
            kind: "churn_risk",
            title: `이탈 징후 — ${s.channel} 채널`,
            impactKrw: s.estimatedImpactKrw,
            urgency: 0.85,
            reason: `${s.channel} 채널에서 이탈 신호가 감지되었습니다: "${s.text.slice(0, 40)}"`,
            source: { kind: "signal", id: s.id },
            nextAction: "고객에게 직접 연락해 이탈 사유를 확인하고 리텐션 오퍼를 제안하세요.",
          },
          now,
        ),
      );
    } else if (s.kind === "inquiry" && s.count >= repeatThreshold) {
      cards.push(
        card(
          {
            id: `signal:${s.id}`,
            builderId,
            kind: "repeat_inquiry",
            title: `반복 문의 ${s.count}건 — ${s.channel}`,
            impactKrw: s.estimatedImpactKrw,
            urgency: clamp01(0.3 + s.count * 0.1),
            reason: `동일 주제 문의가 ${s.count}건 누적되었습니다: "${s.text.slice(0, 40)}". 제품/문서 개선 신호입니다.`,
            source: { kind: "signal", id: s.id },
            nextAction: "FAQ/문서를 보강하거나 제품에서 해당 마찰을 제거하세요.",
          },
          now,
        ),
      );
    }
  }

  // 6.5 비용 급증 (스냅샷 대비)
  if (input.snapshot && input.previousSnapshot) {
    const cur =
      input.snapshot.monthlyFixedCostKrw + input.snapshot.monthlyVariableCostKrw;
    const prev =
      input.previousSnapshot.monthlyFixedCostKrw +
      input.previousSnapshot.monthlyVariableCostKrw;
    if (prev > 0 && cur - prev > prev * costSpikeRatio) {
      const delta = cur - prev;
      const ratio = Math.round((delta / prev) * 100);
      cards.push(
        card(
          {
            id: `cost:${input.snapshot.recordedAt.getTime()}`,
            builderId,
            kind: "cost_spike",
            title: `월 비용 ${ratio}% 급증 (+${won(delta)})`,
            impactKrw: delta,
            urgency: clamp01(ratio / 100),
            reason: `월 비용이 이전 ${won(prev)} → ${won(cur)}로 ${ratio}% 증가했습니다.`,
            source: {
              kind: "financial_snapshot",
              id: input.snapshot.recordedAt.toISOString(),
            },
            nextAction: "증가한 비용 항목(구독/클라우드 등)을 점검하고 불필요한 지출을 정리하세요.",
          },
          now,
        ),
      );
    }
  }

  return cards;
}

// ---------------------------------------------------------------------------
// 7. 랭킹 — 오늘의 N개
// ---------------------------------------------------------------------------

/**
 * 점수 내림차순으로 정렬해 상위 N개를 반환한다.
 * 동점 시: 영향 금액이 큰 순 → 그래도 같으면 id 사전순(결정론적).
 */
export function rankCommandCards(
  cards: CommandCard[],
  topN = 3,
): CommandCard[] {
  return [...cards]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.impactKrw !== a.impactKrw) return b.impactKrw - a.impactKrw;
      return a.id.localeCompare(b.id);
    })
    .slice(0, topN);
}

/** 한 번에: 원천 데이터 → 카드 생성 → 상위 N개. */
export function todayCommandCenter(
  input: CommandCenterInput,
  topN = 3,
): CommandCard[] {
  return rankCommandCards(buildCommandCards(input), topN);
}

// ---------------------------------------------------------------------------
// 8. 우선순위 엔진 — Not Now (Feature 4)
//
// 대표가 떠올린 아이디어는 기본적으로 Not Now. 실제 고객 신호(요청 수·매출/이탈
// 영향)가 누적될 때만 이번 주 작업으로 승격한다.
// ---------------------------------------------------------------------------

export const featureRequestStatusSchema = z.enum([
  "not_now",
  "this_week",
  "done",
]);
export type FeatureRequestStatus = z.infer<typeof featureRequestStatusSchema>;

export const featureRequestSchema = z.object({
  id: z.string().min(1),
  builderId: z.string().min(1),
  title: z.string().min(1),
  /** 실제 고객 요청 수. 승격의 핵심 근거. */
  requestCount: z.number().int().nonnegative().default(0),
  /** 이 요청이 여는 고객 가치(원). */
  customerValueKrw: krw().default(0),
  /** 이 요청이 좌우하는 매출·이탈 영향(원). */
  revenueChurnImpactKrw: krw().default(0),
  /** 전략 적합도 0..1. */
  strategyFit: z.number().min(0).max(1).default(0.5),
  /** 긴급도 0..1. */
  urgency: z.number().min(0).max(1).default(0),
  /** 예상 노력(일). */
  estimatedEffortDays: z.number().positive().default(1),
  /** 아이디어 출처: 고객 신호 vs 대표 착상. */
  origin: z.enum(["customer", "founder"]).default("customer"),
  status: featureRequestStatusSchema.default("not_now"),
  createdAt: z.coerce.date(),
});
export type FeatureRequest = z.infer<typeof featureRequestSchema>;

/** 요청 수가 이 상한이면 수요 점수 1.0. */
export const DEMAND_CEILING = 5;

/**
 * 지연 비용 / 노력 (WSJF 계열). 값이 클수록 먼저 해야 한다.
 * benefit = 영향(정규화)0.5 + 수요0.2 + 전략적합0.2 + 긴급0.1, 그 뒤 노력으로 나눔.
 */
export function scoreFeatureRequest(fr: FeatureRequest): number {
  const value = fr.customerValueKrw + fr.revenueChurnImpactKrw;
  const demand = clamp01(fr.requestCount / DEMAND_CEILING);
  const benefit =
    impactScore(value) * 0.5 +
    demand * 0.2 +
    clamp01(fr.strategyFit) * 0.2 +
    clamp01(fr.urgency) * 0.1;
  return benefit / Math.max(1, fr.estimatedEffortDays);
}

export interface FeatureTriageOptions {
  /** 이번 주로 승격하는 최소 고객 요청 수. 기본 3. */
  promoteThreshold?: number;
  /** 요청 수와 무관하게 승격하는 매출·이탈 영향 하한(원). 기본 100만. */
  promoteImpactKrw?: number;
  /** 이번 주 최대 승격 개수. 기본 3. */
  maxThisWeek?: number;
}

export interface FeatureTriageResult {
  thisWeek: FeatureRequest[];
  notNow: FeatureRequest[];
}

/**
 * 기능 요청을 분류한다. 실제 고객 신호가 누적된 것만 이번 주로 승격하고,
 * 대표 착상(신호 없음)은 Not Now에 남긴다. 이미 done 은 제외.
 */
export function triageFeatureRequests(
  requests: FeatureRequest[],
  options: FeatureTriageOptions = {},
): FeatureTriageResult {
  const promoteThreshold = options.promoteThreshold ?? 3;
  const promoteImpactKrw = options.promoteImpactKrw ?? 1_000_000;
  const maxThisWeek = options.maxThisWeek ?? 3;

  const active = requests.filter((r) => r.status !== "done");
  const qualifies = (r: FeatureRequest): boolean =>
    r.requestCount >= promoteThreshold ||
    r.revenueChurnImpactKrw >= promoteImpactKrw;

  const promoted = active
    .filter(qualifies)
    .sort((a, b) => scoreFeatureRequest(b) - scoreFeatureRequest(a));

  const thisWeek = promoted.slice(0, maxThisWeek);
  const thisWeekIds = new Set(thisWeek.map((r) => r.id));
  const notNow = active.filter((r) => !thisWeekIds.has(r.id));
  return { thisWeek, notNow };
}

// ---------------------------------------------------------------------------
// 9. 핵심 차별점 — 방지한 손실 집계 (Loss Prevented)
//
// "이번 주 손실을 얼마나 방지했는가"를 숫자로 보여준다.
// ---------------------------------------------------------------------------

export const lossPreventedKindSchema = z.enum([
  "recovered_receivable", // 회수한 미수금
  "recovered_payment", // 복구한 결제 실패 금액
  "canceled_subscription", // 해지한 불필요 구독 비용
  "prevented_expiry", // 방지한 도메인·인증서 만료
  "reduced_inquiry_time", // 줄어든 반복 문의 시간(금액 환산)
  "recovered_churn", // 이탈 위험에서 복구한 고객 매출
]);
export type LossPreventedKind = z.infer<typeof lossPreventedKindSchema>;

export const lossPreventedSchema = z.object({
  id: z.string().min(1),
  builderId: z.string().min(1),
  kind: lossPreventedKindSchema,
  amountKrw: krw(),
  note: z.string().default(""),
  occurredAt: z.coerce.date(),
});
export type LossPrevented = z.infer<typeof lossPreventedSchema>;

export interface LossPreventedSummary {
  totalKrw: number;
  byKind: Record<LossPreventedKind, number>;
  count: number;
}

const emptyByKind = (): Record<LossPreventedKind, number> => ({
  recovered_receivable: 0,
  recovered_payment: 0,
  canceled_subscription: 0,
  prevented_expiry: 0,
  reduced_inquiry_time: 0,
  recovered_churn: 0,
});

/** 기간(선택) 내 방지 손실을 종류별·합계로 집계한다. */
export function sumLossPrevented(
  items: LossPrevented[],
  range?: { from?: Date; to?: Date },
): LossPreventedSummary {
  const byKind = emptyByKind();
  let totalKrw = 0;
  let count = 0;
  for (const it of items) {
    if (range?.from && it.occurredAt < range.from) continue;
    if (range?.to && it.occurredAt > range.to) continue;
    byKind[it.kind] += it.amountKrw;
    totalKrw += it.amountKrw;
    count += 1;
  }
  return { totalKrw, byKind, count };
}

// ---------------------------------------------------------------------------
// 10. 주간 CEO 브리핑 (Feature 6)
// ---------------------------------------------------------------------------

export interface WeeklyBriefingInput {
  builderId: string;
  weekStart: Date;
  weekEnd: Date;
  current: FinancialSnapshot;
  previous?: FinancialSnapshot;
  customerCount?: number;
  prevCustomerCount?: number;
  inquiryCount?: number;
  prevInquiryCount?: number;
  /** 아직 남아 있는 위험 (오늘의 커맨드 카드들). */
  openCards?: CommandCard[];
  /** 이번 주 해결한 위험. */
  resolvedCards?: CommandCard[];
  lossPrevented?: LossPrevented[];
  featureRequests?: FeatureRequest[];
}

export interface WeeklyBriefingDelta {
  current: number;
  previous: number;
  delta: number;
}

export interface WeeklyBriefing {
  builderId: string;
  weekStart: Date;
  weekEnd: Date;
  revenue: WeeklyBriefingDelta;
  cash: WeeklyBriefingDelta;
  customers: WeeklyBriefingDelta;
  inquiries: WeeklyBriefingDelta;
  runway: RunwayResult;
  /** 핵심 차별점: 이번 주 방지한 손실. */
  lossPrevented: LossPreventedSummary;
  resolvedRisks: string[];
  remainingRisks: string[];
  /** 중단 제안: 신호 없는 대표 착상. */
  toStop: string[];
  /** 다음 주 집중할 3개. */
  nextFocus: string[];
  /** 대표 최종 승인 여부. */
  approved: boolean;
}

const delta = (current = 0, previous = 0): WeeklyBriefingDelta => ({
  current,
  previous,
  delta: current - previous,
});

/**
 * 매출·현금·고객·문의 변화 + 방지 손실 + 위험 요약 + 다음 주 3개를 한 장으로.
 * 승인 전까지 approved=false.
 */
export function buildWeeklyBriefing(
  input: WeeklyBriefingInput,
): WeeklyBriefing {
  const open = input.openCards ?? [];
  const triage = triageFeatureRequests(input.featureRequests ?? []);
  return {
    builderId: input.builderId,
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    revenue: delta(
      input.current.monthlyRevenueKrw,
      input.previous?.monthlyRevenueKrw,
    ),
    cash: delta(input.current.cashKrw, input.previous?.cashKrw),
    customers: delta(input.customerCount, input.prevCustomerCount),
    inquiries: delta(input.inquiryCount, input.prevInquiryCount),
    runway: computeRunway(input.current),
    lossPrevented: sumLossPrevented(input.lossPrevented ?? [], {
      from: input.weekStart,
      to: input.weekEnd,
    }),
    resolvedRisks: (input.resolvedCards ?? []).map((c) => c.title),
    remainingRisks: rankCommandCards(open, open.length).map((c) => c.title),
    toStop: triage.notNow
      .filter((r) => r.origin === "founder" && r.requestCount === 0)
      .map((r) => r.title),
    nextFocus: rankCommandCards(open, 3).map((c) => c.title),
    approved: false,
  };
}
