# 홈 개발자 정체성 Product Pipeline 설계

## 목적

홈의 `Full-Stack Work / 21앤 (21n)` 단일 경력 소개를 제거하고, 방문자가 토리스가 어떤 방식으로 제품을 만드는 개발자인지 직접 조작하며 이해하도록 바꾼다.

대상 독자는 채용 담당자, 협업 파트너, 제품 동료와 프로젝트 방문자다. 이 장면의 단일 목적은 다음 문장을 20초 안에 납득시키는 것이다.

> 제품의 처음과 끝을 연결하는 Product Full-Stack Developer

회사의 이름이나 특정 프로젝트 하나가 정체성을 대신하지 않는다. 문제 정의, 경험 설계, 시스템 구축, 출시와 운영을 하나의 책임 범위로 연결하는 방식 자체가 주인공이다.

## 승인된 방향과 대안

### 채택: Product Pipeline

`문제 발견 → 경험 설계 → 시스템 구축 → 출시·운영`을 실제 순서가 있는 네 단계 트랙으로 표현한다. 방문자는 각 단계를 선택해 토리스가 무엇을 판단하고 어떤 결과까지 책임지는지 확인한다.

이 방식은 개발자 정체성을 기술 목록이 아니라 제품을 완성하는 흐름으로 보여준다. 바로 아래의 프로젝트 쇼케이스와 기술 궤도 장면에 각각 “증거”와 “도구” 역할을 남겨 페이지 전체 서사도 선명해진다.

### 제외: Developer OS

터미널과 데스크톱 창을 조작하는 방식은 개발자다운 인상이 강하지만, 현재 히어로의 터미널 카드 및 기술 장면과 시각 언어가 겹친다.

### 제외: Capability Constellation

역량을 궤도에 배치하면 아름답지만 바로 아래 `TechOrbitScene`과 구조가 중복되고, 제품의 순서를 설명하기 어렵다.

## 범위

### 포함

- 홈의 기존 21앤 중심 `CareerArchitectureScene` 제거
- `DeveloperIdentityScene` 추가
- Product Pipeline의 정적 콘텐츠와 타입 추가
- 마우스, 터치, 키보드로 선택 가능한 네 단계 인터랙션
- 라이트, 다크, 사이버펑크 테마 대응
- 모바일 반응형, visible focus, reduced-motion 대응
- 단위 테스트, 프로덕션 브라우저 테스트와 시각 QA

### 제외

- `/about`의 경력 정보 변경
- `/projects/21n-apps` 또는 다른 프로젝트 랜딩 변경
- 홈의 Hero, Knowledge, Projects, Tech Stack, Final CTA 장면 재설계
- 새 폰트, 이미지, 외부 API 또는 패키지 추가
- 자동 재생, 타이머 기반 단계 전환, 상태 저장

## 핵심 카피

- Eyebrow: `HOW I BUILD`
- 역할: `Product Full-Stack Developer`
- 제목: `제품의 처음과 끝을 연결하는 개발자`
- 설명: `문제를 제품의 언어로 정리하고, 화면과 시스템을 함께 설계해, 실제로 운영되는 결과까지 만듭니다.`
- 보조 문장: `한 경계에서 다음 팀으로 넘기는 대신, 결정이 제품 전체에서 어떻게 작동하는지 끝까지 확인합니다.`

`Full-Stack Work`, `21앤 (21n) — 앱부터 인프라까지`, `B2B2C 병원 시술 전자계약 플랫폼`과 기존 요약 문장은 홈에서 모두 제거한다.

## 콘텐츠 모델

`content.ts`의 `career`와 `ArchLayer`를 제거하고 다음 구조의 `developerPipeline`을 둔다.

