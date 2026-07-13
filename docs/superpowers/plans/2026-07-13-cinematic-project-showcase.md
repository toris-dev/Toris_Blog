# Cinematic Project Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add nine verified projects to `/projects`, each with a distinct, interactive, cinematic static landing page backed by local assets or privacy-safe brand artwork.

**Architecture:** Keep `projects` as the single source of route truth and `LANDINGS` as the slug-to-component registry. Add one shared cinematic page shell for layout, image fallback, motion/accessibility defaults, and CTA behavior; each project file owns only its signature interaction, visual theme, and verified narrative. Store copied marketing assets under project-specific public folders and cover the data contract, registry parity, interaction state, static build, and responsive browser behavior with Jest and Cypress.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.3, Tailwind CSS 3, Framer Motion 12, Jest 30 + Testing Library, Cypress 13.

## Global Constraints

- Preserve all 16 existing project entries and dedicated landing pages.
- Add exactly these slugs: `21n-apps`, `snapmate`, `bubble-bible`, `dongne-paint`, `youth-money-guide`, `starlight-greenhouse`, `volley-king-30`, `toris-docs`, `product-growth-skills`.
- Use only features, status, technology, links, and claims verified from the local repositories or the GitHub connector.
- Do not copy or render the `21n_apps/mock/images/` or `21n_apps/mock/hospital/` files.
- Do not expose private notes from `toris-docs`; show only generic folder names and workflow relationships.
- Do not invent metrics, users, revenue, ratings, release dates, store links, or live-service URLs.
- Every signature interaction must work with a keyboard-visible `<button>` and remain understandable without motion.
- Respect `prefers-reduced-motion`; no autoplay audio/video, infinite project-specific motion, or horizontal-scroll-only content.
- Keep minimum interactive target height/width at 44px on mobile.
- Every local image must have descriptive Korean `alt` text and a palette-based fallback.
- All new pages must remain statically generated through `generateStaticParams()`.
- Required final checks: focused Jest tests, lint for changed source files, `next build --webpack`, `git diff --check`, and responsive Cypress/browser QA at 375, 768, and 1280 CSS pixels.

---

## File Structure

### Create

- `src/data/__tests__/projects.test.ts` — proves new project metadata, link safety, and slug uniqueness.
- `src/components/projects/landing/__tests__/registry.test.ts` — proves project data and `LANDINGS` stay in parity.
- `src/components/projects/landing/__tests__/cinematic-interactions.test.tsx` — proves each signature has a keyboard button and a deterministic completed state.
- `src/components/projects/landing/cinematic.tsx` — shared shell, section layout, asset fallback, CTA, and exported theme/config types.
- `src/components/projects/landing/21nAppsLanding.tsx` — electronic-contract progress interaction.
- `src/components/projects/landing/SnapMateLanding.tsx` — shutter-to-gallery interaction.
- `src/components/projects/landing/BubbleBibleLanding.tsx` — reading completion, streak, and group-share interaction.
- `src/components/projects/landing/DongnePaintLanding.tsx` — closed-trail territory capture interaction.
- `src/components/projects/landing/YouthMoneyGuideLanding.tsx` — policy condition scanner interaction.
- `src/components/projects/landing/StarlightGreenhouseLanding.tsx` — seed-to-production idle loop interaction.
- `src/components/projects/landing/VolleyKingLanding.tsx` — receive/set/spike timing interaction.
- `src/components/projects/landing/TorisDocsLanding.tsx` — privacy-safe knowledge graph interaction.
- `src/components/projects/landing/ProductGrowthSkillsLanding.tsx` — goal-to-skill workflow router interaction.
- `cypress/e2e/projects-cinematic.cy.ts` — card visibility, route, signature, responsive, reduced-motion, and console QA.
- `public/images/projects/21n-apps/cover.svg` — abstract contract status artwork, no people or hospital imagery.
- `public/images/projects/toris-docs/cover.svg` — generic graph artwork with no note contents.
- `public/images/projects/product-growth-skills/cover.svg` — six-route workflow artwork.

### Copy from verified local repositories

- `public/images/projects/snapmate/feature.png`, `screen-camera.png`, `screen-gallery.png`, `screen-group.png`
- `public/images/projects/bubble-bible/feature.png`, `icon.png`, `logo.svg`
- `public/images/projects/dongne-paint/icon.png`
- `public/images/projects/youth-money-guide/cover.png`
- `public/images/projects/starlight-greenhouse/icon.png`
- `public/images/projects/volley-king-30/home.png`, `gameplay.png`

### Modify

- `src/data/projects.ts` — append nine `Project` records.
- `src/data/githubRepositories.ts` — add public `product-growth-skills` repository.
- `src/components/projects/landing/index.ts` — register nine dynamic landing imports.
- `src/components/projects/ProjectsLanding.tsx` — include new project names in the marquee and retain count/filter behavior.
- `src/app/projects/page.tsx` — update metadata copy to include mobile games, knowledge systems, and agent skills.
- `package.json` — add a focused cinematic-project Cypress script.

---

### Task 1: Lock the project-data contract with failing tests

**Files:**
- Create: `src/data/__tests__/projects.test.ts`
- Modify: `src/data/projects.ts`

**Interfaces:**
- Consumes: existing `Project`, `projects`, and `getProject(slug)` from `src/data/projects.ts`.
- Produces: nine new `Project` records with stable slugs and safe public CTA/image URLs.

- [ ] **Step 1: Write the failing metadata tests**

```ts
import { getProject, projects } from '@/data/projects';

const expected = [
  '21n-apps',
  'snapmate',
  'bubble-bible',
  'dongne-paint',
  'youth-money-guide',
  'starlight-greenhouse',
  'volley-king-30',
  'toris-docs',
  'product-growth-skills'
] as const;

describe('cinematic project metadata', () => {
  it.each(expected)('publishes complete metadata for %s', (slug) => {
    const project = getProject(slug);
    expect(project).toBeDefined();
    expect(project?.features.length).toBeGreaterThanOrEqual(3);
    expect(project?.tech.length).toBeGreaterThanOrEqual(2);
    expect(project?.github).toMatch(/^https:\/\//);
    expect(project?.image).toMatch(/^(\/images\/projects\/|https:\/\/)/);
  });

  it('keeps every slug unique', () => {
    const slugs = projects.map(({ slug }) => slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('does not publish private 21n mock paths or private toris-doc contents', () => {
    const serialized = JSON.stringify(expected.map(getProject));
    expect(serialized).not.toMatch(/mock\/images|mock\/hospital|업무 일지|meeting/i);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails for missing records**

Run: `pnpm test -- src/data/__tests__/projects.test.ts --runInBand`

Expected: FAIL at `expect(project).toBeDefined()` for `21n-apps`.

- [ ] **Step 3: Append the nine exact records**

Use the following record contract. Each feature description must be a factual Korean sentence, not a performance claim.

| slug | name / status / tags | category / platform | tech | CTA | image | exact feature titles |
|---|---|---|---|---|---|---|
| `21n-apps` | `21n Apps` / `개발 중` / `Company, Fullstack` | `전자계약 · 운영 플랫폼` / `Web · Monorepo` | `Next.js, NestJS, TypeScript, PostgreSQL` | `https://github.com/toris-dev` | `/images/projects/21n-apps/cover.svg` | `역할별 계약 흐름`, `계약 상태 타임라인`, `모노레포 운영 경계` |
| `snapmate` | `SnapMate` / `개발 중` / `Personal, Mobile, Fullstack` | `사진 · 그룹 공유` / `Mobile (iOS · Android)` | `Expo, React Native, TypeScript, Firebase` | `https://github.com/toris-dev` | `/images/projects/snapmate/feature.png` | `카메라에서 바로 공유`, `그룹별 순간 보관`, `따뜻한 스토어 경험` |
| `bubble-bible` | `Bubble Bible` / `개발 중` / `Personal, Mobile, Fullstack` | `성경 · 커뮤니티` / `Mobile · Web` | `Expo, React Native, TypeScript, Supabase` | `https://github.com/toris-dev/bubbleBible-FE` | `/images/projects/bubble-bible/feature.png` | `오늘의 말씀 읽기`, `묵상과 연속 기록`, `교회·소그룹 나눔` |
| `dongne-paint` | `동네 칠하기 대작전` / `개발 중` / `Personal, Mobile` | `게임 · 영역 점령` / `Mobile` | `Flutter, Flame, Dart, Local Save` | `https://github.com/toris-dev` | `/images/projects/dongne-paint/icon.png` | `닫힌 경로로 점령`, `AI 봇 경쟁`, `로컬 진행 저장` |
| `youth-money-guide` | `청년머니가이드` / `운영 중` / `Personal, Frontend, Fullstack` | `정책 · 생활 금융` / `Web` | `Next.js, TypeScript, Content Curation` | `https://github.com/toris-dev` | `/images/projects/youth-money-guide/cover.png` | `조건별 정책 탐색`, `공식 출처와 검토일`, `정책·제휴 경계 표시` |
| `starlight-greenhouse` | `별빛 온실` / `개발 중` / `Personal, Mobile` | `게임 · 방치형 성장` / `Mobile` | `Flutter, Dart, Local Save` | `https://github.com/toris-dev` | `/images/projects/starlight-greenhouse/icon.png` | `별씨앗 수확`, `설비 생산 루프`, `최대 8시간 오프라인 보상` |
| `volley-king-30` | `30초 배구왕` / `개발 중` / `Personal, Mobile` | `게임 · 스포츠 아케이드` / `Mobile` | `Flutter, Flame, Dart, Blender` | `https://github.com/toris-dev` | `/images/projects/volley-king-30/gameplay.png` | `30초 랠리`, `리시브·토스·스파이크`, `콤보와 타이밍 판정` |
| `toris-docs` | `toris-docs` / `운영 중` / `Personal, Fullstack` | `지식 시스템 · 문서` / `Markdown · Obsidian` | `Markdown, Obsidian, Agent Workflow` | `https://github.com/toris-dev` | `/images/projects/toris-docs/cover.svg` | `프로젝트별 지식 연결`, `기록에서 산출물까지`, `에이전트 친화적 구조` |
| `product-growth-skills` | `Product Growth Skills` / `운영 중` / `Personal, Fullstack` | `Agent Skills · 오픈소스` / `Codex · Claude` | `Agent Skills, Markdown, Python` | `https://github.com/toris-dev/product-growth-skills` | `/images/projects/product-growth-skills/cover.svg` | `6개 전문 워크플로`, `증거 기반 실행`, `내장 검증 스크립트` |

