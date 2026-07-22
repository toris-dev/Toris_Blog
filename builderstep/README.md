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

루트에서 실행하면 모든 워크스페이스에 위임된다.

```sh
pnpm install       # 의존성 설치
pnpm run typecheck # 전체 워크스페이스 tsc --noEmit
pnpm run test      # 전체 워크스페이스 vitest run
```

각 워크스페이스는 `@builderstep/shared`, `@builderstep/server`, `@builderstep/web`, `@builderstep/mobile` 이름으로 `workspace:*` 프로토콜을 통해 서로 참조한다.

## 도메인 단계

사업화 8단계: `idea → validation → mvp → launch → user_acquisition → first_revenue → recurring_revenue → growth`

전체 스키마와 타입은 `packages/shared/src/domain.ts`를 참고한다.