| 순서 | ID | 짧은 라벨 | 제목 | 설명 | 결과 | 신호 |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | `frame` | `Frame` | 문제를 제품 언어로 | 사용자 맥락과 제약을 읽고 해결할 문제, 핵심 흐름, 성공 조건을 좁힌다. | 명확한 MVP와 우선순위 | 사용자 흐름 · 정보 구조 · 제품 가설 |
| 02 | `shape` | `Shape` | 만지고 이해되는 경험으로 | 웹과 모바일의 차이를 고려해 첫 화면부터 완료 상태까지 자연스럽게 이어지는 경험을 설계한다. | 설명 없이도 작동하는 인터페이스 | Web · Mobile · Interaction |
| 03 | `build` | `Build` | 화면과 시스템을 함께 | API, 데이터, 인증, 결제와 인프라를 화면의 흐름과 같은 제품 계약으로 연결한다. | 변화에 견디는 제품 시스템 | API · Data · Integration · Infrastructure |
| 04 | `ship` | `Ship` | 배포 이후까지 운영으로 | 테스트와 배포 파이프라인을 만들고 실제 사용에서 발견한 신호를 다음 개선으로 되돌린다. | 운영 가능한 릴리스와 반복 | Testing · CI/CD · Observability · Iteration |

각 단계는 확인 가능한 책임과 결과만 말한다. 성과 수치, 팀 규모, 사용자 수처럼 검증되지 않은 지표는 추가하지 않는다.

## 시각 시스템

### 주제와 시각적 비유

하나의 아이디어가 실제 제품으로 이동하는 `Product Runway`를 사용한다. 네 단계는 서로 분리된 카드가 아니라 하나의 연속된 회로 트랙 위 노드다. 활성 노드를 선택하면 작은 product packet이 해당 위치로 이동하고, 아래의 하나뿐인 작업대가 그 단계의 판단과 산출물로 바뀐다.

이 연속 트랙이 장면의 시그니처이며, 장식용 카드와 글로우는 추가하지 않는다. 구조 자체가 “경계를 넘나들며 제품을 끝까지 연결한다”는 메시지를 전달해야 한다.

### 팔레트

새 고정 테마를 만들지 않고 기존 토큰에 의미를 부여한다. 아래 hex는 라이트 테마 기준이며 다크·사이버펑크에서는 같은 semantic token을 사용한다.

- Canvas White `#FFFFFF`: 장면 배경, `background`
- Product Ink `#111827`: 제목과 핵심 결과, `foreground`
- Signal Indigo `#6366F1`: 활성 노드와 packet, `primary`
- Handoff Pink `#EC4899`: 다음 경계로 이어지는 보조 신호, `secondary`
- Shipped Green `#10B981`: 결과와 완료 신호, `accent`
- Quiet Gray `#6B7280`: 설명과 유틸리티 텍스트, `muted-foreground`

색상만으로 활성 상태를 표시하지 않는다. 숫자, 굵기, 위치, `aria-selected`와 활성 패널의 제목이 함께 바뀐다.

### 타이포그래피

- Display: 기존 `Space Grotesk` 변수 폰트. `Product Full-Stack Developer`, 단계 번호와 짧은 영문 라벨에 제한해 사용한다.
- Body: 기존 `Inter`와 시스템 한글 폴백. 제목, 설명과 결과를 담당한다.
- Utility: `font-mono` 시스템 스택. `INPUT`, `DECISION`, `OUTPUT` 같은 작은 구조 라벨에만 사용한다.

새 폰트를 내려받지 않는다. 기존 타입 조합 안에서 크기, 굵기, 자간의 역할을 더 명확히 나눈다.

## 레이아웃

### 데스크톱

```text
┌──────────────────────────────────────────────────────────────┐
│ HOW I BUILD                         Product Full-Stack Dev    │
│ 제품의 처음과 끝을 연결하는 개발자                          │
│ 설명                                                         │
│                                                              │
│  01 FRAME ━━━ 02 SHAPE ━━━ 03 BUILD ━━━ 04 SHIP             │
│      ● product packet                                        │
│                                                              │
│ ┌─ ACTIVE STAGE ───────────────────────┬─ OUTPUT ──────────┐ │
│ │ 문제를 제품 언어로                   │ 명확한 MVP와      │ │
│ │ 단계 설명                            │ 우선순위          │ │
│ │ 사용자 흐름 · 정보 구조 · 제품 가설 │ 01 / 04           │ │
│ └──────────────────────────────────────┴────────────────────┘ │
│ 한 경계에서 다음 팀으로 넘기는 대신…                         │
└──────────────────────────────────────────────────────────────┘
```