Use these taglines verbatim:

```ts
const taglines = {
  '21n-apps': '서명에서 체결까지, 모델과 병원을 잇는 전자계약 운영 흐름',
  snapmate: '찍는 순간, 우리만의 갤러리에 쌓이는 사진',
  'bubble-bible': '말씀을 읽고, 기록하고, 함께 나누는 작은 습관',
  'dongne-paint': '선을 닫는 순간, 골목이 내 색으로 바뀐다',
  'youth-money-guide': '흩어진 청년 정책을 조건과 공식 출처로 확인하세요',
  'starlight-greenhouse': '별씨앗을 심고, 밤하늘 아래 천천히 키우는 온실',
  'volley-king-30': '리시브부터 스파이크까지, 단 30초의 랠리',
  'toris-docs': '기록이 프로젝트의 다음 행동으로 이어지는 지식 시스템',
  'product-growth-skills': '제품 성장 목표를 검증 가능한 에이전트 워크플로로'
} as const;
```

Append these complete objects after the existing entries, using the `taglines` constant above:

```ts
{
  slug: '21n-apps', name: '21n Apps', tagline: taglines['21n-apps'],
  description: '모델과 병원이 역할별 화면에서 계약 초안, 서명, 확인과 체결 상태를 이어가는 전자계약 운영 모노레포입니다.',
  category: '전자계약 · 운영 플랫폼', platform: 'Web · Monorepo', year: '2026', status: '개발 중', tags: ['Company', 'Fullstack'],
  accent: { from: '#2563EB', to: '#34D399', glow: 'rgba(37,99,235,0.32)' },
  tech: ['Next.js', 'NestJS', 'TypeScript', 'PostgreSQL'],
  features: [
    { icon: 'users', title: '역할별 계약 흐름', description: '모델과 병원이 각자의 단계에서 같은 계약 진행 상태를 확인합니다.' },
    { icon: 'activity', title: '계약 상태 타임라인', description: '초안, 서명, 확인과 체결 완료를 순서와 상태로 추적합니다.' },
    { icon: 'layers', title: '모노레포 운영 경계', description: '프론트엔드와 API의 책임을 나누면서 하나의 제품 흐름으로 관리합니다.' }
  ], github: 'https://github.com/toris-dev', image: '/images/projects/21n-apps/cover.svg', span: 'lg'
},
{
  slug: 'snapmate', name: 'SnapMate', tagline: taglines.snapmate,
  description: '카메라로 남긴 순간을 친구와 가족의 그룹별 갤러리에 바로 모아 보는 따뜻한 모바일 사진 공유 앱입니다.',
  category: '사진 · 그룹 공유', platform: 'Mobile (iOS · Android)', year: '2026', status: '개발 중', tags: ['Personal', 'Mobile', 'Fullstack'],
  accent: { from: '#FB923C', to: '#FB7185', glow: 'rgba(251,146,60,0.32)' },
  tech: ['Expo', 'React Native', 'TypeScript', 'Firebase'],
  features: [
    { icon: 'camera', title: '카메라에서 바로 공유', description: '앱 안에서 촬영한 사진을 선택한 그룹의 흐름으로 바로 연결합니다.' },
    { icon: 'users', title: '그룹별 순간 보관', description: '커플, 가족과 친구의 사진을 그룹 단위 갤러리로 구분해 봅니다.' },
    { icon: 'heart', title: '따뜻한 스토어 경험', description: '크림과 피치 톤의 브랜드 자산으로 촬영과 공유의 감정을 일관되게 전합니다.' }
  ], github: 'https://github.com/toris-dev', image: '/images/projects/snapmate/feature.png', span: 'lg'
},
{
  slug: 'bubble-bible', name: 'Bubble Bible', tagline: taglines['bubble-bible'],
  description: '매일 성경을 읽고 묵상을 기록하며 교회와 소그룹에 나누는 흐름을 연결한 모바일 우선 커뮤니티 앱입니다.',
  category: '성경 · 커뮤니티', platform: 'Mobile · Web', year: '2026', status: '개발 중', tags: ['Personal', 'Mobile', 'Fullstack'],
  accent: { from: '#C99A36', to: '#7393B3', glow: 'rgba(201,154,54,0.30)' },
  tech: ['Expo', 'React Native', 'TypeScript', 'Supabase'],
  features: [
    { icon: 'book', title: '오늘의 말씀 읽기', description: '오늘 읽을 말씀과 읽기 흐름을 모바일 화면에서 차분하게 이어갑니다.' },
    { icon: 'activity', title: '묵상과 연속 기록', description: '읽기 완료와 개인 묵상을 기록해 매일의 습관을 확인합니다.' },
    { icon: 'users', title: '교회·소그룹 나눔', description: '개인의 읽기 경험을 교회와 소그룹의 나눔으로 연결합니다.' }
  ], github: gh('bubbleBible-FE'), image: '/images/projects/bubble-bible/feature.png', span: 'md'
},
{
  slug: 'dongne-paint', name: '동네 칠하기 대작전', tagline: taglines['dongne-paint'],
  description: '골목 타일 위에 경로를 그리고 출발 영역으로 돌아와 내부를 점령하며 AI 봇과 경쟁하는 모바일 캐주얼 게임입니다.',
  category: '게임 · 영역 점령', platform: 'Mobile', year: '2026', status: '개발 중', tags: ['Personal', 'Mobile'],
  accent: { from: '#18B87A', to: '#FF6B4A', glow: 'rgba(24,184,122,0.32)' },
  tech: ['Flutter', 'Flame', 'Dart', 'Local Save'],
  features: [
    { icon: 'map', title: '닫힌 경로로 점령', description: '드래그한 경로가 출발 영역에 닿으면 닫힌 내부 타일을 내 색으로 바꿉니다.' },
    { icon: 'gamepad', title: 'AI 봇 경쟁', description: '서버 멀티플레이가 아닌 AI 봇과 같은 보드의 영역을 두고 경쟁합니다.' },
    { icon: 'save', title: '로컬 진행 저장', description: '게임 진행 상태를 기기에 보관해 다음 플레이에 이어갑니다.' }
  ], github: 'https://github.com/toris-dev', image: '/images/projects/dongne-paint/icon.png', span: 'md'
},
{
  slug: 'youth-money-guide', name: '청년머니가이드', tagline: taglines['youth-money-guide'],
  description: '청년 정책과 생활 금융 정보를 조건으로 좁히고 공식 출처와 검토 기준을 함께 확인하는 콘텐츠 서비스입니다.',
  category: '정책 · 생활 금융', platform: 'Web', year: '2026', status: '운영 중', tags: ['Personal', 'Frontend', 'Fullstack'],
  accent: { from: '#1D4ED8', to: '#10B981', glow: 'rgba(29,78,216,0.30)' },
  tech: ['Next.js', 'TypeScript', 'Content Curation'],
  features: [
    { icon: 'filter', title: '조건별 정책 탐색', description: '나이, 지역과 관심사를 기준으로 필요한 정책 정보를 좁혀 봅니다.' },
    { icon: 'shield', title: '공식 출처와 검토일', description: '정보의 원문 출처와 검토 기준을 함께 표시해 재확인 경로를 제공합니다.' },
    { icon: 'check', title: '정책·제휴 경계 표시', description: '공식 정책 정보와 제휴 콘텐츠의 성격을 구분해 보여줍니다.' }
  ], github: 'https://github.com/toris-dev', image: '/images/projects/youth-money-guide/cover.png', span: 'md'
},
{
  slug: 'starlight-greenhouse', name: '별빛 온실', tagline: taglines['starlight-greenhouse'],
  description: '별씨앗에서 별가루를 모으고 설비를 열어 생산을 키우며 오프라인 보상으로 돌아오는 모바일 방치형 게임입니다.',
  category: '게임 · 방치형 성장', platform: 'Mobile', year: '2026', status: '개발 중', tags: ['Personal', 'Mobile'],
  accent: { from: '#7C5CFC', to: '#74D9E8', glow: 'rgba(124,92,252,0.34)' },
  tech: ['Flutter', 'Dart', 'Local Save'],
  features: [
    { icon: 'star', title: '별씨앗 수확', description: '별씨앗을 돌보며 첫 자원인 별가루를 모읍니다.' },
    { icon: 'activity', title: '설비 생산 루프', description: '모은 자원으로 설비를 열어 초당 생산 흐름을 확장합니다.' },
    { icon: 'clock', title: '최대 8시간 오프라인 보상', description: '앱을 떠난 시간 중 최대 8시간의 생산분을 돌아왔을 때 정산합니다.' }
  ], github: 'https://github.com/toris-dev', image: '/images/projects/starlight-greenhouse/icon.png', span: 'md'
},
{
  slug: 'volley-king-30', name: '30초 배구왕', tagline: taglines['volley-king-30'],
  description: '리시브, 토스와 스파이크의 타이밍을 맞춰 30초 동안 콤보를 이어가는 모바일 스포츠 아케이드 게임입니다.',
  category: '게임 · 스포츠 아케이드', platform: 'Mobile', year: '2026', status: '개발 중', tags: ['Personal', 'Mobile'],
  accent: { from: '#EF4444', to: '#FACC15', glow: 'rgba(239,68,68,0.32)' },
  tech: ['Flutter', 'Flame', 'Dart', 'Blender'],
  features: [
    { icon: 'clock', title: '30초 랠리', description: '짧은 제한 시간 안에서 타이밍과 콤보에 집중합니다.' },
    { icon: 'gamepad', title: '리시브·토스·스파이크', description: '세 단계의 입력을 순서대로 연결해 한 번의 공격을 완성합니다.' },
    { icon: 'zap', title: '콤보와 타이밍 판정', description: '연속으로 맞춘 타이밍을 콤보와 판정 피드백으로 보여줍니다.' }
  ], github: 'https://github.com/toris-dev', image: '/images/projects/volley-king-30/gameplay.png', span: 'md'
},
{
  slug: 'toris-docs', name: 'toris-docs', tagline: taglines['toris-docs'],
  description: '프로젝트 문맥, 개발 지식과 산출물을 연결해 기록이 다음 작업으로 이어지도록 구성한 개인 문서 워크플로입니다.',
  category: '지식 시스템 · 문서', platform: 'Markdown · Obsidian', year: '2026', status: '운영 중', tags: ['Personal', 'Fullstack'],
  accent: { from: '#22B8CF', to: '#7C6EE6', glow: 'rgba(34,184,207,0.30)' },
  tech: ['Markdown', 'Obsidian', 'Agent Workflow'],
  features: [
    { icon: 'layers', title: '프로젝트별 지식 연결', description: '프로젝트 단위로 기획, 설계와 개발 문맥을 연결합니다.' },
    { icon: 'arrow', title: '기록에서 산출물까지', description: '인박스에서 정리한 기록이 위키와 공개 산출물로 이어지는 흐름을 둡니다.' },
    { icon: 'cpu', title: '에이전트 친화적 구조', description: '사람과 개발 에이전트가 같은 프로젝트 문맥을 찾을 수 있는 폴더 경계를 사용합니다.' }
  ], github: 'https://github.com/toris-dev', image: '/images/projects/toris-docs/cover.svg', span: 'md'
},
{
  slug: 'product-growth-skills', name: 'Product Growth Skills', tagline: taglines['product-growth-skills'],
  description: 'SEO, 앱 스토어 등록, 모바일 인터랙션과 Android 성능 작업을 증거 기반으로 실행하고 검증하는 6개 오픈소스 에이전트 스킬 모음입니다.',
  category: 'Agent Skills · 오픈소스', platform: 'Codex · Claude', year: '2026', status: '운영 중', tags: ['Personal', 'Fullstack'],
  accent: { from: '#8B5CF6', to: '#38BDF8', glow: 'rgba(139,92,246,0.34)' },
  tech: ['Agent Skills', 'Markdown', 'Python'],
  features: [
    { icon: 'layers', title: '6개 전문 워크플로', description: 'SEO, 스토어, Expo·Flutter 인터랙션과 Android 성능 영역을 각각의 스킬로 나눕니다.' },
    { icon: 'search', title: '증거 기반 실행', description: '추측보다 측정과 현재 상태의 증거를 먼저 수집하도록 작업 순서를 안내합니다.' },
    { icon: 'check', title: '내장 검증 스크립트', description: '저장소의 검증 스크립트로 스킬 구조와 필수 파일을 확인합니다.' }
  ], github: gh('product-growth-skills'), image: '/images/projects/product-growth-skills/cover.svg', span: 'lg'
}
```

