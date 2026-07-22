# Project guidance

## 모노레포 구조

pnpm 워크스페이스 모노레포. 루트 자체가 toris.kr(Astro) 사이트 패키지이고,
builder.toris.kr 제품군은 `builderstep/` 서브트리에 있다.

- 루트 `src/`, `public/`, `worker/` — toris.kr (Astro 5 + Tailwind 4, Cloudflare Workers `toris-site`)
- `builderstep/apps/web` — builder.toris.kr (`@builderstep/web`, Next.js 정적 export, Workers `builderstep-web`)
- `builderstep/apps/server` — api.builder.toris.kr 워커 (`@builderstep/server`)
- `builderstep/apps/mobile` — Expo 앱 (`@builderstep/mobile`)
- `builderstep/packages/shared` — 도메인 계약 공유 (`@builderstep/shared`)
- `builderstep/apps/web/out/`은 빌드 산출물 — 추적하지 않는다(배포는 항상 fresh build)

## 배포 (루트에서 실행)

- `pnpm run deploy:toris` — toris.kr (astro build → wrangler deploy → IndexNow ping)
- `pnpm run deploy:builder` — builder.toris.kr (next build → wrangler deploy)
- `pnpm run deploy:all` — 두 사이트 순차 배포
- `pnpm run builder:typecheck` / `pnpm run builder:test` — builderstep 전 패키지 검사

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
