# 현장완료 안전 릴리스

현장완료는 D1 스키마, API Worker, 정적 웹을 한 순서로 검증하고 배포합니다.
웹을 마지막에 배포하므로 API readiness가 실패하면 현재 웹 배포본을 그대로 유지합니다.

## 로컬 릴리스 검증

```bash
corepack pnpm run field:release:check
```

이 명령은 원격 환경을 변경하지 않고 다음 단계를 순서대로 실행합니다.

1. `fieldstep` 전체 패키지 타입 검사
2. `fieldstep` 전체 테스트
3. 격리된 빈 로컬 D1에 migration ledger 전체 적용
4. 웹 정적 export 빌드

한 단계라도 실패하면 이후 단계는 실행하지 않습니다.

## 원격 배포

```bash
FIELDSTEP_DEPLOY_CONFIRM=field.toris.kr corepack pnpm run deploy:field
```

명시적인 확인 환경변수가 없으면 원격 작업을 시작하지 않습니다. 로컬 검증이 모두
통과한 뒤 아래 순서로 진행합니다.

1. `fieldstep-media` R2 버킷 접근 확인
2. 원격 D1 migration ledger 적용
3. API Worker 배포
4. `https://api.field.toris.kr/health/ready` readiness 확인
5. 웹 Worker 배포

readiness는 필수 D1 테이블·인덱스·컬럼과 R2 연결을 읽기 전용으로 검사합니다.
제한 시간 안에 `ready`가 되지 않으면 웹 배포를 실행하지 않습니다. 현재 스키마
게이트는 `0007_concurrency_guards.sql`의 revision/write token부터
`0011_maintenance_schedules.sql`의 정기점검 제약까지 확인합니다.

## D1 migration 규칙

- migration 파일은 `fieldstep/apps/server/d1/NNNN_name.sql` 형식을 사용합니다.
- 배포 스크립트는 파일명을 하드코딩하지 않고 Wrangler migration ledger에 아직
  적용되지 않은 파일을 순서대로 실행합니다.
- 로컬 검증은 매번 임시 저장소의 빈 D1에서 시작해 `0000`부터 최신 migration까지
  실제 Wrangler ledger로 적용한 뒤 임시 저장소를 삭제합니다.
- 이미 적용한 migration 파일을 수정하지 말고 다음 번호 파일을 추가합니다.
- 원격 migration은 전진 적용으로 작성하며, 테이블·컬럼 삭제처럼 되돌리기 어려운
  변경은 별도 백업·복구 계획과 검증 없이 포함하지 않습니다.

현재 적용 상태는 서버 패키지에서 다음 명령으로 확인할 수 있습니다.

```bash
corepack pnpm --filter @fieldstep/server run db:migrations:list:remote
```

## 상태 확인

- `/health`: 프로세스 생존 여부만 확인하는 liveness
- `/health/ready`: D1 스키마와 R2 연결까지 확인하는 readiness

readiness 응답은 내부 오류를 공개하지 않습니다. 실패 원인은 Worker의 구조화 로그에서
요청 ID와 함께 확인합니다.

## 정기점검 작업 생성 운영

- 사무실 사용자가 정기점검 화면에 처음 들어오면 조직별 single-flight 요청으로
  향후 90일, 최대 50건을 자동 생성한 뒤 목록을 불러옵니다.
- 자동 생성이 실패해도 목록 조회는 계속하며 화면 경고와 `향후 90일 작업 생성`
  버튼으로 재시도할 수 있습니다.
- 생성은 결정적 작업 ID, 일정 revision, occurrence UNIQUE 제약으로 중복 요청과
  동시 실행에 안전합니다. `limitReached`가 표시되면 버튼을 다시 실행합니다.
- 이번 MVP에는 Worker Cron을 연결하지 않습니다. 정기점검 화면 진입 시의 lazy
  auto-sync가 운영 트리거이며, 무인 백그라운드 선생성은 사용량과 운영 주기가
  확인된 뒤 scheduled handler로 확장합니다.

## 실패 시 원칙

- 로컬 검증 실패: 수정 후 `corepack pnpm run field:release:check`를 처음부터 다시
  실행합니다.
- R2/migration/API 실패: 웹은 배포되지 않습니다. 원인을 해결한 뒤 안전 배포 명령을
  다시 실행합니다. migration ledger가 이미 적용한 파일은 다시 실행하지 않습니다.
- API readiness 실패: 새 웹과의 계약이 준비되지 않은 상태이므로 웹만 따로 배포하지
  않습니다.
