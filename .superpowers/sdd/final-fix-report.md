# Cinematic Project Showcase — Final Fix Report

## Status

COMPLETE — reviewer findings 1–8 and the two final re-review findings are implemented. Focused/full Jest, changed-file lint/format, webpack production build, static route artifacts, asset integrity, and all 31 Cypress production-server cases pass.

## Finding mapping

1. **Theme accessibility**
   - Centralized all nine themes in `src/components/projects/landing/themes.ts`.
   - Split page, surface, solid CTA, page accent text, and surface accent text color tokens.
   - The page eyebrow uses `pageAccentText`; proof-card numbers use `surfaceAccentText` instead of sharing decorative `accent2`.
   - Verified seven WCAG text pairs per theme at 4.5:1 or higher, including both new 12px accent-text contexts across all nine themes.
   - All nine landings consume the centralized contract; the cinematic secondary CTA uses page tokens without changing unrelated consumers.

2. **SnapMate asset and state**
   - Replaced `screen-camera.png` with the exact bytes from `/Users/toris/projects/SnapMate/playstore/4.png`.
   - Capture changes the signature image from the verified camera screen to the gallery screen, with distinct Korean alts and no stale camera image.
   - Reused the exported safe-image fallback and retained the portrait presentation.
   - Added native reduced-motion CSS for the Snap card and shared Reveal elements.

3. **Bubble Bible share completion**
   - Share begins disabled, unlocks after reading, and changes the unique live status to exactly `소그룹 나눔 카드 준비 완료`.

4. **Youth Money scanner**
   - Added controlled age, region, and interest selects; the result reflects all three criteria.
   - Added the exact external `온통청년 정책 통합검색` link with `_blank` and `noopener noreferrer`.
   - Added `검토일 2026.07.13` and retained `실제 신청 전 원문을 확인하세요` without eligibility or benefit claims.

5. **E2E proof**
   - Covers 375×812, 768×1024, and 1280×900.
   - Uses trusted CDP Tab navigation to reach controls, observes a real `keydown` with `isTrusted === true`, and verifies the active element, `:focus-visible`, and a computed visible outline/box-shadow.
   - Uses trusted CDP Enter/Space activation and verifies final interaction states, card presence, image natural width, console errors, overflow, and scoped naming.
   - Uses Chromium `Emulation.setEmulatedMedia` for native `prefers-reduced-motion: reduce` proof and asserts actual computed transform, opacity, transition duration, and animation duration on Snap and shared Reveal elements.

6. **Asset/card minors**
   - Added distinct privacy-safe 1200×675 Dongne Paint and Starlight Greenhouse SVG covers while retaining original gallery icons.
   - Added `Project.imageAlt` for all nine projects and preserved the existing fallback.

7. **CTA minor**
   - Added optional `Project.ctaLabel`.
   - Seven generic GitHub-profile destinations use `GitHub 프로필 보기`; public repository/service destinations retain `프로젝트 보기`.

8. **Prior precision items**
   - Tightened exact Bubble, Dongne, Product Growth, and shell interaction assertions, including focus, destinations, content, and fallback behavior.

## TDD RED/GREEN record

- Baseline: `pnpm test --runInBand`
  - PASS: 14 suites, 123 tests.
- Contract RED: project data and cinematic interaction suites
  - Expected FAIL: 2 suites, 26 failed / 17 passed.
  - Proved missing theme tokens, Snap asset/state/fallback, Bubble completion, Youth criteria/source/date, covers/alts, and CTA labels.
- Contract GREEN: same command
  - PASS: 2 suites, 43 tests.
- Reduced-motion RED:
  - Native CDP media emulation reported both reduced-motion queries true; the dedicated computed-style test failed because the Snap card lacked the static-motion scope.
- Reduced-motion GREEN:
  - Added the narrowly scoped `.cinematic-reduced-static` class and native CSS media query.
  - Dedicated Cypress test PASS: 1/1; Snap and multiple shared Reveals compute to `transform: none`, `opacity: 1`, and motion durations no greater than 1 ms.
- Final re-review theme RED:
  - `themes.test.ts` failed all nine parameterized cases because `pageAccentText` and `surfaceAccentText` did not exist.
  - The cinematic shell test then failed because the new CSS variables and separate eyebrow/proof usages were absent.
- Final re-review theme GREEN:
  - Theme contract PASS: 10/10 with page/surface accent contrast at 4.5:1 or higher for all nine themes.
  - Cinematic usage plus theme suites PASS: 21/21.
- Final re-review focus RED:
  - Computed focus-indicator checks alone passed under programmatic `.focus()` and therefore did not prove keyboard navigation.
  - Adding the required trusted Tab observation failed the dedicated Cypress case 0/1 with `expected false to be true`.
- Final re-review focus GREEN:
  - Replaced programmatic focus with bounded CDP Tab traversal and verified trusted Tab, actual focus ownership, `:focus-visible`, and a computed outline/box-shadow before activation.
  - Dedicated Cypress case PASS: 1/1; full production-server suite PASS: 31/31.
- Final focused Jest:
  - PASS: 4 suites, 46 tests.
- Final full Jest:
  - PASS: 15 suites, 137 tests.

## Verification record

- Changed-file ESLint: PASS.
- Changed-file Prettier: PASS.
- `pnpm exec next build --webpack`: PASS; 228 static pages generated and `/projects/[slug]` is SSG.
- Static artifacts: HTML/RSC artifacts exist for all nine new routes.
- Cypress against the production server on port 8080: PASS, 31/31.
  - One dedicated native reduced-motion case.
  - Nine final-state cases at each of three viewports.
  - Three project-card presence cases.
  - Every signature activation uses trusted Tab navigation and a computed visible focus indicator; Bubble share and Product Growth secondary selection use the same proof path.
  - Zero screenshots, video disabled, server stopped after the run.
- Assets:
  - Snap source/copy SHA-256: `ad89b8b982ba92dfa3446d3d4c7dad6ef9630416f23d7e02dde46bc2011fac38`.
  - Camera: 560×1600; gallery: 706×1600.
  - Dongne/Starlight covers declare 1200×675 and have distinct hashes.
- `git diff --check`: PASS.

## Concerns

- No unresolved showcase defect remains in the requested scope.
- The production build still prints pre-existing repository warnings for invalid/obsolete Next config keys, inferred workspace root from multiple lockfiles, stale Browserslist data, and an unrelated edge-runtime route.
- Unrelated existing GitHub OpenGraph requests can occasionally return HTTP 429; scoped browser console assertions remained green.

## Files changed

- Data/cards: `src/data/projects.ts`, `src/data/__tests__/projects.test.ts`, `src/components/projects/ProjectsLanding.tsx`
- Theme/shell/shared: `src/components/projects/landing/themes.ts`, `cinematic.tsx`, `shared.tsx`, `src/styles/globals.css`
- Nine cinematic landings under `src/components/projects/landing/`
- Tests: `cinematic-interactions.test.tsx`, `themes.test.ts`, `cypress/e2e/projects-cinematic.cy.ts`
- Assets: exact Snap camera PNG plus distinct Dongne/Starlight SVG covers.
