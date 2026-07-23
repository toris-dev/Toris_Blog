# fatestep — 운명의 카드 (fate.toris.kr)

> 미래를 맞히는 카드보다, 오늘을 선택하는 카드.

한국어 자기성찰 카드 리딩 서비스. `fate_bound`(Flutter) 프로젝트의 디자인·콘텐츠·리딩 엔진을
**Astro 정적 웹 + 클라이언트 React 아일랜드**로 재구축해 `fate.toris.kr`에 **완전 무료**로 호스팅한다.

## 구조

- `apps/web` — `@fatestep/web`. Astro static 빌드를 Cloudflare Workers Static Assets `fatestep-web`으로
  서빙한다(워커 스크립트 없음, 커스텀 도메인 `fate.toris.kr`).
  - `src/lib` — 도메인 로직(Flutter 원본 이식): `types.ts`, `korean.ts`(조사 처리), `deck.ts`(36장),
    `safety.ts`(안전정책), `engine.ts`(리딩 엔진), `storage.ts`(localStorage), `rng.ts`. `engine.test.ts`(vitest)로 검증.
  - `src/app/App.tsx` — 전체 플로우(인트로·홈·질문설정·리추얼·선택·공개·결과·기록·설정) 단일 React 아일랜드.
  - `src/pages` — `index.astro`(앱 마운트), `terms.astro`, `privacy.astro`.
  - `src/data/cards.json` — 기본 덱 36장(단일 출처). `public/cards/*.webp` — 카드 일러스트.

## 서버가 없는 이유

앱은 익명·회원가입 없음이며 카드 뽑기·해석·기록이 모두 브라우저에서 동작한다. 어떤 데이터도 서버로
전송하지 않으므로 백엔드(Lambda/Worker/DB)가 필요 없다 — 순수 정적 배포로 완전 무료.

## 원본(fate_bound) 대비

- Flutter → Astro/React 재구축. 리딩 엔진·안전정책·한국어 조사 처리·36장 콘텐츠를 TypeScript 로 그대로 이식.
- 결제/구독(RevenueCat) 전면 제거 — 모든 기능 무제한 무료.

## 로컬

```bash
pnpm run fate:dev            # Astro dev 서버
pnpm run fate:release:check  # typecheck · test · build (배포 없음)
pnpm run fate:test           # 리딩 엔진 · 콘텐츠 QA · 안전정책 (vitest)
```

## 배포 (루트에서)

```bash
FATESTEP_DEPLOY_CONFIRM=fate.toris.kr pnpm run deploy:fate
```

`typecheck → test → astro build → wrangler deploy` 순으로 실행한다. `apps/web/wrangler.jsonc`는
fieldstep-web과 동일하게 `routes`(`fate.toris.kr/*`, zone_name `toris.kr`)를 쓴다 — 존의
`*.toris.kr` 와일드카드 DNS와 유니버설 인증서를 재사용하며, 이 구체적 라우트가 와일드카드
기본 라우트(→toris-site)를 오버라이드해 fate.toris.kr을 이 워커로 라우팅한다.