- [ ] **Step 4: Run the metadata tests**

Run: `pnpm test -- src/data/__tests__/projects.test.ts --runInBand`

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit the metadata contract**

```bash
git add src/data/projects.ts src/data/__tests__/projects.test.ts
git commit -m "feat(projects): 신규 프로젝트 메타데이터 추가"
```

---

### Task 2: Add privacy-safe, verified project assets

**Files:**
- Create/copy: all files listed under “Copy from verified local repositories” and the three SVG covers.
- Test: `src/data/__tests__/projects.test.ts`

**Interfaces:**
- Consumes: the `Project.image` paths introduced in Task 1.
- Produces: local, stable image files reachable from every new card and landing.

- [ ] **Step 1: Extend the data test with an asset existence check**

```ts
import fs from 'node:fs';
import path from 'node:path';

it.each(expected)('has a local cover asset for %s', (slug) => {
  const image = getProject(slug)?.image;
  expect(image?.startsWith('/images/projects/')).toBe(true);
  expect(fs.existsSync(path.join(process.cwd(), 'public', image!))).toBe(true);
});
```

- [ ] **Step 2: Run the test and verify all nine local covers are missing**

Run: `pnpm test -- src/data/__tests__/projects.test.ts --runInBand`

Expected: FAIL with `Expected: true, Received: false` for at least `21n-apps`.

- [ ] **Step 3: Create directories and copy exact files**

```bash
mkdir -p public/images/projects/{21n-apps,snapmate,bubble-bible,dongne-paint,youth-money-guide,starlight-greenhouse,volley-king-30,toris-docs,product-growth-skills}
cp /Users/toris/projects/SnapMate/playstore/feature-graphic-1024x500.png public/images/projects/snapmate/feature.png
cp /Users/toris/projects/SnapMate/playstore/1.png public/images/projects/snapmate/screen-camera.png
cp /Users/toris/projects/SnapMate/playstore/2.png public/images/projects/snapmate/screen-gallery.png
cp /Users/toris/projects/SnapMate/playstore/3.png public/images/projects/snapmate/screen-group.png
cp /Users/toris/projects/bubble-bible/playstore/feature-graphic-1024x500.png public/images/projects/bubble-bible/feature.png
cp /Users/toris/projects/bubble-bible/playstore/app-icon-512.png public/images/projects/bubble-bible/icon.png
cp /Users/toris/projects/bubble-bible/marketing/brand/logo-lockup.svg public/images/projects/bubble-bible/logo.svg
cp /Users/toris/projects/dongne_paint/web/icons/Icon-512.png public/images/projects/dongne-paint/icon.png
cp /Users/toris/projects/lifestyle_blog/public/og-default.png public/images/projects/youth-money-guide/cover.png
cp /Users/toris/projects/starlight_greenhouse/web/icons/Icon-512.png public/images/projects/starlight-greenhouse/icon.png
cp /Users/toris/projects/volley-king-30/docs/screens/home.png public/images/projects/volley-king-30/home.png
cp /Users/toris/projects/volley-king-30/docs/screens/gameplay.png public/images/projects/volley-king-30/gameplay.png
```

The three SVG covers must contain only abstract rectangles, paths, circles, and these visible labels:

```text
21n Apps: DRAFT → SIGNED → VERIFIED → COMPLETE
toris-docs: INBOX · PROJECTS · WIKI · OUTPUT
Product Growth Skills: SEO · STORE · EXPO · FLUTTER · PERFORMANCE · INTERACTION
```

Use `viewBox="0 0 1200 675"`, a `<title>` element, the palette from the approved design spec, and no embedded raster data or note contents.

Create the covers with these complete SVG bodies:

```svg
<!-- public/images/projects/21n-apps/cover.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-labelledby="title"><title id="title">21n Apps 전자계약 상태 흐름</title><rect width="1200" height="675" fill="#172554"/><path d="M150 338H1050" stroke="#334E7E" stroke-width="18" stroke-linecap="round"/><path d="M150 338H750" stroke="#34D399" stroke-width="18" stroke-linecap="round"/><g fill="#F8FAFC" font-family="ui-monospace,monospace" font-size="28" text-anchor="middle"><circle cx="150" cy="338" r="42" fill="#2563EB"/><circle cx="450" cy="338" r="42" fill="#2563EB"/><circle cx="750" cy="338" r="42" fill="#34D399"/><circle cx="1050" cy="338" r="42" fill="#334E7E"/><text x="150" y="430">DRAFT</text><text x="450" y="430">SIGNED</text><text x="750" y="430">VERIFIED</text><text x="1050" y="430">COMPLETE</text></g></svg>

<!-- public/images/projects/toris-docs/cover.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-labelledby="title"><title id="title">toris-docs 지식 그래프</title><rect width="1200" height="675" fill="#20242C"/><g stroke="#22B8CF" stroke-width="8" opacity=".7"><path d="M190 337L470 170L740 337L1010 170"/><path d="M470 170L1010 505L740 337"/></g><g fill="#F7F3E8" font-family="ui-monospace,monospace" font-size="27" text-anchor="middle"><circle cx="190" cy="337" r="70" fill="#7C6EE6"/><circle cx="470" cy="170" r="70" fill="#22B8CF"/><circle cx="740" cy="337" r="70" fill="#7C6EE6"/><circle cx="1010" cy="505" r="70" fill="#22B8CF"/><text x="190" y="347">INBOX</text><text x="470" y="180">PROJECTS</text><text x="740" y="347">WIKI</text><text x="1010" y="515">OUTPUT</text></g></svg>

<!-- public/images/projects/product-growth-skills/cover.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-labelledby="title"><title id="title">Product Growth Skills 워크플로 라우터</title><rect width="1200" height="675" fill="#111827"/><circle cx="600" cy="338" r="100" fill="#8B5CF6"/><g stroke="#38BDF8" stroke-width="8"><path d="M600 238L600 92M500 288L260 160M500 388L260 515M700 288L940 160M700 388L940 515M600 438L600 585"/></g><g fill="#F9FAFB" font-family="ui-monospace,monospace" font-size="25" text-anchor="middle"><text x="600" y="348">ROUTER</text><text x="600" y="70">SEO</text><text x="210" y="150">STORE</text><text x="205" y="550">EXPO</text><text x="990" y="150">FLUTTER</text><text x="990" y="550">PERFORMANCE</text><text x="600" y="630">INTERACTION</text></g></svg>
```

- [ ] **Step 4: Re-run the asset test and inspect copied dimensions**

Run: `pnpm test -- src/data/__tests__/projects.test.ts --runInBand && sips -g pixelWidth -g pixelHeight public/images/projects/{snapmate/feature.png,bubble-bible/feature.png,volley-king-30/gameplay.png}`

Expected: Jest PASS; dimensions include `1024×500`, `1024×500`, and `1080×1920` respectively.

- [ ] **Step 5: Commit the asset set**

```bash
git add public/images/projects src/data/__tests__/projects.test.ts
git commit -m "feat(projects): 신규 쇼케이스 자산 추가"
```

---

### Task 3: Build the shared cinematic shell and fallback

**Files:**
- Create: `src/components/projects/landing/cinematic.tsx`
- Create: `src/components/projects/landing/__tests__/cinematic-interactions.test.tsx`

**Interfaces:**
- Produces: `CinematicTheme`, `CinematicLanding`, `CinematicGallery`, and `SignatureFrame`.
- Consumes: `Project`, existing `Reveal`, `AccentButton`, `GhostButton`, Framer Motion reduced-motion behavior.

- [ ] **Step 1: Write the failing shared-shell test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { CinematicLanding } from '../cinematic';
import { getProject, projects } from '@/data/projects';

