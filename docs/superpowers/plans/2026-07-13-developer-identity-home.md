# Home Developer Identity Product Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Home page's 21n-specific career scene with an interactive Product Pipeline that introduces Toris as a Product Full-Stack Developer across problem framing, experience design, system building, and shipping.

**Architecture:** Store the four-stage copy in a typed, static `developerPipeline` contract, render it through one client-side `DeveloperIdentityScene`, and integrate that scene at the existing Home landing boundary. The scene uses one semantic tablist and one active tabpanel, with a single Framer Motion packet/workbench transition plus a native CSS reduced-motion safeguard. A dedicated production Cypress spec proves trusted keyboard navigation, responsive layout, themes, and reduced motion without changing any project landing.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 3, Framer Motion 12, Jest 30, Testing Library, Cypress 13, Chrome DevTools Protocol.

## Global Constraints

- Remove `Full-Stack Work`, `21앤 (21n) — 앱부터 인프라까지`, `B2B2C 병원 시술 전자계약 플랫폼`, and the existing 21n summary from Home.
- Use the exact identity copy `제품의 처음과 끝을 연결하는 개발자` and role `Product Full-Stack Developer`.
- Preserve the scene order `Knowledge → Developer Identity → Projects → Tech Stack`.
- Do not change `/about`, `/projects/21n-apps`, or any project landing.
- Do not add fonts, images, external APIs, packages, autoplay, timers, persistence, or unverified performance claims.
- Use only semantic theme tokens for text and surfaces; support light, dark, and cyberpunk classes.
- All stages must work with pointer, touch, and keyboard; tabs are at least 44×44px and 48px high on mobile.
- `ArrowLeft`, `ArrowRight`, `ArrowUp`, and `ArrowDown` use automatic activation and stop at the first/last stage; `Home` and `End` select the first/last stage.
- `prefers-reduced-motion` must make packet/workbench transforms and durations static without weakening the interaction.
- Keep the existing cinematic project suite at 31/31 and the production webpack build green.

---

## File Structure

- Create `src/components/home/landing/__tests__/content.test.ts`: static Product Pipeline contract tests.
- Create `src/components/home/landing/scenes/DeveloperIdentityScene.tsx`: Product Runway state, tabs, keyboard navigation, packet, and workbench.
- Create `src/components/home/landing/__tests__/DeveloperIdentityScene.test.tsx`: scene copy, semantics, interaction, keyboard, and reduced-motion tests.
- Create `src/components/home/landing/__tests__/Home3DLanding.test.tsx`: Home composition regression test.
- Create `cypress/e2e/home-product-pipeline.cy.ts`: production browser, viewport, trusted keyboard, theme, and reduced-motion coverage.
- Modify `src/components/home/landing/content.ts`: remove `career`; add `DeveloperPipelineStage` and `developerPipeline`.
- Modify `src/components/home/landing/Home3DLanding.tsx`: render `DeveloperIdentityScene` in the current career slot.
- Modify `src/components/home/landing/ui.tsx`: remove only the career-exclusive icon mappings after integration.
- Modify `src/styles/globals.css`: add a narrowly scoped native reduced-motion override for the Home pipeline.
- Modify `package.json`: add the exact Home pipeline Cypress command.
- Delete `src/components/home/landing/scenes/CareerArchitectureScene.tsx`: remove the superseded 21n-specific Home scene.

---

### Task 1: Typed Product Pipeline Content Contract

**Files:**
- Create: `src/components/home/landing/__tests__/content.test.ts`
- Modify: `src/components/home/landing/content.ts`

**Interfaces:**
- Consumes: no runtime dependency; this task preserves the existing `IconKey`, `TechNode`, `techStack`, and `knowledgeThemes` exports.
- Produces: `DeveloperPipelineStage`, `DeveloperPipeline`, and `developerPipeline` for `DeveloperIdentityScene`.

- [ ] **Step 1: Write the failing static contract test**

Create `src/components/home/landing/__tests__/content.test.ts`:

```ts
import * as content from '../content';
import { developerPipeline } from '../content';

describe('developerPipeline', () => {
  it('defines the approved developer identity and four ordered stages', () => {
    expect(developerPipeline).toMatchObject({
      eyebrow: 'HOW I BUILD',
      role: 'Product Full-Stack Developer',
      title: '제품의 처음과 끝을 연결하는 개발자',
      summary:
        '문제를 제품의 언어로 정리하고, 화면과 시스템을 함께 설계해, 실제로 운영되는 결과까지 만듭니다.',
      closing:
        '한 경계에서 다음 팀으로 넘기는 대신, 결정이 제품 전체에서 어떻게 작동하는지 끝까지 확인합니다.'
    });

    expect(developerPipeline.stages.map((stage) => stage.id)).toEqual([
      'frame',
      'shape',
      'build',
      'ship'
    ]);
    expect(developerPipeline.stages.map((stage) => stage.number)).toEqual([
      '01',
      '02',
      '03',
      '04'
    ]);
    expect(new Set(developerPipeline.stages.map((stage) => stage.id)).size).toBe(4);
    expect(developerPipeline.stages.at(-1)?.outcome).toBe(
      '운영 가능한 릴리스와 반복'
    );
  });

  it('does not export the superseded 21n career object', () => {
    expect((content as Record<string, unknown>).career).toBeUndefined();
    expect(JSON.stringify(developerPipeline)).not.toContain('21앤');
    expect(JSON.stringify(developerPipeline)).not.toContain('B2B2C');
  });
});
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
pnpm test src/components/home/landing/__tests__/content.test.ts --runInBand
```