장면은 `max-w-6xl` 안에서 기존 홈 씬의 수직 리듬을 따른다. 트랙은 하나의 수평선과 네 노드로 구성한다. 아래 작업대는 두 영역을 비대칭으로 나눠 왼쪽에 판단 과정, 오른쪽에 결과를 둔다. 모든 모서리를 둥글게 만들지 않고, 작업대에는 절제된 절단 모서리 또는 한쪽 열린 테두리를 사용해 기존 카드 그리드와 구분한다.

### 모바일

네 단계는 왼쪽 연속선이 있는 세로 탭 목록으로 바뀐다. 각 버튼은 번호, 영문 라벨, 한글 제목을 포함하고 최소 48px 높이를 가진다. 활성 작업대는 탭 목록 바로 아래에 전체 폭으로 나타난다. 정보 순서는 제목 → 설명 → 신호 → 결과이며 가로 스크롤을 만들지 않는다.

### 태블릿

수평 트랙을 유지하되 영문 라벨과 번호를 우선하고, 긴 한글 제목은 활성 작업대에서만 보여준다. 작업대는 공간이 부족하면 한 열로 쌓인다.

## 인터랙션

### 단계 선택

- 최초 상태는 `01 Frame`이다. 서버와 클라이언트가 같은 결정적 초기 상태를 사용한다.
- pointer hover는 미리보기 상태를 만들지 않는다. click, touch 또는 명시적 키보드 선택만 상태를 바꿔 의도하지 않은 전환을 막는다.
- 단계 선택 시 packet이 해당 노드로 이동하고 작업대의 제목, 설명, 신호와 결과가 교체된다.
- 마지막 단계 뒤에 자동으로 처음으로 돌아가지 않는다.

### 키보드와 의미 구조

- 트랙은 `role="tablist"`, 각 단계는 `role="tab"`, 작업대는 `role="tabpanel"`을 사용한다.
- 탭 콘텐츠가 즉시 표시되므로 자동 활성화 모델을 사용한다. `ArrowLeft`/`ArrowRight`와 `ArrowUp`/`ArrowDown`은 포커스와 선택을 함께 이전·다음 단계로 이동한다.
- `Home`은 첫 단계, `End`는 마지막 단계로 이동한다.
- roving `tabIndex`로 활성 탭 하나만 일반 Tab 순서에 둔다.
- 선택된 탭은 `aria-selected`, 작업대는 `aria-labelledby`와 고정된 `aria-live="polite"` 상태 문장으로 연결한다.
- 모든 탭은 실제 2px 이상의 focus-visible outline 또는 ring을 가진다.

### 모션

강한 모션은 단계 선택 시 한 번만 사용한다.

- packet: 현재 노드 사이를 짧은 spring으로 이동
- 작업대: 8px 이하의 y 이동과 opacity 교차 전환
- 활성 노드: scale 대신 선 굵기와 채움 변화
- hover: 색과 테두리만 변경, 반복 모션 없음

`prefers-reduced-motion`에서는 packet과 작업대가 즉시 최종 상태로 바뀐다. 콘텐츠 이해나 단계 선택은 애니메이션 완료에 의존하지 않는다.

## 컴포넌트와 파일 경계

### `DeveloperIdentityScene.tsx`

장면의 활성 단계 상태, 키보드 탐색과 시각 구조만 소유한다. 파일 내부의 작은 `PipelineTab`, `PipelineTrack`, `StageWorkbench` 컴포넌트는 각각 탭, 장식 트랙, 패널 하나의 책임만 가진다. 파일이 과도하게 커질 때만 같은 `scenes/` 폴더의 별도 파일로 분리한다.

### `content.ts`

정적 `developerPipeline` 데이터와 `DeveloperPipelineStage` 타입만 소유한다. React 요소나 아이콘 컴포넌트는 저장하지 않는다. 아이콘이 필요하면 직렬화 가능한 키를 두고 scene에서 매핑한다.

### `Home3DLanding.tsx`

기존 `CareerArchitectureScene` import와 렌더를 `DeveloperIdentityScene`으로 교체한다. 장면 순서는 `Knowledge → Developer Identity → Projects → Tech Stack`을 유지한다.

### 제거

- `CareerArchitectureScene.tsx`
- `career` 정적 객체
- 다른 곳에서 사용되지 않는 `ArchLayer`와 career 전용 아이콘 키·매핑

## 데이터 흐름과 경계 상태