it('renders an accessible cinematic shell with CTA and signature', () => {
  render(
    <CinematicLanding
      project={projects[0]}
      eyebrow="TEST LAB"
      title="대표 행동"
      thesis="문제를 짧게 설명합니다."
      theme={{ background: '#0B1026', surface: '#151B35', ink: '#FFFFFF', muted: '#A5B4CF', accent: '#7C5CFC', accent2: '#74D9E8' }}
      proof={['검증된 흐름', '접근 가능한 조작']}
      signature={<button type="button">인터랙션 실행</button>}
      gallery={[{ src: '/missing-project-image.png', alt: '검증용 프로젝트 화면' }]}
    />
  );
  expect(screen.getByTestId('cinematic-project')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1, name: '대표 행동' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '인터랙션 실행' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /프로젝트 보기/i })).toHaveAttribute('href', projects[0].github);
  expect(screen.getByText(projects[0].features[0].title)).toBeInTheDocument();
  expect(screen.getByText(projects[0].tech[0])).toBeInTheDocument();
  fireEvent.error(screen.getByRole('img', { name: '검증용 프로젝트 화면' }));
  expect(screen.getByRole('img', { name: '검증용 프로젝트 화면 이미지 대체 그래픽' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and verify the module is missing**

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx --runInBand`

Expected: FAIL with `Cannot find module '../cinematic'`.

- [ ] **Step 3: Implement the exported contract**

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type CSSProperties, type ReactNode } from 'react';
import type { Project } from '@/data/projects';
import { Reveal, AccentButton, GhostButton } from './shared';

export interface CinematicTheme {
  background: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  accent2: string;
}

export interface CinematicLandingProps {
  project: Project;
  eyebrow: string;
  title: string;
  thesis: string;
  theme: CinematicTheme;
  proof: readonly string[];
  signature: ReactNode;
  gallery?: readonly { src: string; alt: string; portrait?: boolean }[];
}

export function SignatureFrame({ label, children }: { label: string; children: ReactNode }) {
  return <section aria-label={label} className="relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-white/10 p-5 sm:p-8">{children}</section>;
}

export function CinematicGallery({ images }: { images: NonNullable<CinematicLandingProps['gallery']> }) {
  return <div className="grid gap-4 md:grid-cols-3">{images.map((image) => <SafeProjectImage key={image.src} {...image} />)}</div>;
}

function SafeProjectImage({ src, alt, portrait = false }: { src: string; alt: string; portrait?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div role="img" aria-label={`${alt} 이미지 대체 그래픽`} className="grid min-h-56 place-items-center rounded-3xl bg-white/10 px-6 text-center">{alt}</div>;
  return <div className={portrait ? 'relative aspect-[706/1600] overflow-hidden rounded-3xl' : 'relative aspect-video overflow-hidden rounded-3xl'}><Image src={src} alt={alt} fill sizes="(max-width: 768px) 90vw, 33vw" className="object-cover" onError={() => setFailed(true)} /></div>;
}

export function CinematicLanding({ project, eyebrow, title, thesis, theme, proof, signature, gallery }: CinematicLandingProps) {
  const vars = { '--cinema-bg': theme.background, '--cinema-surface': theme.surface, '--cinema-ink': theme.ink, '--cinema-muted': theme.muted, '--cinema-accent': theme.accent, '--cinema-accent-2': theme.accent2 } as CSSProperties;
  return <main data-testid="cinematic-project" data-cinematic-project={project.slug} style={vars} className="min-h-screen overflow-hidden bg-[var(--cinema-bg)] text-[var(--cinema-ink)]">
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6"><Link href="/projects" className="min-h-11 py-3 text-sm">← PROJECTS</Link><span className="truncate text-sm font-semibold">{project.name}</span><span className="font-mono text-xs tracking-[0.2em]">{project.year} · {project.status}</span></header>
    <section className="mx-auto grid min-h-[78dvh] max-w-7xl items-center gap-10 px-5 py-14 lg:grid-cols-[0.8fr_1.2fr]">
      <Reveal><p className="font-mono text-xs tracking-[0.24em] text-[var(--cinema-accent-2)]">{eyebrow}</p><h1 className="mt-5 text-5xl font-black leading-[0.96] tracking-[-0.05em] sm:text-7xl">{title}</h1><p className="mt-6 max-w-xl text-lg leading-8 text-[var(--cinema-muted)]">{thesis}</p><div className="mt-8 flex flex-wrap gap-3"><AccentButton href={project.github} from={theme.accent} to={theme.accent2} glow={project.accent.glow}>프로젝트 보기</AccentButton><GhostButton href="#proof">설계 근거</GhostButton></div></Reveal>
      <Reveal delay={0.12}>{signature}</Reveal>
    </section>
    <section id="proof" className="mx-auto max-w-7xl px-5 py-24"><div className="grid gap-4 md:grid-cols-3">{proof.map((item, index) => <Reveal key={item} delay={index * 0.06}><article className="min-h-40 rounded-3xl bg-[var(--cinema-surface)] p-6"><span className="font-mono text-xs text-[var(--cinema-accent-2)]">0{index + 1}</span><h2 className="mt-4 text-xl font-bold">{item}</h2></article></Reveal>)}</div>{gallery ? <div className="mt-16"><CinematicGallery images={gallery} /></div> : null}</section>
    <section className="mx-auto max-w-7xl px-5 pb-24"><h2 className="text-3xl font-black">제품 흐름과 구현 경계</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{project.features.map((feature) => <article key={feature.title} className="rounded-3xl bg-[var(--cinema-surface)] p-6"><h3 className="text-lg font-bold">{feature.title}</h3><p className="mt-3 leading-7 text-[var(--cinema-muted)]">{feature.description}</p></article>)}</div><ul aria-label="기술 스택" className="mt-8 flex flex-wrap gap-2">{project.tech.map((item) => <li key={item} className="rounded-full border border-current/20 px-4 py-2 font-mono text-xs">{item}</li>)}</ul></section>
    <footer className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-white/10 px-5 py-12 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-[var(--cinema-muted)]">{project.description}</p><Link href="/projects" className="min-h-11 shrink-0 py-3">모든 프로젝트 보기 →</Link></footer>
  </main>;
}
```

- [ ] **Step 4: Run the shared-shell test**

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx --runInBand`

Expected: PASS, 1 test.

- [ ] **Step 5: Commit the common cinematic layer**

```bash
git add src/components/projects/landing/cinematic.tsx src/components/projects/landing/__tests__/cinematic-interactions.test.tsx
git commit -m "feat(projects): 시네마틱 랜딩 공통 셸 추가"
```

---

### Task 4: Implement 21n Apps contract progression

**Files:**
- Create: `src/components/projects/landing/21nAppsLanding.tsx`
- Modify: `src/components/projects/landing/__tests__/cinematic-interactions.test.tsx`

**Interfaces:**
- Consumes: `CinematicLanding`, `SignatureFrame`, and `Project`.
- Produces: default component with `data-testid="contract-advance"` and visible `체결 완료` state after three clicks.

- [ ] **Step 1: Add a failing interaction test**

```tsx
import userEvent from '@testing-library/user-event';
import Apps21nLanding from '../21nAppsLanding';

it('advances the 21n contract to completion', async () => {
  const user = userEvent.setup();
  render(<Apps21nLanding project={getProject('21n-apps')!} />);
  const advance = screen.getByTestId('contract-advance');
  await user.click(advance); await user.click(advance); await user.click(advance);
  expect(screen.getByText('체결 완료')).toHaveAttribute('aria-current', 'step');
});
```

- [ ] **Step 2: Run the test and verify the component is missing**

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx --runInBand`

Expected: FAIL with `Cannot find module '../21nAppsLanding'`.

- [ ] **Step 3: Implement the four-stage timeline**

Use `useState(0)`, the ordered labels `['계약 초안', '모델 서명', '병원 확인', '체결 완료']`, a horizontal/stacked progress rail, and one button whose text is `다음 단계 확인` until the final state and `계약 흐름 다시 보기` afterward. On the final label set `aria-current="step"`; reset to `0` on the next click. Render through `CinematicLanding` with theme `#172554/#1E3A5F/#F8FAFC/#CBD5E1/#2563EB/#34D399`, eyebrow `CONTRACT OPERATIONS`, proof items `역할별 계약 흐름`, `상태가 보이는 운영`, `개인정보 없는 데모`, and no gallery.

```tsx
'use client';
import { useState } from 'react';
import type { Project } from '@/data/projects';
import { CinematicLanding, SignatureFrame } from './cinematic';

const steps = ['계약 초안', '모델 서명', '병원 확인', '체결 완료'] as const;

export default function Apps21nLanding({ project }: { project: Project }) {
  const [step, setStep] = useState(0);
  const done = step === steps.length - 1;
  return <CinematicLanding project={project} eyebrow="CONTRACT OPERATIONS" title="서명은 흐르고, 상태는 남습니다" thesis="모델과 병원이 같은 계약 상태를 확인하며 초안부터 체결까지 이어가는 역할 기반 운영 플랫폼입니다." theme={{ background: '#172554', surface: '#1E3A5F', ink: '#F8FAFC', muted: '#CBD5E1', accent: '#2563EB', accent2: '#34D399' }} proof={['역할별 계약 흐름', '상태가 보이는 운영', '개인정보 없는 데모']} signature={<SignatureFrame label="전자계약 진행 데모"><ol className="grid gap-3 sm:grid-cols-4">{steps.map((label, index) => <li key={label} aria-current={index === step ? 'step' : undefined} className={index <= step ? 'rounded-2xl bg-emerald-400 p-4 text-slate-950' : 'rounded-2xl bg-white/10 p-4'}><span className="font-mono text-xs">0{index + 1}</span><p className="mt-2 font-bold">{label}</p></li>)}</ol><button data-testid="contract-advance" type="button" className="mt-8 min-h-11 rounded-full bg-blue-600 px-6 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" onClick={() => setStep(done ? 0 : step + 1)}>{done ? '계약 흐름 다시 보기' : '다음 단계 확인'}</button></SignatureFrame>} />;
}
```

- [ ] **Step 4: Run the focused test**

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx -t "21n" --runInBand`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/projects/landing/21nAppsLanding.tsx src/components/projects/landing/__tests__/cinematic-interactions.test.tsx
git commit -m "feat(projects): 21n 전자계약 랜딩 추가"
```

---

### Task 5: Implement SnapMate shutter-to-gallery flow

**Files:**
- Create: `src/components/projects/landing/SnapMateLanding.tsx`
- Modify: `src/components/projects/landing/__tests__/cinematic-interactions.test.tsx`

**Interfaces:**
- Produces: default component with `data-testid="snap-shutter"` and status `우리 갤러리에 저장됨`.

- [ ] **Step 1: Add the failing test**

```tsx
import SnapMateLanding from '../SnapMateLanding';

it('develops a SnapMate photo into the group gallery', async () => {
  render(<SnapMateLanding project={getProject('snapmate')!} />);
  await userEvent.click(screen.getByTestId('snap-shutter'));
  expect(screen.getByRole('status')).toHaveTextContent('우리 갤러리에 저장됨');
});
```

- [ ] **Step 2: Verify failure, then implement the signature**

Run before implementation: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx -t "SnapMate" --runInBand`

Expected: FAIL because the module does not exist.

Implement one camera viewport containing `/images/projects/snapmate/screen-camera.png`; clicking a 56px circular button toggles `captured`. In the completed state, animate only once from camera viewport to a white photo card and show the role-status text. Use theme `#FFF7ED/#FFFFFF/#4A2D24/#8A675C/#FB923C/#FB7185`, eyebrow `SHARED MOMENTS`, proof items `찍고 바로 공유`, `그룹별 순간 보관`, `따뜻한 모바일 경험`, and gallery images camera/gallery/group with Korean alt text and `portrait: true`.

```tsx
'use client';
import Image from 'next/image';
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Project } from '@/data/projects';
import { CinematicLanding, SignatureFrame } from './cinematic';

export default function SnapMateLanding({ project }: { project: Project }) {
  const [captured, setCaptured] = useState(false);
  const reduce = useReducedMotion();
  return <CinematicLanding project={project} eyebrow="SHARED MOMENTS" title="찰칵, 우리 갤러리로" thesis="카메라에서 시작한 한 장이 친구와 가족의 그룹 갤러리에 바로 이어지는 따뜻한 순간 공유 경험입니다." theme={{ background: '#FFF7ED', surface: '#FFFFFF', ink: '#4A2D24', muted: '#8A675C', accent: '#FB923C', accent2: '#FB7185' }} proof={['찍고 바로 공유', '그룹별 순간 보관', '따뜻한 모바일 경험']} gallery={[{ src: '/images/projects/snapmate/screen-camera.png', alt: 'SnapMate 카메라 화면', portrait: true }, { src: '/images/projects/snapmate/screen-gallery.png', alt: 'SnapMate 사진 갤러리 화면', portrait: true }, { src: '/images/projects/snapmate/screen-group.png', alt: 'SnapMate 그룹 공유 화면', portrait: true }]} signature={<SignatureFrame label="SnapMate 촬영 데모"><motion.div animate={reduce ? undefined : { rotate: captured ? -2 : 0, y: captured ? 12 : 0 }} className="mx-auto max-w-xs rounded-[2rem] bg-white p-3 shadow-2xl"><div className="relative aspect-[706/1100] overflow-hidden rounded-[1.5rem]"><Image src="/images/projects/snapmate/screen-camera.png" alt="촬영 전 SnapMate 카메라" fill className="object-cover" /></div></motion.div><div className="mt-5 flex flex-col items-center gap-3"><button data-testid="snap-shutter" type="button" aria-label="사진 촬영" className="size-14 rounded-full border-4 border-white bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" onClick={() => setCaptured(true)} /><p role="status" className="font-semibold">{captured ? '우리 갤러리에 저장됨' : '셔터를 눌러 순간을 남겨보세요'}</p></div></SignatureFrame>} />;
}
```

- [ ] **Step 3: Run the focused test and commit**

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx -t "SnapMate" --runInBand`

Expected: PASS.

```bash
git add src/components/projects/landing/SnapMateLanding.tsx src/components/projects/landing/__tests__/cinematic-interactions.test.tsx
git commit -m "feat(projects): SnapMate 시네마틱 랜딩 추가"
```

---

### Task 6: Implement Bubble Bible reading completion

**Files:**
- Create: `src/components/projects/landing/BubbleBibleLanding.tsx`
- Modify: `src/components/projects/landing/__tests__/cinematic-interactions.test.tsx`

**Interfaces:**
- Produces: `data-testid="bible-complete"`, status `오늘의 읽기 완료 · 7일 연속`, and an enabled `소그룹에 나누기` button after completion.

- [ ] **Step 1: Add and run the failing test**

```tsx
import BubbleBibleLanding from '../BubbleBibleLanding';

it('completes a reading and unlocks sharing', async () => {
  render(<BubbleBibleLanding project={getProject('bubble-bible')!} />);
  await userEvent.click(screen.getByTestId('bible-complete'));
  expect(screen.getByRole('status')).toHaveTextContent('오늘의 읽기 완료 · 7일 연속');
  expect(screen.getByRole('button', { name: '소그룹에 나누기' })).toBeEnabled();
});
```

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx -t "reading" --runInBand`

Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement the reading card**

Use a parchment card with a short original interface sentence, not a Bible translation quote: `오늘의 말씀을 천천히 읽어 보세요.` The completion button changes state once; sharing starts disabled and becomes enabled. Use theme `#FFF8E7/#F4E8CC/#4A3326/#806B58/#C99A36/#7393B3`, eyebrow `READ · REFLECT · SHARE`, proof items `매일 이어지는 읽기`, `개인 묵상 기록`, `교회·소그룹 연결`, and gallery containing feature and icon.

```tsx
'use client';
import { useState } from 'react';
import type { Project } from '@/data/projects';
import { CinematicLanding, SignatureFrame } from './cinematic';

export default function BubbleBibleLanding({ project }: { project: Project }) {
  const [complete, setComplete] = useState(false);
  return <CinematicLanding project={project} eyebrow="READ · REFLECT · SHARE" title="오늘의 말씀에서, 함께하는 습관으로" thesis="읽기와 묵상 기록을 교회와 소그룹의 나눔으로 잇는 모바일 중심 성경 경험입니다." theme={{ background: '#FFF8E7', surface: '#F4E8CC', ink: '#4A3326', muted: '#806B58', accent: '#C99A36', accent2: '#7393B3' }} proof={['매일 이어지는 읽기', '개인 묵상 기록', '교회·소그룹 연결']} gallery={[{ src: '/images/projects/bubble-bible/feature.png', alt: 'Bubble Bible 브랜드 소개 화면' }, { src: '/images/projects/bubble-bible/icon.png', alt: 'Bubble Bible 앱 아이콘' }]} signature={<SignatureFrame label="오늘의 읽기 데모"><article className="mx-auto max-w-lg rounded-[2rem] bg-[#FFFDF7] p-8 text-[#4A3326] shadow-2xl"><p className="text-xs tracking-[.2em]">TODAY</p><h2 className="mt-6 font-serif text-3xl">오늘의 말씀을 천천히 읽어 보세요.</h2><button data-testid="bible-complete" type="button" className="mt-8 min-h-11 rounded-full bg-[#C99A36] px-6 font-bold text-white" onClick={() => setComplete(true)}>읽기 완료</button><p role="status" className="mt-4 font-semibold">{complete ? '오늘의 읽기 완료 · 7일 연속' : '읽기 전'}</p><button type="button" disabled={!complete} className="mt-3 min-h-11 rounded-full border border-[#7393B3] px-6 disabled:opacity-40">소그룹에 나누기</button></article></SignatureFrame>} />;
}
```

- [ ] **Step 3: Run and commit**

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx -t "reading" --runInBand`

Expected: PASS.

```bash
git add src/components/projects/landing/BubbleBibleLanding.tsx src/components/projects/landing/__tests__/cinematic-interactions.test.tsx
git commit -m "feat(projects): Bubble Bible 랜딩 추가"
```

---

### Task 7: Implement Dongne Paint territory capture

**Files:**
- Create: `src/components/projects/landing/DongnePaintLanding.tsx`
- Modify: `src/components/projects/landing/__tests__/cinematic-interactions.test.tsx`

**Interfaces:**
- Produces: `data-testid="territory-capture"`, a 5×5 semantic grid, and status `영역 9칸 확보`.

- [ ] **Step 1: Add and run the failing test**

```tsx
import DongnePaintLanding from '../DongnePaintLanding';

it('closes a trail and captures territory', async () => {
  render(<DongnePaintLanding project={getProject('dongne-paint')!} />);
  await userEvent.click(screen.getByTestId('territory-capture'));
  expect(screen.getByRole('status')).toHaveTextContent('영역 9칸 확보');
  expect(screen.getAllByLabelText('확보한 타일')).toHaveLength(9);
});
```

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx -t "territory" --runInBand`

Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement the capture board**

Render 25 square cells with `aria-label` values `빈 타일`, `경로 타일`, or `확보한 타일`. Initial path indices are `[6, 7, 8, 13, 18, 17, 16, 11]`; on click, filled indices become `[6,7,8,11,12,13,16,17,18]`. Use a button at least 44px tall labeled `경로 닫기`; after completion label it `다시 칠하기`. Use theme `#263238/#FFF3D6/#172033/#66747A/#18B87A/#FF6B4A`, eyebrow `CLOSE THE LOOP`, proof `닫힌 경로로 점령`, `AI 봇과 경쟁`, `기기 안에 저장`, and gallery with the icon.

```tsx
'use client';
import { useState } from 'react';
import type { Project } from '@/data/projects';
import { CinematicLanding, SignatureFrame } from './cinematic';
const trail = new Set([6, 7, 8, 13, 18, 17, 16, 11]);
const territory = new Set([6, 7, 8, 11, 12, 13, 16, 17, 18]);

export default function DongnePaintLanding({ project }: { project: Project }) {
  const [captured, setCaptured] = useState(false);
  return <CinematicLanding project={project} eyebrow="CLOSE THE LOOP" title="선을 닫으면, 골목이 내 색이 됩니다" thesis="출발 영역으로 돌아오는 경로를 만들고 AI 봇보다 더 넓은 동네를 확보하는 짧고 경쟁적인 영역 점령 게임입니다." theme={{ background: '#263238', surface: '#FFF3D6', ink: '#FFF3D6', muted: '#C6D0D3', accent: '#18B87A', accent2: '#FF6B4A' }} proof={['닫힌 경로로 점령', 'AI 봇과 경쟁', '기기 안에 저장']} gallery={[{ src: '/images/projects/dongne-paint/icon.png', alt: '동네 칠하기 대작전 앱 아이콘' }]} signature={<SignatureFrame label="동네 영역 점령 데모"><div className="mx-auto grid max-w-sm grid-cols-5 gap-2">{Array.from({ length: 25 }, (_, index) => { const active = captured ? territory.has(index) : trail.has(index); const label = captured && territory.has(index) ? '확보한 타일' : trail.has(index) ? '경로 타일' : '빈 타일'; return <span key={index} aria-label={label} className={active ? 'aspect-square rounded-lg bg-emerald-400' : 'aspect-square rounded-lg bg-white/10'} />; })}</div><button data-testid="territory-capture" type="button" className="mt-6 min-h-11 rounded-full bg-[#FF6B4A] px-6 font-bold" onClick={() => setCaptured(!captured)}>{captured ? '다시 칠하기' : '경로 닫기'}</button><p role="status" className="mt-3">{captured ? '영역 9칸 확보' : '경로를 출발 영역에 연결하세요'}</p></SignatureFrame>} />;
}
```

- [ ] **Step 3: Run and commit**

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx -t "territory" --runInBand`

Expected: PASS.

```bash
git add src/components/projects/landing/DongnePaintLanding.tsx src/components/projects/landing/__tests__/cinematic-interactions.test.tsx
git commit -m "feat(projects): 동네 칠하기 인터랙티브 랜딩 추가"
```

---

### Task 8: Implement Youth Money policy scanner

**Files:**
- Create: `src/components/projects/landing/YouthMoneyGuideLanding.tsx`
- Modify: `src/components/projects/landing/__tests__/cinematic-interactions.test.tsx`

**Interfaces:**
- Produces: three labeled selectors, `data-testid="policy-scan"`, and a source-verified result card.

- [ ] **Step 1: Add and run the failing test**

```tsx
import YouthMoneyGuideLanding from '../YouthMoneyGuideLanding';

it('scans selected conditions and shows source metadata', async () => {
  render(<YouthMoneyGuideLanding project={getProject('youth-money-guide')!} />);
  await userEvent.selectOptions(screen.getByLabelText('지역'), '서울');
  await userEvent.click(screen.getByTestId('policy-scan'));
  expect(screen.getByRole('status')).toHaveTextContent('조건에 맞는 정책 카드');
  expect(screen.getByText('공식 출처 확인')).toBeInTheDocument();
  expect(screen.getByText('검토일 표시')).toBeInTheDocument();
});
```

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx -t "policy" --runInBand`

Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement deterministic, non-advisory scanning**

Use selectors `나이대: 19–24/25–29/30–34`, `지역: 전국/서울/경기`, `관심사: 주거/일자리/생활비`. The result must say `조건에 맞는 정책 카드`, `공식 출처 확인`, `검토일 표시`, and `실제 신청 전 원문을 확인하세요`; do not name a real benefit unless it exists in the repository content. Use theme `#FFFCF2/#FFFFFF/#172033/#64748B/#1D4ED8/#10B981`, eyebrow `SOURCE-FIRST POLICY`, proof `조건으로 좁히기`, `공식 출처 확인`, `정책·제휴 구분`, and gallery with cover.

```tsx
'use client';
import { useState } from 'react';
import type { Project } from '@/data/projects';
import { CinematicLanding, SignatureFrame } from './cinematic';

export default function YouthMoneyGuideLanding({ project }: { project: Project }) {
  const [scanned, setScanned] = useState(false);
  return <CinematicLanding project={project} eyebrow="SOURCE-FIRST POLICY" title="조건은 간단하게, 근거는 분명하게" thesis="청년 정책과 생활비 정보를 나이·지역·관심사로 좁히고 공식 출처와 검토 기준을 함께 보여주는 정보 서비스입니다." theme={{ background: '#FFFCF2', surface: '#FFFFFF', ink: '#172033', muted: '#64748B', accent: '#1D4ED8', accent2: '#10B981' }} proof={['조건으로 좁히기', '공식 출처 확인', '정책·제휴 구분']} gallery={[{ src: '/images/projects/youth-money-guide/cover.png', alt: '청년머니가이드 대표 이미지' }]} signature={<SignatureFrame label="청년 정책 조건 스캐너"><div className="grid gap-3 text-[#172033] sm:grid-cols-3"><label>나이대<select aria-label="나이대" className="mt-1 block min-h-11 w-full rounded-xl"><option>19–24</option><option>25–29</option><option>30–34</option></select></label><label>지역<select aria-label="지역" className="mt-1 block min-h-11 w-full rounded-xl"><option>전국</option><option>서울</option><option>경기</option></select></label><label>관심사<select aria-label="관심사" className="mt-1 block min-h-11 w-full rounded-xl"><option>주거</option><option>일자리</option><option>생활비</option></select></label></div><button data-testid="policy-scan" type="button" className="mt-6 min-h-11 rounded-full bg-blue-700 px-6 font-bold text-white" onClick={() => setScanned(true)}>정책 카드 스캔</button>{scanned ? <article role="status" className="mt-5 rounded-2xl bg-white p-5 text-[#172033]"><h2 className="font-bold">조건에 맞는 정책 카드</h2><p className="mt-2">공식 출처 확인 · 검토일 표시</p><p className="mt-2 text-sm">실제 신청 전 원문을 확인하세요</p></article> : null}</SignatureFrame>} />;
}
```

- [ ] **Step 3: Run and commit**

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx -t "policy" --runInBand`

Expected: PASS.

```bash
git add src/components/projects/landing/YouthMoneyGuideLanding.tsx src/components/projects/landing/__tests__/cinematic-interactions.test.tsx
git commit -m "feat(projects): 청년머니가이드 정책 랜딩 추가"
```

---

### Task 9: Implement Starlight Greenhouse idle loop

**Files:**
- Create: `src/components/projects/landing/StarlightGreenhouseLanding.tsx`
- Modify: `src/components/projects/landing/__tests__/cinematic-interactions.test.tsx`

**Interfaces:**
- Produces: `data-testid="seed-grow"`, star-dust count, facility unlock, and a factual offline-reward label.

- [ ] **Step 1: Add and run the failing test**

```tsx
import StarlightGreenhouseLanding from '../StarlightGreenhouseLanding';

it('grows a seed and unlocks production', async () => {
  render(<StarlightGreenhouseLanding project={getProject('starlight-greenhouse')!} />);
  const grow = screen.getByTestId('seed-grow');
  await userEvent.click(grow); await userEvent.click(grow); await userEvent.click(grow);
  expect(screen.getByRole('status')).toHaveTextContent('별가루 3 · 새싹 조명 해금');
  expect(screen.getByText('오프라인 보상 최대 8시간')).toBeInTheDocument();
});
```

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx -t "seed" --runInBand`

Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement the three-tap loop**

Each button press increments from 0 to 3; at 3 show a glowing seedling and `초당 +1` without starting a real timer. A reset button returns to 0. Use theme `#0B1026/#151B35/#FFFFFF/#A5B4CF/#7C5CFC/#74D9E8`, eyebrow `IDLE UNDER THE STARS`, proof `탭으로 시작하는 성장`, `설비로 이어지는 생산`, `최대 8시간 오프라인 보상`, and gallery with icon.

```tsx
'use client';
import { useState } from 'react';
import type { Project } from '@/data/projects';
import { CinematicLanding, SignatureFrame } from './cinematic';

export default function StarlightGreenhouseLanding({ project }: { project: Project }) {
  const [dust, setDust] = useState(0);
  const unlocked = dust >= 3;
  return <CinematicLanding project={project} eyebrow="IDLE UNDER THE STARS" title="별씨앗 하나가, 온실의 밤을 밝힙니다" thesis="별가루를 모아 설비를 열고 천천히 생산을 키우는 로컬 저장 기반의 작은 방치형 성장 게임입니다." theme={{ background: '#0B1026', surface: '#151B35', ink: '#FFFFFF', muted: '#A5B4CF', accent: '#7C5CFC', accent2: '#74D9E8' }} proof={['탭으로 시작하는 성장', '설비로 이어지는 생산', '최대 8시간 오프라인 보상']} gallery={[{ src: '/images/projects/starlight-greenhouse/icon.png', alt: '별빛 온실 앱 아이콘' }]} signature={<SignatureFrame label="별씨앗 성장 데모"><div aria-hidden className={unlocked ? 'mx-auto grid size-40 place-items-center rounded-full bg-cyan-300 text-7xl shadow-[0_0_90px_#74D9E8]' : 'mx-auto grid size-40 place-items-center rounded-full bg-violet-950 text-6xl'}>{unlocked ? '🌱' : '✦'}</div><button data-testid="seed-grow" type="button" className="mt-6 min-h-11 rounded-full bg-violet-500 px-6 font-bold" onClick={() => setDust(Math.min(3, dust + 1))}>별씨앗 돌보기</button><button type="button" className="ml-3 min-h-11 px-4" onClick={() => setDust(0)}>초기화</button><p role="status" className="mt-4">{unlocked ? '별가루 3 · 새싹 조명 해금' : `별가루 ${dust}`}</p><p className="mt-2">{unlocked ? '초당 +1 · ' : ''}오프라인 보상 최대 8시간</p></SignatureFrame>} />;
}
```

- [ ] **Step 3: Run and commit**

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx -t "seed" --runInBand`

Expected: PASS.

```bash
git add src/components/projects/landing/StarlightGreenhouseLanding.tsx src/components/projects/landing/__tests__/cinematic-interactions.test.tsx
git commit -m "feat(projects): 별빛 온실 성장 랜딩 추가"
```

---

### Task 10: Implement Volley King rally timing

**Files:**
- Create: `src/components/projects/landing/VolleyKingLanding.tsx`
- Modify: `src/components/projects/landing/__tests__/cinematic-interactions.test.tsx`

**Interfaces:**
- Produces: `data-testid="volley-hit"`, ordered phases, a combo value, and a static `00:30` timer label.

- [ ] **Step 1: Add and run the failing test**

```tsx
import VolleyKingLanding from '../VolleyKingLanding';

it('completes receive, set, and spike', async () => {
  render(<VolleyKingLanding project={getProject('volley-king-30')!} />);
  const hit = screen.getByTestId('volley-hit');
  await userEvent.click(hit); await userEvent.click(hit); await userEvent.click(hit);
  expect(screen.getByRole('status')).toHaveTextContent('NICE SPIKE · COMBO 3');
});
```

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx -t "receive" --runInBand`

Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement the phase sequence**

Use phases `리시브`, `토스`, `스파이크`; each click advances one phase and moves a CSS ball between three fixed positions. After the third click, show `NICE SPIKE · COMBO 3`; the next click resets. Keep `00:30` static so the landing does not claim to run the full game. Use theme `#2563EB/#FFF8E6/#172033/#526071/#EF4444/#FACC15`, eyebrow `THIRTY SECOND RALLY`, proof `30초에 집중`, `세 번의 타이밍`, `Flame과 Blender 파이프라인`, and gallery home/gameplay as portrait images.

```tsx
'use client';
import { useState } from 'react';
import type { Project } from '@/data/projects';
import { CinematicLanding, SignatureFrame } from './cinematic';
const phases = ['리시브', '토스', '스파이크'] as const;

export default function VolleyKingLanding({ project }: { project: Project }) {
  const [phase, setPhase] = useState(0);
  const done = phase === 3;
  return <CinematicLanding project={project} eyebrow="THIRTY SECOND RALLY" title="세 번의 타이밍, 30초의 랠리" thesis="리시브·토스·스파이크의 순간을 연결해 콤보를 쌓는 짧고 선명한 모바일 배구 아케이드입니다." theme={{ background: '#2563EB', surface: '#FFF8E6', ink: '#FFFFFF', muted: '#DCE8FF', accent: '#EF4444', accent2: '#FACC15' }} proof={['30초에 집중', '세 번의 타이밍', 'Flame과 Blender 파이프라인']} gallery={[{ src: '/images/projects/volley-king-30/home.png', alt: '30초 배구왕 홈 화면', portrait: true }, { src: '/images/projects/volley-king-30/gameplay.png', alt: '30초 배구왕 경기 화면', portrait: true }]} signature={<SignatureFrame label="30초 배구 랠리 데모"><p className="font-mono text-4xl font-black">00:30</p><div className="relative mt-8 h-52 rounded-3xl bg-[#FFF8E6] text-[#172033]"><span aria-hidden className={`absolute size-12 rounded-full bg-yellow-400 transition-all ${phase === 0 ? 'bottom-6 left-8' : phase === 1 ? 'left-1/2 top-4' : 'right-8 top-1/2'}`} /><p className="absolute bottom-5 left-1/2 -translate-x-1/2 font-black">{done ? 'SPIKE!' : phases[phase]}</p></div><button data-testid="volley-hit" type="button" className="mt-5 min-h-11 rounded-full bg-red-500 px-6 font-bold" onClick={() => setPhase(done ? 0 : phase + 1)}>{done ? '다시 랠리' : phases[phase]}</button><p role="status" className="mt-3">{done ? 'NICE SPIKE · COMBO 3' : `COMBO ${phase}`}</p></SignatureFrame>} />;
}
```

- [ ] **Step 3: Run and commit**

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx -t "receive" --runInBand`

Expected: PASS.

```bash
git add src/components/projects/landing/VolleyKingLanding.tsx src/components/projects/landing/__tests__/cinematic-interactions.test.tsx
git commit -m "feat(projects): 30초 배구왕 랠리 랜딩 추가"
```

---

### Task 11: Implement toris-docs privacy-safe knowledge graph

**Files:**
- Create: `src/components/projects/landing/TorisDocsLanding.tsx`
- Modify: `src/components/projects/landing/__tests__/cinematic-interactions.test.tsx`

**Interfaces:**
- Produces: four generic nodes, `data-testid="knowledge-node-projects"`, and no private filenames/content.

- [ ] **Step 1: Add and run the failing test**

```tsx
import TorisDocsLanding from '../TorisDocsLanding';

it('connects generic knowledge areas without exposing private notes', async () => {
  render(<TorisDocsLanding project={getProject('toris-docs')!} />);
  await userEvent.click(screen.getByTestId('knowledge-node-projects'));
  expect(screen.getByRole('status')).toHaveTextContent('PROJECTS → WIKI → OUTPUT 연결');
  expect(document.body.textContent).not.toMatch(/업무 일지|회의록|2026-\d{2}-\d{2}/);
});
```

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx -t "knowledge" --runInBand`

Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement an SVG graph with generic labels only**

Use buttons positioned around an SVG line layer with labels `INBOX`, `PROJECTS`, `WIKI`, `OUTPUT`. Selecting PROJECTS highlights the three-node path and displays the exact status. Do not import, parse, or embed any file from `/Users/toris/projects/toris-docs`. Use theme `#20242C/#2B303A/#F7F3E8/#B8B3A8/#22B8CF/#7C6EE6`, eyebrow `NOTES INTO SYSTEMS`, proof `프로젝트별 문맥`, `기록에서 산출물까지`, `공개 경계를 지키는 구조`, and no gallery.

```tsx
'use client';
import { useState } from 'react';
import type { Project } from '@/data/projects';
import { CinematicLanding, SignatureFrame } from './cinematic';
const nodes = ['INBOX', 'PROJECTS', 'WIKI', 'OUTPUT'] as const;

export default function TorisDocsLanding({ project }: { project: Project }) {
  const [selected, setSelected] = useState<(typeof nodes)[number]>('INBOX');
  const connected = selected === 'PROJECTS';
  return <CinematicLanding project={project} eyebrow="NOTES INTO SYSTEMS" title="기록은 쌓이지 않고, 다음 행동으로 연결됩니다" thesis="프로젝트 문맥과 개발 지식, 산출물을 연결해 사람과 에이전트가 같은 흐름에서 일하도록 돕는 문서 시스템입니다." theme={{ background: '#20242C', surface: '#2B303A', ink: '#F7F3E8', muted: '#B8B3A8', accent: '#22B8CF', accent2: '#7C6EE6' }} proof={['프로젝트별 문맥', '기록에서 산출물까지', '공개 경계를 지키는 구조']} signature={<SignatureFrame label="지식 그래프 데모"><svg aria-hidden viewBox="0 0 600 220" className="absolute inset-x-8 top-20"><path d="M80 110L250 50L410 110L540 50" fill="none" stroke={connected ? '#22B8CF' : '#59606C'} strokeWidth="6"/><path d="M250 50L540 180" fill="none" stroke={connected ? '#7C6EE6' : '#59606C'} strokeWidth="6"/></svg><div className="relative grid min-h-64 grid-cols-2 place-items-center gap-16 sm:grid-cols-4">{nodes.map((node) => <button key={node} data-testid={node === 'PROJECTS' ? 'knowledge-node-projects' : undefined} type="button" className={selected === node ? 'min-h-11 rounded-full bg-cyan-500 px-5 font-mono font-bold text-slate-950' : 'min-h-11 rounded-full bg-white/10 px-5 font-mono'} onClick={() => setSelected(node)}>{node}</button>)}</div><p role="status" className="mt-5 text-center">{connected ? 'PROJECTS → WIKI → OUTPUT 연결' : `${selected} 선택됨`}</p></SignatureFrame>} />;
}
```

- [ ] **Step 3: Run and commit**

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx -t "knowledge" --runInBand`

Expected: PASS.

```bash
git add src/components/projects/landing/TorisDocsLanding.tsx src/components/projects/landing/__tests__/cinematic-interactions.test.tsx
git commit -m "feat(projects): toris-docs 지식 그래프 랜딩 추가"
```

---

### Task 12: Implement Product Growth Skills workflow router

**Files:**
- Create: `src/components/projects/landing/ProductGrowthSkillsLanding.tsx`
- Modify: `src/components/projects/landing/__tests__/cinematic-interactions.test.tsx`

**Interfaces:**
- Produces: goal buttons and deterministic mapping to all six verified skill directory names.

- [ ] **Step 1: Add and run the failing test**

```tsx
import ProductGrowthSkillsLanding from '../ProductGrowthSkillsLanding';

it('routes a growth goal to a verified skill', async () => {
  render(<ProductGrowthSkillsLanding project={getProject('product-growth-skills')!} />);
  await userEvent.click(screen.getByRole('button', { name: '검색 노출 개선' }));
  expect(screen.getByRole('status')).toHaveTextContent('seo-geo-optimizer');
  expect(screen.getByText('증거 수집 → 실행 → 검증')).toBeInTheDocument();
});
```

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx -t "growth goal" --runInBand`

Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement the exact six-skill mapping**

```ts
const routes = [
  ['검색 노출 개선', 'seo-geo-optimizer'],
  ['스토어 등록 준비', 'app-store-listing-creator'],
  ['Expo 인터랙션', 'expo-interactive-design'],
  ['Flutter 인터랙션', 'flutter-interactive-design'],
  ['Expo Android 성능', 'expo-android-performance'],
  ['Flutter Android 성능', 'flutter-android-performance']
] as const;
```

Render each goal as a 44px-minimum button connected to the selected skill card. The card always includes `증거 수집 → 실행 → 검증` and links only through `project.github`. Use theme `#111827/#1F2937/#F9FAFB/#A7B0C0/#8B5CF6/#38BDF8`, eyebrow `EVIDENCE-DRIVEN AGENTS`, proof `6개 전문 워크플로`, `검증 가능한 실행`, `Codex와 Claude에 설치`, and no gallery.

```tsx
'use client';
import { useState } from 'react';
import type { Project } from '@/data/projects';
import { CinematicLanding, SignatureFrame } from './cinematic';

const routes = [
  ['검색 노출 개선', 'seo-geo-optimizer'],
  ['스토어 등록 준비', 'app-store-listing-creator'],
  ['Expo 인터랙션', 'expo-interactive-design'],
  ['Flutter 인터랙션', 'flutter-interactive-design'],
  ['Expo Android 성능', 'expo-android-performance'],
  ['Flutter Android 성능', 'flutter-android-performance']
] as const;

export default function ProductGrowthSkillsLanding({ project }: { project: Project }) {
  const [selected, setSelected] = useState(0);
  return <CinematicLanding project={project} eyebrow="EVIDENCE-DRIVEN AGENTS" title="성장 목표를, 검증 가능한 워크플로로" thesis="SEO·스토어 등록·모바일 인터랙션·Android 성능 작업을 증거 수집부터 검증까지 안내하는 6개 오픈소스 에이전트 스킬입니다." theme={{ background: '#111827', surface: '#1F2937', ink: '#F9FAFB', muted: '#A7B0C0', accent: '#8B5CF6', accent2: '#38BDF8' }} proof={['6개 전문 워크플로', '검증 가능한 실행', 'Codex와 Claude에 설치']} signature={<SignatureFrame label="제품 성장 스킬 라우터"><div className="grid gap-3 sm:grid-cols-2">{routes.map(([goal], index) => <button key={goal} data-testid={index === 0 ? 'skill-goal-search' : undefined} type="button" className={selected === index ? 'min-h-11 rounded-2xl bg-violet-500 px-4 py-3 text-left font-bold' : 'min-h-11 rounded-2xl bg-white/10 px-4 py-3 text-left'} onClick={() => setSelected(index)}>{goal}</button>)}</div><article role="status" className="mt-6 rounded-2xl border border-sky-400/40 bg-sky-400/10 p-5"><p className="font-mono text-sky-300">{routes[selected][1]}</p><p className="mt-3 font-semibold">증거 수집 → 실행 → 검증</p></article></SignatureFrame>} />;
}
```

- [ ] **Step 3: Run and commit**

Run: `pnpm test -- src/components/projects/landing/__tests__/cinematic-interactions.test.tsx -t "growth goal" --runInBand`

Expected: PASS.

```bash
git add src/components/projects/landing/ProductGrowthSkillsLanding.tsx src/components/projects/landing/__tests__/cinematic-interactions.test.tsx
git commit -m "feat(projects): Product Growth Skills 랜딩 추가"
```

---

### Task 13: Register routes, public repository, and projects-page copy

**Files:**
- Create: `src/components/projects/landing/__tests__/registry.test.ts`
- Modify: `src/components/projects/landing/index.ts`
- Modify: `src/data/githubRepositories.ts`
- Modify: `src/components/projects/ProjectsLanding.tsx`
- Modify: `src/app/projects/page.tsx`

**Interfaces:**
- Consumes: all nine default landing exports and all project records.
- Produces: exact parity between `projects` and `LANDINGS`, plus public atlas entry for `product-growth-skills`.

- [ ] **Step 1: Write the failing parity tests**

```ts
import { LANDINGS } from '@/components/projects/landing';
import { githubRepositories } from '@/data/githubRepositories';
import { projects } from '@/data/projects';

it('has one dedicated landing for every project record', () => {
  expect(Object.keys(LANDINGS).sort()).toEqual(projects.map(({ slug }) => slug).sort());
});

it('lists Product Growth Skills in the public repository atlas', () => {
  expect(githubRepositories).toContainEqual(expect.objectContaining({ repo: 'product-growth-skills', kind: 'Open source' }));
});
```

- [ ] **Step 2: Run the tests and verify missing registry keys**

Run: `pnpm test -- src/components/projects/landing/__tests__/registry.test.ts --runInBand`

Expected: FAIL with a key-array diff containing the nine slugs.

- [ ] **Step 3: Register exact dynamic imports**

```ts
'21n-apps': dynamic(() => import('./21nAppsLanding')),
snapmate: dynamic(() => import('./SnapMateLanding')),
'bubble-bible': dynamic(() => import('./BubbleBibleLanding')),
'dongne-paint': dynamic(() => import('./DongnePaintLanding')),
'youth-money-guide': dynamic(() => import('./YouthMoneyGuideLanding')),
'starlight-greenhouse': dynamic(() => import('./StarlightGreenhouseLanding')),
'volley-king-30': dynamic(() => import('./VolleyKingLanding')),
'toris-docs': dynamic(() => import('./TorisDocsLanding')),
'product-growth-skills': dynamic(() => import('./ProductGrowthSkillsLanding'))
```

Add this repository entry near the other open-source tools:

```ts
repository(
  'product-growth-skills',
  'SEO·스토어 등록·모바일 인터랙션·Android 성능을 증거 기반으로 실행하는 6개 에이전트 스킬 모음.',
  'Agent Skills · Python',
  'Open source'
)
```

Append the nine project display names to `MARQUEE_ITEMS`. Change projects-page metadata description to `모바일 제품과 게임부터 AI 자동화, Web3, 지식 시스템과 에이전트 스킬까지 — 토리스의 인터랙티브 프로젝트 쇼케이스.` No hard-coded count needs changing because the hero already derives counts from arrays.

- [ ] **Step 4: Run parity and metadata tests**

Run: `pnpm test -- src/components/projects/landing/__tests__/registry.test.ts src/data/__tests__/projects.test.ts --runInBand`

Expected: PASS.

- [ ] **Step 5: Commit route integration**

```bash
git add src/components/projects/landing/index.ts src/components/projects/landing/__tests__/registry.test.ts src/data/githubRepositories.ts src/components/projects/ProjectsLanding.tsx src/app/projects/page.tsx
git commit -m "feat(projects): 신규 랜딩을 프로젝트 허브에 연결"
```

---

### Task 14: Add end-to-end cinematic coverage

**Files:**
- Create: `cypress/e2e/projects-cinematic.cy.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: nine static routes and each signature test id.
- Produces: repeatable route/card/interaction/reduced-motion/browser-console verification.

- [ ] **Step 1: Add the Cypress spec**

```ts
const projects = [
  ['21n-apps', '21n Apps', 'contract-advance'],
  ['snapmate', 'SnapMate', 'snap-shutter'],
  ['bubble-bible', 'Bubble Bible', 'bible-complete'],
  ['dongne-paint', '동네 칠하기 대작전', 'territory-capture'],
  ['youth-money-guide', '청년머니가이드', 'policy-scan'],
  ['starlight-greenhouse', '별빛 온실', 'seed-grow'],
  ['volley-king-30', '30초 배구왕', 'volley-hit'],
  ['toris-docs', 'toris-docs', 'knowledge-node-projects'],
  ['product-growth-skills', 'Product Growth Skills', 'skill-goal-search']
] as const;

describe('cinematic project showcase', () => {
  it('shows every new project card', () => {
    cy.visit('/projects');
    projects.forEach(([, name]) => cy.contains(name).should('be.visible'));
  });

  projects.forEach(([slug, name, testId]) => {
    it(`${slug} is a dedicated interactive static landing`, () => {
      const errors: string[] = [];
      cy.on('window:before:load', (win) => cy.stub(win.console, 'error').callsFake((...args) => errors.push(args.join(' '))));
      cy.visit(`/projects/${slug}`);
      cy.get(`[data-cinematic-project="${slug}"]`).should('be.visible');
      cy.get('h1').should('be.visible');
      cy.contains(name, { matchCase: false }).should('exist');
      if (testId) cy.get(`[data-testid="${testId}"]`).should('be.visible').click();
      cy.wrap(errors).should('deep.equal', []);
    });
  });

  it('renders in reduced-motion mode without an animation dependency', () => {
    cy.visit('/projects/starlight-greenhouse', { onBeforeLoad(win) { cy.stub(win, 'matchMedia').returns({ matches: true, media: '(prefers-reduced-motion: reduce)', onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }); } });
    cy.get('[data-testid="seed-grow"]').click().should('be.visible');
  });
});
```

- [ ] **Step 2: Add the focused script**

```json
"cypress:run:cinematic-projects": "cypress run --spec 'cypress/e2e/projects-cinematic.cy.ts'"
```

- [ ] **Step 3: Run all focused unit tests**

Run: `pnpm test -- src/data/__tests__/projects.test.ts src/components/projects/landing/__tests__/registry.test.ts src/components/projects/landing/__tests__/cinematic-interactions.test.tsx --runInBand`

Expected: PASS with no open-handle warning.

- [ ] **Step 4: Run lint and production build**

Run: `pnpm exec eslint src/data/projects.ts src/data/githubRepositories.ts src/components/projects/ProjectsLanding.tsx src/components/projects/landing/cinematic.tsx src/components/projects/landing/21nAppsLanding.tsx src/components/projects/landing/SnapMateLanding.tsx src/components/projects/landing/BubbleBibleLanding.tsx src/components/projects/landing/DongnePaintLanding.tsx src/components/projects/landing/YouthMoneyGuideLanding.tsx src/components/projects/landing/StarlightGreenhouseLanding.tsx src/components/projects/landing/VolleyKingLanding.tsx src/components/projects/landing/TorisDocsLanding.tsx src/components/projects/landing/ProductGrowthSkillsLanding.tsx`

Expected: exit 0.

Run: `pnpm exec next build --webpack`

Expected: exit 0 and generated static routes for all nine slugs.

- [ ] **Step 5: Run browser QA at three viewports**

Start: `pnpm dev`

Run in another terminal: `pnpm cypress:run:cinematic-projects --config viewportWidth=375,viewportHeight=812`

Repeat with `viewportWidth=768,viewportHeight=1024` and `viewportWidth=1280,viewportHeight=900`.

Expected: all tests PASS at every viewport, no horizontal overflow, broken image, or console error.

- [ ] **Step 6: Verify formatting and static-route evidence**

Run: `git diff --check && rg -n "21n-apps|snapmate|bubble-bible|dongne-paint|youth-money-guide|starlight-greenhouse|volley-king-30|toris-docs|product-growth-skills" .next/server/app/projects -g '*.html' -g '*.meta'`

Expected: `git diff --check` produces no output; `rg` finds all nine generated route directories or route metadata entries.

- [ ] **Step 7: Commit QA coverage**

```bash
git add cypress/e2e/projects-cinematic.cy.ts package.json
git commit -m "test(projects): 시네마틱 쇼케이스 E2E 검증 추가"
```

---

### Task 15: Audit and push the verified main branch

**Files:**
- Inspect: every file listed in Tasks 1–14.
- Modify: only files with a failure directly attributable to this feature.

**Interfaces:**
- Consumes: the complete local commit series and all verification evidence.
- Produces: a clean, verified `main` branch pushed to `origin/main`.

- [ ] **Step 1: Confirm branch, worktree, and intended commit series**

Run: `git branch --show-current && git status --short && git log --oneline --decorate -16`

Expected: branch is `main`; status is clean; the design, plan, feature, and QA commits are visible with no unrelated commit made during execution.

- [ ] **Step 2: Repeat the completion gate from a clean tree**

Run: `pnpm test -- src/data/__tests__/projects.test.ts src/components/projects/landing/__tests__/registry.test.ts src/components/projects/landing/__tests__/cinematic-interactions.test.tsx --runInBand && pnpm exec next build --webpack && git diff --check`

Expected: Jest PASS, production build exit 0 with all nine routes, and no `git diff --check` output.

- [ ] **Step 3: Inspect the complete feature diff**

Run: `git diff --stat a49ff76..HEAD && git diff --name-status a49ff76..HEAD`

Expected: only the two superpowers documents, nine project records, nine landing files, shared cinematic/test files, verified project assets, project hub/atlas metadata, Cypress spec, and package script appear.

- [ ] **Step 4: Push the requested branch**

Run: `git push origin main`

Expected: `main -> main` succeeds without force.

- [ ] **Step 5: Verify remote parity**

Run: `git fetch origin main && test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" && git status --short`

Expected: exit 0 and clean status.

---

## Final Completion Audit

- [ ] Confirm `projects.length` increased by exactly nine while all original slugs remain.
- [ ] Confirm `Object.keys(LANDINGS)` equals all project slugs with no fallback detail page.
- [ ] Confirm `product-growth-skills` appears once in `githubRepositories` and links to the public repository.
- [ ] Confirm all nine local image paths return 200 through the Next dev server.
- [ ] Confirm no path or embedded copy references `21n_apps/mock`, hospital/model photos, private note titles, or dated journal contents.
- [ ] Confirm every signature button is reachable by Tab, has a visible focus ring, and has a deterministic completion/status state.
- [ ] Confirm reduced-motion keeps content and state transitions usable.
- [ ] Confirm responsive browser QA passes at 375, 768, and 1280 widths without horizontal scrolling.
- [ ] Confirm focused Jest, changed-file ESLint, `next build --webpack`, Cypress, and `git diff --check` pass with recorded command output.
- [ ] Review `git diff main~14..HEAD` for unrelated changes before pushing `main`.