Expected: FAIL because `developerPipeline` is not exported and `career` still exists.

- [ ] **Step 3: Replace the career content with the exact typed Product Pipeline data**

In `src/components/home/landing/content.ts`, remove `ArchLayer` and `career`, keep the existing tech-stack exports, and add this block before `TechNode`:

```ts
export type DeveloperPipelineStageId = 'frame' | 'shape' | 'build' | 'ship';

export interface DeveloperPipelineStage {
  id: DeveloperPipelineStageId;
  number: '01' | '02' | '03' | '04';
  label: 'Frame' | 'Shape' | 'Build' | 'Ship';
  title: string;
  description: string;
  outcome: string;
  signals: readonly string[];
}

export interface DeveloperPipeline {
  eyebrow: 'HOW I BUILD';
  role: 'Product Full-Stack Developer';
  title: '제품의 처음과 끝을 연결하는 개발자';
  summary: string;
  closing: string;
  stages: readonly DeveloperPipelineStage[];
}

export const developerPipeline: DeveloperPipeline = {
  eyebrow: 'HOW I BUILD',
  role: 'Product Full-Stack Developer',
  title: '제품의 처음과 끝을 연결하는 개발자',
  summary:
    '문제를 제품의 언어로 정리하고, 화면과 시스템을 함께 설계해, 실제로 운영되는 결과까지 만듭니다.',
  closing:
    '한 경계에서 다음 팀으로 넘기는 대신, 결정이 제품 전체에서 어떻게 작동하는지 끝까지 확인합니다.',
  stages: [
    {
      id: 'frame',
      number: '01',
      label: 'Frame',
      title: '문제를 제품 언어로',
      description:
        '사용자 맥락과 제약을 읽고 해결할 문제, 핵심 흐름, 성공 조건을 좁힙니다.',
      outcome: '명확한 MVP와 우선순위',
      signals: ['사용자 흐름', '정보 구조', '제품 가설']
    },
    {
      id: 'shape',
      number: '02',
      label: 'Shape',
      title: '만지고 이해되는 경험으로',
      description:
        '웹과 모바일의 차이를 고려해 첫 화면부터 완료 상태까지 자연스럽게 이어지는 경험을 설계합니다.',
      outcome: '설명 없이도 작동하는 인터페이스',
      signals: ['Web', 'Mobile', 'Interaction']
    },
    {
      id: 'build',
      number: '03',
      label: 'Build',
      title: '화면과 시스템을 함께',
      description:
        'API, 데이터, 인증, 결제와 인프라를 화면의 흐름과 같은 제품 계약으로 연결합니다.',
      outcome: '변화에 견디는 제품 시스템',
      signals: ['API', 'Data', 'Integration', 'Infrastructure']
    },
    {
      id: 'ship',
      number: '04',
      label: 'Ship',
      title: '배포 이후까지 운영으로',
      description:
        '테스트와 배포 파이프라인을 만들고 실제 사용에서 발견한 신호를 다음 개선으로 되돌립니다.',
      outcome: '운영 가능한 릴리스와 반복',
      signals: ['Testing', 'CI/CD', 'Observability', 'Iteration']
    }
  ]
};
```

Keep the legacy career-only `IconKey` variants temporarily so `ui.tsx` stays type-correct until Task 3 removes its mappings.

- [ ] **Step 4: Run the focused test to verify GREEN**

Run:

```bash
pnpm test src/components/home/landing/__tests__/content.test.ts --runInBand
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Check formatting and commit the content contract**

Run:

```bash
pnpm exec prettier --check src/components/home/landing/content.ts src/components/home/landing/__tests__/content.test.ts
git diff --check
git add src/components/home/landing/content.ts src/components/home/landing/__tests__/content.test.ts
git commit -m "feat(home): 제품 파이프라인 콘텐츠 정의"
```

Expected: Prettier and diff checks PASS; one focused commit is created.

---

### Task 2: Accessible Product Runway Scene

**Files:**
- Create: `src/components/home/landing/scenes/DeveloperIdentityScene.tsx`
- Create: `src/components/home/landing/__tests__/DeveloperIdentityScene.test.tsx`
- Modify: `src/styles/globals.css`

**Interfaces:**
- Consumes: `developerPipeline: DeveloperPipeline` and `DeveloperPipelineStageId` from Task 1; existing `EASE` and `Reveal` helpers; existing exported icons `HiLightBulb`, `FaLaptopCode`, `FaServer`, and `FaCloudUploadAlt`.
- Produces: default `DeveloperIdentityScene`; stable test IDs `developer-identity`, `pipeline-tab-<id>`, `product-packet`, and `product-workbench`.

- [ ] **Step 1: Write failing component tests for copy, semantics, click, keyboard, and reduced motion**

Create `src/components/home/landing/__tests__/DeveloperIdentityScene.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import DeveloperIdentityScene from '../scenes/DeveloperIdentityScene';

const mockUseReducedMotion = jest.fn(() => false);

jest.mock('framer-motion', () => {
  const React = require('react') as typeof import('react');
  const component = (tag: 'div' | 'span') =>
    ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      layoutId: _layoutId,
      whileInView: _whileInView,
      viewport: _viewport,
      ...props
    }: Record<string, unknown>) =>
      React.createElement(tag, props, children as ReactNode);

  return {
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    motion: { div: component('div'), span: component('span') },
    useReducedMotion: () => mockUseReducedMotion()
  };
});