모든 데이터는 빌드에 포함된 정적 배열이며 네트워크 요청이 없다.

1. 장면은 첫 단계 ID로 초기화된다.
2. 사용자의 명시적 선택 또는 키보드 탐색이 단계 ID를 변경한다.
3. 현재 ID에서 파생한 데이터 하나를 트랙과 작업대가 공유한다.
4. 잘못된 ID를 외부에서 주입할 경로는 없지만, 조회 실패 시 첫 단계로 폴백한다.

오류 토스트, 로딩 스피너와 영속 저장은 필요하지 않다. JavaScript가 느린 동안에도 SSR 결과로 제목, 네 단계 라벨과 첫 단계 설명이 보인다. hydration 전후의 초기 DOM 의미가 달라지지 않는다.

## 접근성과 테마 계약

- 장면 제목과 tablist에 명확한 한국어 접근 가능한 이름을 제공한다.
- 작은 텍스트는 각 semantic 배경에서 WCAG AA 4.5:1 이상을 유지한다.
- 상태는 색만이 아니라 `aria-selected`, 번호, 제목과 결과 문장으로 전달한다.
- 탭은 최소 44×44px, 모바일에서는 48px 이상의 조작 영역을 가진다.
- pointer hover 없이 모든 콘텐츠에 접근할 수 있다.
- 라이트, 다크, 사이버펑크 테마에서 고정 hex 텍스트 색을 사용하지 않는다.
- 장식 트랙과 packet은 `aria-hidden`이며 스크린리더가 중복 순서를 읽지 않는다.

## 테스트 설계

### 단위·상호작용 테스트

홈 랜딩 전용 테스트를 추가해 다음을 검증한다.

- 새 제목, 역할과 네 단계가 렌더링됨
- 기존 `Full-Stack Work`, `21앤 (21n)`, B2B2C 요약이 홈 장면에 존재하지 않음
- click으로 각 단계의 제목, 설명, 결과와 신호가 정확히 교체됨
- `ArrowLeft`/`ArrowRight`, `ArrowUp`/`ArrowDown`, `Home`, `End`가 roving focus와 선택을 갱신함
- tab, tabpanel, `aria-selected`, `aria-controls`, `aria-labelledby` 연결이 유효함
- reduced-motion에서는 packet과 패널 transition이 즉시 완료됨
- 정적 콘텐츠 ID가 유일하고 네 단계 순서가 고정됨

### 브라우저 테스트

프로덕션 서버에서 홈 전용 Cypress 시나리오를 실행한다.

- 375×812, 768×1024, 1280×900에서 장면과 네 단계가 보이고 document 가로 overflow가 없음
- trusted Tab으로 Product Pipeline에 진입하고 실제 `:focus-visible` 및 계산된 outline/ring을 확인
- trusted Arrow 또는 `End`로 마지막 `Ship`까지 이동해 결과 `운영 가능한 릴리스와 반복` 확인
- 각 단계 전환 후 콘솔 오류가 없음
- CDP reduced-motion 에뮬레이션에서 packet과 작업대의 transform/transition이 정적임
- 라이트, 다크, 사이버펑크 테마에서 제목, 탭과 활성 패널이 읽을 수 있음

### 회귀 검증

- 관련 Jest 테스트
- 전체 Jest
- 변경 파일 ESLint와 Prettier
- `next build --webpack`
- 기존 프로젝트 Cypress 31개 전체 회귀
- `git diff --check`
- 홈 375px, 768px, 1280px 스크린샷 시각 검토

## 완료 조건

- 홈에서 기존 21앤 단일 경력 장면과 문구가 제거된다.
- Product Pipeline이 토리스를 Product Full-Stack Developer로 명확히 소개한다.
- 네 단계 모두 pointer, touch와 keyboard로 선택 가능하고 정확한 결과를 표시한다.
- 시그니처 트랙이 기존 프로젝트 카드·기술 궤도와 구별되는 하나의 연속 구조로 보인다.
- 모바일, 태블릿, 데스크톱과 세 테마에서 정보 손실이나 가로 overflow가 없다.
- focus-visible, tab semantics, reduced-motion과 색 대비 요구사항이 검증된다.
- 기존 프로젝트 쇼케이스 테스트와 프로덕션 빌드가 회귀 없이 통과한다.
