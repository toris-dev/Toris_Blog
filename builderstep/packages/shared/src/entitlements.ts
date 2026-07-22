/**
 * 구독 게이팅 단일 출처 — 웹/서버가 같은 기준을 쓴다.
 * plan.md의 서비스 정의에서 선별: 무료는 "진단과 열람",
 * 구독은 "실행과 연결(전문가·심화)"을 연다.
 */
import type { SubscriptionStatus } from "./domain.js";

/** 구독 레코드가 없는 사용자 표현 — 도메인 상태의 상위 집합 */
export type EntitlementStatus = SubscriptionStatus | "none";

export interface Feature {
  key: string;
  name: string;
  description: string;
  pro: boolean;
}

export const FEATURES: Feature[] = [
  { key: "stage_diagnosis", name: "단계 진단", description: "현재 사업 단계를 진단하고 다음 행동을 제안받기", pro: false },
  { key: "community_read", name: "커뮤니티 열람", description: "동료 빌더들의 경험·실패·성과 기록 읽기", pro: false },
  { key: "goals_basic", name: "목표 트래킹 (3개)", description: "실행 과제를 목표로 등록하고 진행 추적", pro: false },
  { key: "weekly_digest", name: "주간 요약", description: "내 단계에 맞는 주간 추천 액션 받아보기", pro: false },
  { key: "expert_sessions", name: "전문가 상담 예약", description: "마케팅·가격·세무·법률 전문가 1:1 상담", pro: true },
  { key: "custom_roadmap", name: "맞춤 로드맵", description: "진단 결과 기반 단계별 실행 로드맵 생성", pro: true },
  { key: "goals_unlimited", name: "목표 트래킹 무제한", description: "목표 개수 제한 해제 + 회고 아카이브", pro: true },
  { key: "community_write", name: "커뮤니티 참여", description: "글 작성·피드백 요청·빌더 매칭", pro: true },
  { key: "metrics_dashboard", name: "지표 대시보드", description: "매출·사용자 지표를 단계 목표와 연결해 추적", pro: true },
];

/** grace(유예)까지는 구독 기능을 유지한다 — 결제 재시도 중 이탈 방지 */
export const isPro = (status: EntitlementStatus): boolean =>
  status === "active" || status === "grace";

export const featuresFor = (status: EntitlementStatus): Feature[] =>
  FEATURES.filter((f) => !f.pro || isPro(status));

/** 무료 플랜 목표 개수 상한 — 서버 게이팅과 웹 안내가 같은 값을 쓴다 */
export const FREE_GOAL_LIMIT = 3;

export const canCreateGoal = (
  status: EntitlementStatus,
  currentCount: number,
): boolean => isPro(status) || currentCount < FREE_GOAL_LIMIT;
