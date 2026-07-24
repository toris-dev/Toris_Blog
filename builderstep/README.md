# BuilderStep (빌더스텝)

1인 개발자를 위한 사업화 성장 플랫폼. pnpm 워크스페이스 기반 모노레포.

## 구조

```
.
├── apps/
│   ├── server/     # Hono API 서버 + Drizzle
│   ├── web/        # Next.js 웹 클라이언트
│   └── mobile/     # Expo 모바일 클라이언트
├── packages/
│   └── shared/     # 도메인 스키마·타입·순수 함수 (@builderstep/shared)
├── docs/
│   └── content/    # 진단 설문·태스크 템플릿 저작 가이드 (창업자 저작 영역)
└── tsconfig.base.json
```

## 요구 사항

- Node.js >= 20
- pnpm 9 (`packageManager` 필드로 고정됨)

## 명령어

모노레포 루트에서 실행한다.

```sh
corepack pnpm install
corepack pnpm run builder:typecheck
corepack pnpm run builder:test
```

각 워크스페이스는 `@builderstep/shared`, `@builderstep/server`, `@builderstep/web`, `@builderstep/mobile` 이름으로 `workspace:*` 프로토콜을 통해 서로 참조한다.

## 릴리스

배포 전에 전체 BuilderStep 패키지의 타입 검사와 테스트, 빈 임시 D1에 모든 번호 기반
migration 적용, Next.js 정적 export 빌드를 한 번에 검증한다. 임시 D1은 검증이 끝나면
삭제되고 원격 리소스는 변경하지 않는다.

```sh
corepack pnpm run builder:release:check
```

운영 배포는 대상 호스트를 명시적으로 확인해야만 시작한다.

```sh
BUILDERSTEP_DEPLOY_CONFIRM=builder.toris.kr corepack pnpm run deploy:builder
```

전체 사이트 배포도 같은 확인값이 필요하며, 이 값이 없으면 `toris.kr` 배포를 시작하기
전에 중단된다.

```sh
BUILDERSTEP_DEPLOY_CONFIRM=builder.toris.kr corepack pnpm run deploy:all
```

배포 파이프라인은 로컬 검증을 모두 통과한 뒤 다음 순서를 보장한다.

1. 기존 D1 스키마와 migration ledger 일치 여부를 읽기 전용으로 확인
2. `builderstep` 원격 D1 migration 적용
3. `api.builder.toris.kr` API Worker 배포
4. `https://api.builder.toris.kr/health`와 읽기 전용 D1 probe 응답 확인
5. `builder.toris.kr` 웹 Worker 배포

API readiness가 제한 시간 안에 확인되지 않으면 웹 배포는 실행하지 않는다. Cloudflare
인증과 Worker secret은 배포 전에 별도로 설정되어 있어야 한다.

이미 수동으로 만든 운영 테이블과 Wrangler migration ledger가 어긋나 있으면, 과거의
비멱등 데이터 migration을 재실행하지 않도록 자동 배포가 중단된다. 이 경우 운영
스키마를 확인한 뒤 ledger를 수동 조정해야 한다.

서버 migration 상태를 개별 확인하거나 적용할 때는 다음 명령을 사용한다.

```sh
corepack pnpm --filter @builderstep/server run db:migrations:list:local
corepack pnpm --filter @builderstep/server run db:migrations:list:remote
corepack pnpm --filter @builderstep/server run db:migrate:local
corepack pnpm --filter @builderstep/server run db:migrate:remote
```

`d1/seed_command_center.sql`은 데모/개발용 수동 시드이며 번호 기반 운영 migration
패턴에서 제외된다.

## 도메인 단계

사업화 8단계: `idea → validation → mvp → launch → user_acquisition → first_revenue → recurring_revenue → growth`

전체 스키마와 타입은 `packages/shared/src/domain.ts`를 참고한다.
