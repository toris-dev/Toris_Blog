'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent
} from 'react';
import {
  FaCloudUploadAlt,
  FaLaptopCode,
  FaServer,
  HiLightBulb
} from '@/components/icons';
import { developerPipeline, type DeveloperPipelineStageId } from '../content';
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
              <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.24em] text-foreground [font-family:var(--font-space-grotesk)]">
                <span className="size-1.5 bg-primary" aria-hidden />
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
            <p className="w-fit border-l-2 border-secondary pl-4 text-sm font-semibold text-foreground [font-family:var(--font-space-grotesk)] lg:max-w-52">
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
              className="absolute inset-y-6 left-6 w-px bg-border md:hidden"
            />
            <div
              aria-hidden
              className="absolute inset-x-[12.5%] top-6 hidden h-px bg-border md:block"
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
                    <span className="block text-xs font-bold uppercase tracking-[0.18em] [font-family:var(--font-space-grotesk)]">
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
          <motion.div
            key={activeStage.id}
            id="product-pipeline-panel"
            data-testid="product-workbench"
            data-stage={activeStage.id}
            data-reduced-motion={reduceMotion ? 'true' : 'false'}
            role="tabpanel"
            aria-labelledby={`product-pipeline-tab-${activeStage.id}`}
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reduceMotion ? { duration: 0 } : { duration: 0.32, ease: EASE }
            }
            className="home-pipeline-reduced-static relative grid overflow-hidden border border-border bg-card/75 shadow-2xl md:grid-cols-[1.45fr_0.55fr]"
            style={{
              clipPath:
                'polygon(0 0, calc(100% - 2rem) 0, 100% 2rem, 100% 100%, 0 100%)'
            }}
          >
            <div className="border-b border-border p-6 sm:p-8 md:border-b-0 md:border-r">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground">
                Active stage · {activeStage.number}
              </p>
              <h3 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {activeStage.title}
              </h3>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                {activeStage.description}
              </p>
              <ul
                aria-label="이 단계의 신호"
                className="mt-7 flex flex-wrap gap-2"
              >
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
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground">
                Output
              </p>
              <p
                role="status"
                aria-live="polite"
                className="my-8 text-xl font-bold leading-snug text-foreground sm:text-2xl"
              >
                {activeStage.outcome}
              </p>
              <p className="text-sm font-bold text-muted-foreground [font-family:var(--font-space-grotesk)]">
                {activeStage.number} / 04
              </p>
            </div>
          </motion.div>
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
