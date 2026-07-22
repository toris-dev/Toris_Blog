# CEO Command Center — MVP 계획

대표자가 매일 아침 확인해야 할 것을 "오늘의 3개"로 압축하고, 돈·고객·리스크를
한눈에 보여주는 대표자 홈. 기존 창업 8단계 진단(builders/projects/diagnosis)
위에 얹는다.

## 설계 원칙
- 모든 추천은 **이유 · 출처 · 다음 행동**을 함께 제공한다 (`CommandCard`).
- 판단 규칙은 **DB/UI에 의존하지 않는 순수 함수**로 두어 단위 테스트한다
  (`packages/shared/src/command-center.ts`).
- 점수 = 사업 영향도(원, 정규화) × 0.6 + 긴급도(0..1) × 0.4 — 투명·결정론적.

## 6개 MVP 기능과 상태

| # | 기능 | 핵심 | 상태 |
|---|------|------|------|
| 1 | 대표자 홈 · Today Command Center | 이슈 6종 → 영향×긴급 랭킹 → 오늘의 3개 | **도메인/엔진 완료** (`buildCommandCards`, `rankCommandCards`, `todayCommandCenter`) |
| 2 | 돈 · Runway Lite | 현금/순소모 → 남은 개월·상태 | **엔진 완료** (`computeRunway`) |
| 3 | 고객 · 신호 인박스 | email/webform/chat/survey → 반복문의·이탈 판정 | 스키마 완료(`signalSchema`), 인제스트 라우트 TODO |
| 4 | 우선순위 엔진 | 기능요청/이슈 우선순위화 | 랭킹 규칙 재사용, 기능요청 스키마 TODO |
| 5 | 리스크 · 마감 | 마감 D-day·초과 경보 | 스키마/엔진 완료(`deadlineSchema`) |
| 6 | 주간 브리핑 | 주간 요약 + 방지한 손실 집계 | TODO |

## 데이터 모델 (완료)
`receivable · paymentFailure · deadline · signal · financialSnapshot`
→ `CommandCard`(id·kind·title·impactKrw·urgency·score·reason·source·nextAction)

## 다음 단계 (구현 순서 제안)
1. **DB 스키마** — `apps/server` D1: 위 원천 테이블 + 마이그레이션 (drizzle).
2. **서버 라우트** — `GET /api/command-center` : 원천 조회 → `todayCommandCenter()` → JSON.
   `POST /api/signals` : 신호 인제스트(멱등, dedupe count).
3. **웹 페이지** — `apps/web` 대표자 홈: 오늘의 3개 카드 + Runway 위젯.
4. **주간 브리핑** — 크론 + `LossPrevented` 집계 스키마.
5. 엔티틀먼트 연동 — 기능별 플랜 게이팅(`entitlements.ts`).

## 미확정 (대표 확인 필요)
- 미수금/결제/재무 데이터 원천: 수동 입력 vs 외부 연동(토스/스트라이프/뱅킹).
- 신호 채널 연동 우선순위(이메일 vs 채팅).
- 영향도 상한(`IMPACT_CEILING_KRW=500만`)·가중치(0.6/0.4) 정책 확정.
