# 태스크 템플릿 저작 보드

이 문서는 사업화 8단계 × 단계별 5개, 총 **40개 태스크 템플릿**을 채우기 위한
**콘텐츠 저작자용 보드**다. 코드(`packages/shared/src/domain.ts`)의 `TaskTemplate`
스키마는 구조만 정의하며, 실제 제목·목표·완료 조건 등은 이 보드를 따라 창업자가 직접 저작한다.

## 1. 스키마 필드 설명 (참고: `TaskTemplate`)

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | string | 템플릿 고유 식별자. |
| `stage` | 8단계 enum | 이 템플릿이 속한 사업화 단계 (`idea` ~ `growth`). |
| `title` | string | 태스크 제목. 실행 동사로 시작하는 짧은 문장 권장 (예: "랜딩페이지 초안 만들기"). |
| `goal` | string | 이 태스크를 통해 달성하려는 사업적 목표. "왜 하는가"를 설명. |
| `doneCriteria` | string | 완료로 인정되는 구체적·검증 가능한 조건. 체크리스트 형태 권장. |
| `estimatedHours` | number | 1인 개발자 기준 예상 소요 시간(시간 단위, 0 이상). |
| `order` | number | 같은 단계 내에서의 진행 순서 (0부터 시작). |

## 2. 단계별 체크리스트 (단계당 5개, 총 40개)

각 단계마다 5개의 템플릿(`order` 0~4)을 저작한다. 아래 표에 제목만 우선 채우고,
`goal`/`doneCriteria`/`estimatedHours`는 후속 저작 단계에서 보강한다.

### idea

| order | title | goal | doneCriteria | estimatedHours |
| --- | --- | --- | --- | --- |
| 0 | | | | |
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |

### validation

| order | title | goal | doneCriteria | estimatedHours |
| --- | --- | --- | --- | --- |
| 0 | | | | |
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |

### mvp

| order | title | goal | doneCriteria | estimatedHours |
| --- | --- | --- | --- | --- |
| 0 | | | | |
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |

### launch

| order | title | goal | doneCriteria | estimatedHours |
| --- | --- | --- | --- | --- |
| 0 | | | | |
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |

### user_acquisition

| order | title | goal | doneCriteria | estimatedHours |
| --- | --- | --- | --- | --- |
| 0 | | | | |
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |

### first_revenue

| order | title | goal | doneCriteria | estimatedHours |
| --- | --- | --- | --- | --- |
| 0 | | | | |
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |

### recurring_revenue

| order | title | goal | doneCriteria | estimatedHours |
| --- | --- | --- | --- | --- |
| 0 | | | | |
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |

### growth

| order | title | goal | doneCriteria | estimatedHours |
| --- | --- | --- | --- | --- |
| 0 | | | | |
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |

## 3. 저작 우선 순서

콘텐츠 저작은 다음 순서로 진행한다. 뒤 단계 저작은 앞 단계가 최소 초안(draft) 수준으로
끝난 뒤 시작하는 것을 권장한다.

1. **진단 설문** (`docs/content/survey-authoring.md`) — 사용자가 가장 먼저 만나는
   콘텐츠이며, 이후 태스크 추천의 입력값(사업화 단계)을 결정하므로 최우선 저작한다.
2. **초기 4단계 태스크 템플릿** — `idea` → `validation` → `mvp` → `launch`.
   대다수 신규 사용자가 이 구간에 몰리므로 완료 조건과 예상 시간을 가장 정교하게 다듬는다.
3. 나머지 4단계 (`user_acquisition` → `first_revenue` → `recurring_revenue` → `growth`) 저작.

## 4. 저작 체크리스트

- [ ] 8단계 전체에 정확히 5개씩, 총 40개 템플릿이 저작되었는가?
- [ ] 각 단계 내 `order` 값이 0~4로 중복 없이 부여되었는가?
- [ ] 모든 템플릿의 `doneCriteria`가 "예/아니오"로 판별 가능한 구체적 조건인가?
- [ ] `estimatedHours`가 1인 개발자의 파트타임 작업 기준으로 현실적인가?
- [ ] 초기 4단계(idea~launch) 템플릿이 우선 완성되었는가?