beforeEach(() => mockUseReducedMotion.mockReturnValue(false));

it('introduces the approved identity with one semantic four-stage pipeline', () => {
  render(<DeveloperIdentityScene />);

  expect(
    screen.getByRole('heading', {
      level: 2,
      name: '제품의 처음과 끝을 연결하는 개발자'
    })
  ).toBeInTheDocument();
  expect(screen.getByText('Product Full-Stack Developer')).toBeInTheDocument();
  expect(screen.getByRole('tablist', { name: '제품 개발 단계' })).toBeInTheDocument();

  const tabs = screen.getAllByRole('tab');
  expect(tabs).toHaveLength(4);
  expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  expect(tabs[0]).toHaveAttribute('tabindex', '0');
  expect(tabs[1]).toHaveAttribute('tabindex', '-1');

  const panel = screen.getByRole('tabpanel');
  expect(panel).toHaveAttribute('aria-labelledby', tabs[0].id);
  expect(panel).toHaveTextContent('문제를 제품 언어로');
  expect(panel).toHaveTextContent('명확한 MVP와 우선순위');
  expect(screen.queryByText(/21앤 \(21n\)/)).not.toBeInTheDocument();
  expect(screen.queryByText(/B2B2C/)).not.toBeInTheDocument();
});

it('changes the active workbench only after an explicit click', async () => {
  const user = userEvent.setup();
  render(<DeveloperIdentityScene />);

  await user.click(screen.getByTestId('pipeline-tab-shape'));

  expect(screen.getByTestId('pipeline-tab-shape')).toHaveAttribute(
    'aria-selected',
    'true'
  );
  expect(screen.getByRole('tabpanel')).toHaveTextContent(
    '만지고 이해되는 경험으로'
  );
  expect(screen.getByRole('tabpanel')).toHaveTextContent(
    '설명 없이도 작동하는 인터페이스'
  );
  expect(screen.getByText('Interaction')).toBeInTheDocument();
});

it('uses automatic roving focus for arrows, Home, and End without wrapping', () => {
  render(<DeveloperIdentityScene />);

  const frame = screen.getByTestId('pipeline-tab-frame');
  const shape = screen.getByTestId('pipeline-tab-shape');
  const build = screen.getByTestId('pipeline-tab-build');
  const ship = screen.getByTestId('pipeline-tab-ship');

  frame.focus();
  fireEvent.keyDown(frame, { key: 'ArrowRight' });
  expect(shape).toHaveFocus();
  expect(shape).toHaveAttribute('aria-selected', 'true');

  fireEvent.keyDown(shape, { key: 'ArrowDown' });
  expect(build).toHaveFocus();
  expect(build).toHaveAttribute('aria-selected', 'true');

  fireEvent.keyDown(build, { key: 'End' });
  expect(ship).toHaveFocus();
  expect(ship).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tabpanel')).toHaveTextContent(
    '운영 가능한 릴리스와 반복'
  );

  fireEvent.keyDown(ship, { key: 'ArrowRight' });
  expect(ship).toHaveFocus();
  expect(ship).toHaveAttribute('aria-selected', 'true');

  fireEvent.keyDown(ship, { key: 'Home' });
  expect(frame).toHaveFocus();
  fireEvent.keyDown(frame, { key: 'ArrowLeft' });
  expect(frame).toHaveFocus();
  fireEvent.keyDown(frame, { key: 'ArrowUp' });
  expect(frame).toHaveFocus();
});

