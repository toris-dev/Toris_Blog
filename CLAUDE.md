# Project guidance

## 모노레포 구조

pnpm 워크스페이스 모노레포. 루트 자체가 toris.kr(Astro) 사이트 패키지이고,
builder.toris.kr 제품군은 `builderstep/`, field.toris.kr 제품군은 `fieldstep/`,
fate.toris.kr(운명의 카드)는 `fatestep/` 서브트리에 있다.

- 루트 `src/`, `public/`, `worker/` — toris.kr (Astro 5 + Tailwind 4, Cloudflare Workers `toris-site`)
- `builderstep/apps/web` — builder.toris.kr (`@builderstep/web`, Next.js 정적 export, Workers `builderstep-web`)
- `builderstep/apps/server` — api.builder.toris.kr 워커 (`@builderstep/server`)
- `builderstep/apps/mobile` — Expo 앱 (`@builderstep/mobile`)
- `builderstep/packages/shared` — 도메인 계약 공유 (`@builderstep/shared`)
- `fieldstep/apps/web` — field.toris.kr 현장완료 웹 (`@fieldstep/web`, Next.js 정적 export, Workers `fieldstep-web`)
- `fieldstep/apps/server` — api.field.toris.kr 워커 (`@fieldstep/server`, Hono + D1, PRD: `현장완료_PRD_바이브코딩_v1.0.md`)
- `fieldstep/packages/shared` — 현장완료 도메인 계약·상태 전이·구조화 파서 (`@fieldstep/shared`)
- `fatestep/apps/web` — fate.toris.kr 운명의 카드 (`@fatestep/web`, Astro 정적 + 클라이언트 React 아일랜드, Workers Static Assets `fatestep-web`). 서버 없음 — 카드 데이터·리딩 엔진·기록이 모두 브라우저(localStorage)에서 동작하는 완전 무료 서비스. 리딩 엔진·안전정책은 `src/lib`(vitest 검증)
- `builderstep/apps/web/out/`·`fieldstep/apps/web/out/`·`fatestep/apps/web/dist/`는 빌드 산출물 — 추적하지 않는다(배포는 항상 fresh build)

## 배포 (루트에서 실행)

- `pnpm run deploy:toris` — toris.kr (astro build → wrangler deploy → IndexNow ping)
- `pnpm run deploy:builder` — builder.toris.kr (next build → wrangler deploy)
- `pnpm run deploy:field` — field.toris.kr 웹 + api.field.toris.kr 워커 (최초 배포 전 `wrangler d1 create fieldstep` 후 wrangler.jsonc의 database_id 교체와 `pnpm --filter @fieldstep/server run db:migrate:remote` 필요)
- `pnpm run deploy:fate` — fate.toris.kr (typecheck·test·astro build → wrangler deploy). `FATESTEP_DEPLOY_CONFIRM=fate.toris.kr` 필요. wrangler.jsonc 는 fieldstep과 동일하게 `routes`(`fate.toris.kr/*`, zone_name `toris.kr`)를 쓴다 — 존의 `*.toris.kr` 와일드카드 DNS·유니버설 인증서를 재사용하고, 구체적 라우트가 와일드카드(→toris-site)를 오버라이드한다
- `pnpm run deploy:all` — toris·builder 순차 배포
- `pnpm run builder:typecheck` / `pnpm run builder:test` — builderstep 전 패키지 검사
- `pnpm run field:typecheck` / `pnpm run field:test` — fieldstep 전 패키지 검사
- `pnpm run fate:typecheck` / `pnpm run fate:test` — fatestep 검사. `pnpm run fate:release:check` — 로컬 검증(typecheck·test·build)만, 배포 없음. `pnpm run fate:dev` — 로컬 Astro dev

원본 저장소 `/Users/toris/projects/builder_step`은 서브트리 임포트 원본(레거시)이며,
이후 개발은 이 모노레포에서 진행한다.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