it('marks the packet and workbench as native reduced-motion targets', async () => {
  mockUseReducedMotion.mockReturnValue(true);
  render(<DeveloperIdentityScene />);

  await userEvent.click(screen.getByTestId('pipeline-tab-ship'));

  for (const target of [
    screen.getByTestId('product-packet'),
    screen.getByTestId('product-workbench')
  ]) {
    expect(target).toHaveAttribute('data-reduced-motion', 'true');
    expect(target).toHaveClass('home-pipeline-reduced-static');
  }
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
pnpm test src/components/home/landing/__tests__/DeveloperIdentityScene.test.tsx --runInBand
```

Expected: FAIL because `DeveloperIdentityScene.tsx` does not exist.

- [ ] **Step 3: Implement the scene with one responsive tablist and one workbench**

Create `src/components/home/landing/scenes/DeveloperIdentityScene.tsx` with this implementation:

```tsx
'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRef, useState, type ComponentType, type KeyboardEvent } from 'react';
import {
  FaCloudUploadAlt,
  FaLaptopCode,
  FaServer,
  HiLightBulb
} from '@/components/icons';
import {
  developerPipeline,
  type DeveloperPipelineStageId
} from '../content';
import { EASE } from '../shared';
import { Reveal } from '../ui';

const STAGE_ICONS: Record<
  DeveloperPipelineStageId,
  ComponentType<{ className?: string }>
> = {
  frame: HiLightBulb,
  shape: FaLaptopCode,
  build: FaServer,
  ship: FaCloudUploadAlt
};

const LAST_STAGE_INDEX = developerPipeline.stages.length - 1;

function nextStageIndex(key: string, current: number) {
  if (key === 'Home') return 0;
  if (key === 'End') return LAST_STAGE_INDEX;
  if (key === 'ArrowRight' || key === 'ArrowDown') {
    return Math.min(current + 1, LAST_STAGE_INDEX);
  }
  if (key === 'ArrowLeft' || key === 'ArrowUp') {
    return Math.max(current - 1, 0);
  }
  return null;
}

export default function DeveloperIdentityScene() {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const reduceMotion = useReducedMotion();
  const activeStage =
    developerPipeline.stages[activeIndex] ?? developerPipeline.stages[0];

  const selectFromKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    const nextIndex = nextStageIndex(event.key, currentIndex);
    if (nextIndex === null) return;

    event.preventDefault();
    setActiveIndex(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <section
      data-testid="developer-identity"
      aria-labelledby="developer-identity-title"
      className="relative px-4 py-24 sm:py-32"
      style={{ perspective: '1200px' }}
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="[font-family:var(--font-space-grotesk)] text-xs font-semibold tracking-[0.24em] text-primary">
                {developerPipeline.eyebrow}
              </p>
              <h2
                id="developer-identity-title"
                className="mt-4 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.04em] text-foreground sm:text-5xl md:text-6xl"
              >
                제품의 처음과 끝을{' '}
                <span className="text-primary">연결하는 개발자</span>
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                {developerPipeline.summary}
              </p>
            </div>
            <p className="w-fit border-l-2 border-secondary pl-4 [font-family:var(--font-space-grotesk)] text-sm font-semibold text-foreground lg:max-w-52">
              {developerPipeline.role}
            </p>
          </div>
        </Reveal>

        <Reveal className="mt-14" delay={0.08}>
          <div
            role="tablist"
            aria-label="제품 개발 단계"
            className="relative grid gap-2 md:grid-cols-4 md:gap-3"
          >
            <div
              aria-hidden
              className="absolute bottom-6 left-6 top-6 w-px bg-border md:hidden"
            />
            <div
              aria-hidden
              className="absolute left-[12.5%] right-[12.5%] top-6 hidden h-px bg-border md:block"
            />

            {developerPipeline.stages.map((stage, index) => {
              const Icon = STAGE_ICONS[stage.id];
              const selected = index === activeIndex;

              return (
                <button
                  key={stage.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  id={`product-pipeline-tab-${stage.id}`}
                  data-testid={`pipeline-tab-${stage.id}`}
                  type="button"
                  role="tab"
                  aria-controls="product-pipeline-panel"
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveIndex(index)}
                  onKeyDown={(event) => selectFromKeyboard(event, index)}
                  className={`group relative z-10 flex min-h-12 items-center gap-4 border px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:min-h-28 md:flex-col md:items-start md:justify-between md:gap-3 ${
                    selected
                      ? 'border-primary/60 bg-background text-foreground'
                      : 'border-border bg-card/60 text-muted-foreground hover:border-foreground/25 hover:text-foreground'
                  }`}
                  aria-label={`${stage.number} ${stage.label}: ${stage.title}`}
                >
                  <span
                    aria-hidden
                    className="relative flex size-9 shrink-0 items-center justify-center border border-current bg-background md:size-10"
                  >
                    <Icon className="size-4" />
                    {selected ? (
                      <motion.span
                        layoutId="product-packet"
                        data-testid="product-packet"
                        data-reduced-motion={reduceMotion ? 'true' : 'false'}
                        className="home-pipeline-reduced-static absolute -right-1.5 -top-1.5 size-3 bg-primary ring-4 ring-background"
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 420, damping: 32 }
                        }
                        aria-hidden
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block [font-family:var(--font-space-grotesk)] text-xs font-bold uppercase tracking-[0.18em]">
                      {stage.number} / {stage.label}
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-current md:text-base">
                      {stage.title}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal className="mt-5" delay={0.14}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeStage.id}
              id="product-pipeline-panel"
              data-testid="product-workbench"
              data-stage={activeStage.id}
              data-reduced-motion={reduceMotion ? 'true' : 'false'}
              role="tabpanel"
              aria-labelledby={`product-pipeline-tab-${activeStage.id}`}
              initial={
                reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={
                reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.32, ease: EASE }
              }
              className="home-pipeline-reduced-static relative grid overflow-hidden border border-border bg-card/75 shadow-2xl md:grid-cols-[1.45fr_0.55fr]"
              style={{
                clipPath:
                  'polygon(0 0, calc(100% - 2rem) 0, 100% 2rem, 100% 100%, 0 100%)'
              }}
            >
              <div className="border-b border-border p-6 sm:p-8 md:border-b-0 md:border-r">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  Active stage · {activeStage.number}
                </p>
                <h3 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {activeStage.title}
                </h3>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                  {activeStage.description}
                </p>
                <ul aria-label="이 단계의 신호" className="mt-7 flex flex-wrap gap-2">
                  {activeStage.signals.map((signal) => (
                    <li
                      key={signal}
                      className="border-l-2 border-secondary bg-foreground/5 px-3 py-2 font-mono text-xs text-foreground"
                    >
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex min-h-48 flex-col justify-between bg-foreground/[0.04] p-6 sm:p-8">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                  Output
                </p>
                <p
                  role="status"
                  aria-live="polite"
                  className="my-8 text-xl font-bold leading-snug text-foreground sm:text-2xl"
                >
                  {activeStage.outcome}
                </p>
                <p className="[font-family:var(--font-space-grotesk)] text-sm font-bold text-muted-foreground">
                  {activeStage.number} / 04
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </Reveal>

        <Reveal className="mt-6 border-l border-primary/40 pl-4" delay={0.2}>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            {developerPipeline.closing}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add the native reduced-motion CSS guarantee**

Extend the existing media query in `src/styles/globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  .cinematic-reduced-static,
  .home-pipeline-reduced-static {
    transform: none !important;
    opacity: 1 !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

Do not rename or weaken `.cinematic-reduced-static`; the existing project E2E depends on it.

- [ ] **Step 5: Run focused tests to verify GREEN**

Run:

```bash
pnpm test src/components/home/landing/__tests__/content.test.ts src/components/home/landing/__tests__/DeveloperIdentityScene.test.tsx --runInBand
```

Expected: PASS, 2 suites and 6 tests.

- [ ] **Step 6: Lint, format, and commit the scene**

Run:

```bash
ESLINT_USE_FLAT_CONFIG=1 pnpm exec eslint src/components/home/landing/scenes/DeveloperIdentityScene.tsx src/components/home/landing/__tests__/DeveloperIdentityScene.test.tsx
pnpm exec prettier --check src/components/home/landing/scenes/DeveloperIdentityScene.tsx src/components/home/landing/__tests__/DeveloperIdentityScene.test.tsx src/styles/globals.css
git diff --check
git add src/components/home/landing/scenes/DeveloperIdentityScene.tsx src/components/home/landing/__tests__/DeveloperIdentityScene.test.tsx src/styles/globals.css
git commit -m "feat(home): 인터랙티브 제품 파이프라인 추가"
```

Expected: all checks PASS and one focused scene commit is created.

---

### Task 3: Home Integration and Legacy Career Removal

**Files:**
- Create: `src/components/home/landing/__tests__/Home3DLanding.test.tsx`
- Modify: `src/components/home/landing/Home3DLanding.tsx`
- Modify: `src/components/home/landing/content.ts`
- Modify: `src/components/home/landing/ui.tsx`
- Delete: `src/components/home/landing/scenes/CareerArchitectureScene.tsx`

**Interfaces:**
- Consumes: default `DeveloperIdentityScene` from Task 2.
- Produces: Home composition with exactly one Product Pipeline scene and no legacy 21n career scene or career-only icon types.

- [ ] **Step 1: Write the failing Home composition regression test**

Create `src/components/home/landing/__tests__/Home3DLanding.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import Home3DLanding from '../Home3DLanding';
import type { Home3DLandingData } from '../types';

jest.mock('../scenes/HeroScene', () => () => <div>Hero scene</div>);
jest.mock('../scenes/KnowledgeStatsScene', () => () => (
  <div>Knowledge scene</div>
));
jest.mock('../scenes/DeveloperIdentityScene', () => () => (
  <section data-testid="developer-identity">
    제품의 처음과 끝을 연결하는 개발자
  </section>
));
jest.mock('../scenes/ProjectShowcaseScene', () => () => (
  <div>Projects scene</div>
));
jest.mock('../scenes/TechOrbitScene', () => () => <div>Tech scene</div>);
jest.mock('../scenes/FinalCtaScene', () => () => <div>CTA scene</div>);
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: ComponentProps<'div'>) => (
      <div {...props}>{children}</div>
    )
  },
  useReducedMotion: () => true
}));

const data: Home3DLandingData = {
  postCount: 0,
  categoryCount: 0,
  tagCount: 0,
  projectCount: 25,
  featuredPosts: [],
  categories: [],
  topTags: []
};

it('renders Developer Identity between Knowledge and Projects without legacy career copy', () => {
  render(<Home3DLanding data={data} />);

  const text = document.body.textContent ?? '';
  expect(screen.getByTestId('developer-identity')).toBeInTheDocument();
  expect(text.indexOf('Knowledge scene')).toBeLessThan(
    text.indexOf('제품의 처음과 끝을 연결하는 개발자')
  );
  expect(text.indexOf('제품의 처음과 끝을 연결하는 개발자')).toBeLessThan(
    text.indexOf('Projects scene')
  );
  expect(screen.queryByText('Full-Stack Work')).not.toBeInTheDocument();
  expect(screen.queryByText(/21앤 \(21n\)/)).not.toBeInTheDocument();
  expect(screen.queryByText(/B2B2C 병원 시술/)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the integration test to verify RED**

Run:

```bash
pnpm test src/components/home/landing/__tests__/Home3DLanding.test.tsx --runInBand
```

Expected: FAIL because `Home3DLanding` still renders `CareerArchitectureScene` and never renders the mocked Developer Identity scene.

- [ ] **Step 3: Replace the Home scene import and update its narrative comment**

In `src/components/home/landing/Home3DLanding.tsx`:

```tsx
import DeveloperIdentityScene from './scenes/DeveloperIdentityScene';
```

Replace `<CareerArchitectureScene />` with:

```tsx
<DeveloperIdentityScene />
```

Change the component comment's sequence from `지식베이스 → 커리어 → 프로젝트` to:

```ts
 * 지식베이스 → 개발자 정체성 → 프로젝트 → 스택 → CTA 순으로 각 씬이 스크롤에 반응해
```

- [ ] **Step 4: Delete the old scene and remove only its unused icon types/mappings**

Delete `src/components/home/landing/scenes/CareerArchitectureScene.tsx`.

In `src/components/home/landing/content.ts`, change the opening comment and `IconKey` to:

```ts
// 3D 랜딩의 정적 콘텐츠 (개발자 정체성 · 기술 스택 설명)
// 아이콘은 직렬화가 안 되므로 문자열 key로 두고 컴포넌트에서 매핑한다.

export type IconKey =
  | 'nextjs'
  | 'react'
  | 'typescript'
  | 'node'
  | 'nest'
  | 'reactnative'
  | 'postgres'
  | 'aws'
  | 'tailwind'
  | 'javascript';
```

In `src/components/home/landing/ui.tsx`, remove the unused imports `FaLock`, `FaUser`, and `TbApi`; keep `MdPhoneIphone` because `reactnative` still uses it. Replace the opening of `ICONS` with:

```ts
const ICONS: Record<IconKey, React.ComponentType<{ className?: string }>> = {
  nextjs: SiNextDotJs,
  react: SiReact,
  typescript: SiTypescript,
  node: FaNodeJs,
  nest: FaServer,
  reactnative: MdPhoneIphone,
  postgres: FaDatabase,
  aws: FaCloudUploadAlt,
  tailwind: SiTailwindcss,
  javascript: FaCode
};
```

- [ ] **Step 5: Run all Home-focused tests to verify GREEN**

Run:

```bash
pnpm test src/components/home/landing/__tests__/content.test.ts src/components/home/landing/__tests__/DeveloperIdentityScene.test.tsx src/components/home/landing/__tests__/Home3DLanding.test.tsx --runInBand
```

Expected: PASS, 3 suites and 7 tests.

- [ ] **Step 6: Prove the legacy Home copy and imports are gone**

Run:

```bash
rg -n "CareerArchitectureScene|Full-Stack Work|21앤 \(21n\)|B2B2C 병원 시술 전자계약 플랫폼" src/components/home
```

Expected: no matches. `/about` and the 21n project landing remain out of scope and may still contain verified 21n information.

- [ ] **Step 7: Lint, format, and commit the integration**

Run:

```bash
ESLINT_USE_FLAT_CONFIG=1 pnpm exec eslint src/components/home/landing/Home3DLanding.tsx src/components/home/landing/content.ts src/components/home/landing/ui.tsx src/components/home/landing/__tests__/Home3DLanding.test.tsx
pnpm exec prettier --check src/components/home/landing/Home3DLanding.tsx src/components/home/landing/content.ts src/components/home/landing/ui.tsx src/components/home/landing/__tests__/Home3DLanding.test.tsx
git diff --check
git add src/components/home/landing/Home3DLanding.tsx src/components/home/landing/content.ts src/components/home/landing/ui.tsx src/components/home/landing/__tests__/Home3DLanding.test.tsx src/components/home/landing/scenes/CareerArchitectureScene.tsx
git commit -m "refactor(home): 경력 장면을 개발자 정체성으로 교체"
```

Expected: all checks PASS and the deletion is recorded in the integration commit.

---

### Task 4: Production Browser Proof

**Files:**
- Create: `cypress/e2e/home-product-pipeline.cy.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: stable scene test IDs and ARIA contracts from Task 2; production Home route `/`.
- Produces: `pnpm run cypress:run:home-pipeline` and screenshots `home-product-pipeline-mobile`, `home-product-pipeline-tablet`, and `home-product-pipeline-desktop`.

- [ ] **Step 1: Add the dedicated Cypress script**

Add this exact entry beside the cinematic project command in `package.json`:

```json
"cypress:run:home-pipeline": "CYPRESS_baseUrl=http://localhost:8080 cypress run --spec 'cypress/e2e/home-product-pipeline.cy.ts' --config baseUrl=http://localhost:8080"
```

- [ ] **Step 2: Write the failing production browser spec**

Create `cypress/e2e/home-product-pipeline.cy.ts`:

```ts
const viewports = [
  { label: 'mobile', width: 375, height: 812 },
  { label: 'tablet', width: 768, height: 1024 },
  { label: 'desktop', width: 1280, height: 900 }
] as const;

function formatConsoleArgument(win: Cypress.AUTWindow, value: unknown) {
  if (typeof value === 'string') return value;
  if (value instanceof win.Error) return value.stack || value.message;
  try {
    const serialized = JSON.stringify(value);
    if (serialized !== undefined) return serialized;
  } catch {
    // Fall through to safe string conversion.
  }
  try {
    return String(value);
  } catch {
    return '[unserializable console argument]';
  }
}

function captureConsoleErrors(win: Cypress.AUTWindow, errors: string[]) {
  const original = win.console.error.bind(win.console);
  cy.stub(win.console, 'error').callsFake((...args: unknown[]) => {
    original(...args);
    errors.push(args.map((arg) => formatConsoleArgument(win, arg)).join(' '));
  });
}

function dispatchTrustedKey(key: 'Tab' | 'ArrowRight' | 'End') {
  const codes = {
    Tab: { code: 'Tab', virtual: 9 },
    ArrowRight: { code: 'ArrowRight', virtual: 39 },
    End: { code: 'End', virtual: 35 }
  } as const;
  const selected = codes[key];
  const params = {
    code: selected.code,
    key,
    nativeVirtualKeyCode: selected.virtual,
    windowsVirtualKeyCode: selected.virtual
  };

  cy.then(() =>
    Cypress.automation('remote:debugger:protocol', {
      command: 'Input.dispatchKeyEvent',
      params: { ...params, type: 'keyDown' }
    })
  );
  cy.then(() =>
    Cypress.automation('remote:debugger:protocol', {
      command: 'Input.dispatchKeyEvent',
      params: { ...params, type: 'keyUp' }
    })
  );
}

function tabToControl(control: HTMLElement, remaining = 100): Cypress.Chainable {
  if (remaining === 0) {
    throw new Error(`Trusted Tab could not reach ${control.outerHTML}`);
  }
  dispatchTrustedKey('Tab');
  return cy.then(() => {
    if (control.ownerDocument.activeElement === control) return;
    return tabToControl(control, remaining - 1);
  });
}

function assertVisibleFocus(control: HTMLElement) {
  const style = control.ownerDocument.defaultView!.getComputedStyle(control);
  const outline =
    style.outlineStyle !== 'none' &&
    (Number.parseFloat(style.outlineWidth) || 0) >= 2;
  const ring = style.boxShadow !== 'none';
  expect(control.matches(':focus-visible')).to.be.true;
  expect(outline || ring).to.be.true;
}

function emulateReducedMotion() {
  cy.then(() =>
    Cypress.automation('remote:debugger:protocol', {
      command: 'Emulation.setEmulatedMedia',
      params: {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
      }
    })
  );
}

function clearMediaEmulation() {
  cy.then(() =>
    Cypress.automation('remote:debugger:protocol', {
      command: 'Emulation.setEmulatedMedia',
      params: { features: [] }
    })
  );
}

function durationToMilliseconds(duration: string) {
  const value = Number.parseFloat(duration) || 0;
  return duration.trim().endsWith('ms') ? value : value * 1000;
}

function assertStaticMotion(element: Element) {
  const style = element.ownerDocument.defaultView!.getComputedStyle(element);
  const longestTransition = Math.max(
    0,
    ...style.transitionDuration.split(',').map(durationToMilliseconds)
  );
  const longestAnimation = Math.max(
    0,
    ...style.animationDuration.split(',').map(durationToMilliseconds)
  );
  expect(style.transform).to.equal('none');
  expect(style.opacity).to.equal('1');
  expect(longestTransition).to.be.at.most(1);
  expect(longestAnimation).to.be.at.most(1);
}

describe('Home Product Pipeline', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/todos', { statusCode: 200, body: { todos: [] } });
  });

  viewports.forEach(({ label, width, height }) => {
    it(`reaches Ship with trusted keyboard input at ${label}`, () => {
      const errors: string[] = [];
      cy.viewport(width, height);
      cy.visit('/', {
        onBeforeLoad(win) {
          captureConsoleErrors(win, errors);
        }
      });

      const scene = '[data-testid="developer-identity"]';
      cy.get(scene).scrollIntoView().should('be.visible');
      cy.get(scene)
        .find('h2')
        .should('contain.text', '제품의 처음과 끝을 연결하는 개발자');
      cy.get(`${scene} [role="tab"]`).should('have.length', 4);
      cy.get(scene).should('not.contain.text', '21앤 (21n)');
      cy.get(scene).should('not.contain.text', 'B2B2C');

      cy.get('[data-testid="pipeline-tab-frame"]').then(($frame) =>
        tabToControl($frame[0] as HTMLElement)
      );
      cy.get('[data-testid="pipeline-tab-frame"]').should(($frame) => {
        expect($frame[0].ownerDocument.activeElement).to.equal($frame[0]);
        assertVisibleFocus($frame[0]);
      });

      dispatchTrustedKey('End');
      cy.get('[data-testid="pipeline-tab-ship"]')
        .should('have.attr', 'aria-selected', 'true')
        .should(($ship) => {
          expect($ship[0].ownerDocument.activeElement).to.equal($ship[0]);
          assertVisibleFocus($ship[0]);
        });
      cy.get('[data-testid="product-workbench"]')
        .should('have.attr', 'data-stage', 'ship')
        .and('contain.text', '운영 가능한 릴리스와 반복');

      cy.document().should((document) => {
        expect(document.documentElement.scrollWidth).to.be.at.most(
          document.documentElement.clientWidth
        );
      });
      cy.then(() => expect(errors).to.deep.equal([]));
      cy.screenshot(`home-product-pipeline-${label}`, { capture: 'viewport' });
    });
  });

  it('uses semantic colors in light, dark, and cyberpunk themes', () => {
    cy.viewport(1280, 900);
    cy.visit('/');
    cy.get('[data-testid="developer-identity"]').scrollIntoView();

    ['light', 'dark', 'cyberpunk'].forEach((theme) => {
      cy.document().then((document) => {
        document.documentElement.classList.remove('light', 'dark', 'cyberpunk');
        document.documentElement.classList.add(theme);
      });
      cy.get('[data-testid="developer-identity"] h2').should(($title) => {
        const style = $title[0].ownerDocument.defaultView!.getComputedStyle(
          $title[0]
        );
        expect(style.color).not.to.equal('rgba(0, 0, 0, 0)');
      });
      cy.get('[data-testid="product-workbench"]').should('be.visible');
    });
  });

  it('keeps the packet and workbench static in native reduced-motion mode', () => {
    emulateReducedMotion();
    cy.viewport(375, 812);
    cy.visit('/');
    cy.window().should((win) => {
      expect(win.matchMedia('(prefers-reduced-motion: reduce)').matches).to.be
        .true;
    });
    cy.get('[data-testid="developer-identity"]').scrollIntoView();
    cy.get('[data-testid="pipeline-tab-ship"]').click();
    cy.get('[data-testid="product-packet"]').should(($packet) =>
      assertStaticMotion($packet[0])
    );
    cy.get('[data-testid="product-workbench"]').should(($workbench) =>
      assertStaticMotion($workbench[0])
    );
    clearMediaEmulation();
  });
});
```

- [ ] **Step 3: Build and start the exact production server**

Run:

```bash
pnpm exec next build --webpack
./node_modules/.bin/next start -p 8080
```

Expected: webpack build completes, reports `/` and `/projects/[slug]`, and the server listens on `http://localhost:8080`. Keep this server session running for Steps 4–5.

- [ ] **Step 4: Run the Home browser spec to verify GREEN**

Run in another terminal session:

```bash
pnpm run cypress:run:home-pipeline
```

Expected: PASS, 5 tests: three viewport keyboard cases, one three-theme case, and one native reduced-motion case.

- [ ] **Step 5: Run the existing cinematic project browser regression**

Run:

```bash
pnpm run cypress:run:cinematic-projects
```

Expected: PASS, 31/31. Stop the port 8080 server after this command finishes.

- [ ] **Step 6: Lint, format, inspect the three screenshots, and commit E2E proof**

Run:

```bash
ESLINT_USE_FLAT_CONFIG=1 pnpm exec eslint cypress/e2e/home-product-pipeline.cy.ts
pnpm exec prettier --check cypress/e2e/home-product-pipeline.cy.ts package.json
git diff --check
```

Use the image viewer on these generated files and verify the section has no clipped title, overlapping track, unreadable panel, or horizontal overflow:

- `cypress/screenshots/home-product-pipeline.cy.ts/home-product-pipeline-mobile.png`
- `cypress/screenshots/home-product-pipeline.cy.ts/home-product-pipeline-tablet.png`
- `cypress/screenshots/home-product-pipeline.cy.ts/home-product-pipeline-desktop.png`

Then commit only source and test files, not generated screenshots:

```bash
git add package.json cypress/e2e/home-product-pipeline.cy.ts
git commit -m "test(home): 제품 파이프라인 브라우저 검증 추가"
```

Expected: checks PASS, screenshots are visually approved, and the E2E commit is created.

---

### Task 5: Whole-Branch Completion Gate

**Files:**
- Verify only; modify no files unless a failing check exposes a genuine defect.

**Interfaces:**
- Consumes: Tasks 1–4 plus existing project showcase commits through `c9c1a29`.
- Produces: evidence that the full user scope is ready for independent review and eventual merge to `main`.

- [ ] **Step 1: Prove the complete Home and project unit suite**

Run:

```bash
pnpm test --runInBand --silent
```

Expected: all suites PASS; the baseline before Home work is 15 suites/137 tests, so the result must include the three new Home suites and their tests with zero failures.

- [ ] **Step 2: Prove repository formatting and lint for every changed implementation file**

Run:

```bash
ESLINT_USE_FLAT_CONFIG=1 pnpm exec eslint src/components/home/landing/content.ts src/components/home/landing/Home3DLanding.tsx src/components/home/landing/ui.tsx src/components/home/landing/scenes/DeveloperIdentityScene.tsx src/components/home/landing/__tests__/content.test.ts src/components/home/landing/__tests__/DeveloperIdentityScene.test.tsx src/components/home/landing/__tests__/Home3DLanding.test.tsx cypress/e2e/home-product-pipeline.cy.ts
pnpm exec prettier --check src/components/home/landing/content.ts src/components/home/landing/Home3DLanding.tsx src/components/home/landing/ui.tsx src/components/home/landing/scenes/DeveloperIdentityScene.tsx src/components/home/landing/__tests__/content.test.ts src/components/home/landing/__tests__/DeveloperIdentityScene.test.tsx src/components/home/landing/__tests__/Home3DLanding.test.tsx src/styles/globals.css cypress/e2e/home-product-pipeline.cy.ts package.json
git diff --check 5658a43..HEAD
```

Expected: every command PASS with no formatting or whitespace error.

- [ ] **Step 3: Rebuild and prove static project artifacts remain intact**

Run:

```bash
pnpm exec next build --webpack
```

Expected: build PASS, 228 or more pages generated, `/` succeeds, `/projects/[slug]` remains SSG, and all nine new project `.html`/`.meta` artifacts still exist below `.next/server/app/projects/`.

- [ ] **Step 4: Run both production Cypress suites from a fresh server**

Start:

```bash
./node_modules/.bin/next start -p 8080
```

Then run separately:

```bash
pnpm run cypress:run:home-pipeline
pnpm run cypress:run:cinematic-projects
```

Expected: Home 5/5 and projects 31/31 PASS. Stop port 8080 after both finish.

- [ ] **Step 5: Audit the exact requirement evidence before review**

Run:

```bash
git status --short
git log --oneline 5658a43..HEAD
rg -n "CareerArchitectureScene|Full-Stack Work|21앤 \(21n\)|B2B2C 병원 시술 전자계약 플랫폼" src/components/home
git diff --check 5658a43..HEAD
```

Expected: clean status; no legacy Home matches; full-range diff check PASS; commits cover content, scene, integration, and E2E.

- [ ] **Step 6: Request an independent whole-branch review**

Use `superpowers:requesting-code-review` over `5658a43..HEAD`. The reviewer must inspect:

- exact approved copy and removal of the old Home section;
- tab semantics, roving focus, trusted keyboard proof, and reduced motion;
- responsive and three-theme visual integrity;
- no changes to `/about` or existing project landings beyond prior approved commits;
- full project data/route/static-artifact parity;
- clean worktree and all verification evidence.

Expected: no Critical, Important, or Minor findings. If findings exist, fix them in one consolidated pass, rerun the affected and full gates, and request re-review before merge.
