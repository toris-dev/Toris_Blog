'use client';

import {
  AiOutlineMail,
  FaArrowRight,
  FaLaptopCode,
  FaPaperPlane,
  FaReact,
  FaTools,
  MdPhoneIphone
} from '@/components/icons';
import type { LandingPost } from '@/components/home/landing/types';
import ProductShowreel from '@/components/studio/ProductShowreel';
import {
  StudioCanvas,
  StudioEyebrow,
  StudioSection,
  StudioStage,
  studioActionStyles
} from '@/components/studio/StudioShell';
import {
  studioBusiness,
  studioCaseStudies,
  studioProcess,
  studioServices,
  type StudioCaseStudy,
  type StudioService
} from '@/data/studio';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform
} from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  useState,
  type ComponentType,
  type PointerEvent,
  type ReactNode
} from 'react';

const ENTER_EASE = [0.23, 1, 0.32, 1] as const;

const SERVICE_ICONS: Record<
  StudioService['id'],
  ComponentType<{ className?: string }>
> = {
  web: FaReact,
  mobile: MdPhoneIphone,
  desktop: FaLaptopCode,
  mvp: FaTools
};

function StudioReveal({
  children,
  className,
  delay = 0,
  ...htmlProps
}: HTMLMotionProps<'div'> & {
  delay?: number;
  'data-theme'?: 'dark' | 'light';
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      {...htmlProps}
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: reduceMotion ? 0 : 0.48,
        delay: reduceMotion ? 0 : delay,
        ease: ENTER_EASE
      }}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
}) {
  return (
    <StudioReveal className="max-w-3xl">
      <StudioEyebrow>{eyebrow}</StudioEyebrow>
      <h2 className="mt-5 text-balance break-keep text-4xl font-black leading-[1.04] tracking-[-0.04em] text-[var(--toris-ink)] sm:text-5xl md:text-6xl">
        {title}
      </h2>
      <p className="mt-6 max-w-2xl text-pretty break-keep text-base leading-8 text-[var(--toris-ink-muted)] sm:text-lg">
        {description}
      </p>
    </StudioReveal>
  );
}

export function StudioPageIntro({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
}) {
  return (
    <StudioCanvas className="border-b border-[var(--toris-border)] pb-16 pt-32 sm:pb-20 sm:pt-40">
      <StudioSection className="max-w-6xl">
        <StudioEyebrow>{eyebrow}</StudioEyebrow>
        <h1 className="mt-6 max-w-4xl text-balance break-keep text-5xl font-black leading-[0.98] tracking-[-0.04em] text-[var(--toris-ink)] sm:text-6xl md:text-7xl">
          {title}
        </h1>
        <p className="mt-7 max-w-2xl text-pretty break-keep text-lg leading-8 text-[var(--toris-ink-muted)]">
          {description}
        </p>
      </StudioSection>
    </StudioCanvas>
  );
}

function StudioHero({ projectCount }: { projectCount: number }) {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(58);
  const signalX = useSpring(pointerX, { stiffness: 180, damping: 28 });
  const reactorAngle = useTransform(signalX, [0, 100], [-7, 7]);
  const reactorShift = useTransform(signalX, [0, 100], [-10, 10]);
  const reactorTransform = useMotionTemplate`translateX(${reactorShift}px) rotate(${reactorAngle}deg)`;

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (reduceMotion) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - bounds.left) / bounds.width) * 100);
  };

  return (
    <StudioStage
      className="isolate min-h-svh overflow-hidden border-b border-[var(--toris-border)] pb-16 pt-28 sm:pt-32"
      aria-label="TORIS 개발 스튜디오 소개"
      onPointerMove={handlePointerMove}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-36 top-48 -z-10 size-[28rem] opacity-35 sm:-right-24 sm:top-14 sm:size-[44rem] sm:opacity-55 lg:right-[2%] lg:top-4 lg:size-[52rem] lg:opacity-65"
        data-testid="product-flow-signal"
        data-brand-signature="t-reactor"
      >
        <motion.div
          className="size-full"
          style={{ transform: reactorTransform }}
        >
          <svg className="size-full" viewBox="0 0 640 640">
            <circle
              cx="320"
              cy="320"
              r="246"
              fill="none"
              stroke="var(--toris-border)"
              strokeWidth="1"
            />
            <circle
              cx="320"
              cy="320"
              r="205"
              fill="none"
              stroke="var(--toris-system)"
              strokeDasharray="4 12"
              strokeWidth="2"
            />
            <path
              d="M164 210H476M320 210V430"
              fill="none"
              stroke="var(--toris-ink)"
              strokeLinecap="round"
              strokeWidth="38"
            />
            <path
              d="M150 210H112M490 210H528M320 444V486"
              fill="none"
              stroke="var(--toris-ink)"
              strokeLinecap="round"
              strokeWidth="10"
            />
            <circle cx="96" cy="210" r="18" fill="var(--toris-system)" />
            <circle
              cx="544"
              cy="210"
              r="18"
              fill="var(--toris-color-forge-red)"
            />
            <circle cx="320" cy="502" r="18" fill="var(--toris-signal)" />
            <circle
              cx="320"
              cy="320"
              r="74"
              fill="var(--toris-canvas)"
              stroke="var(--toris-ink)"
              strokeWidth="18"
            />
            <circle
              data-testid="toris-reactor-core"
              cx="320"
              cy="320"
              r="46"
              fill="var(--toris-signal)"
              className="drop-shadow-[0_0_20px_color-mix(in_srgb,var(--toris-signal)_45%,transparent)]"
            />
            <circle cx="320" cy="320" r="14" fill="var(--toris-canvas)" />
          </svg>
        </motion.div>
      </div>

      <StudioSection>
        <motion.div
          className="flex flex-wrap items-center justify-between gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: ENTER_EASE }}
        >
          <StudioEyebrow>TORIS · Product Engineering Lab</StudioEyebrow>
          <div className="flex items-center gap-3 text-xs font-semibold text-[var(--toris-ink-muted)]">
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute -inset-1 rounded-full border border-primary/35" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Build slot · Available
          </div>
        </motion.div>

        <div className="mt-12 grid items-end gap-12 lg:grid-cols-[minmax(0,1.12fr)_minmax(24rem,0.88fr)] lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, ease: ENTER_EASE }}
          >
            <p className="text-sm font-semibold text-[var(--toris-ink-muted)]">
              Invent · Integrate · Ship
            </p>
            <h1 className="mt-5 text-balance break-keep text-[clamp(3.25rem,7vw,6rem)] font-black leading-[0.9] tracking-[-0.04em] text-[var(--toris-ink)]">
              아이디어를
              <span className="mt-2 block text-[var(--toris-signal)]">
                작동하게,
              </span>
              <span className="mt-2 block">끝까지.</span>
            </h1>
            <p className="mt-8 max-w-xl text-pretty break-keep text-base leading-8 text-[var(--toris-ink-muted)] sm:text-lg">
              발명가의 관점으로 가능성을 찾고, 운영자의 책임으로 완성합니다.
              화면부터 시스템과 배포까지 연결해 실제로 쓰이는 제품을 만듭니다.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className={studioActionStyles({ intent: 'signal' })}
              >
                프로젝트 상담하기
                <FaArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/work"
                className={studioActionStyles({ intent: 'outline' })}
              >
                작업 사례 보기
                <FaArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 42 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.78,
              delay: reduceMotion ? 0 : 0.12,
              ease: ENTER_EASE
            }}
            className="lg:translate-y-10"
          >
            <ProductShowreel />
          </motion.div>
        </div>

        <div className="mt-20 border-t border-[var(--toris-border)] pt-5 lg:mt-28">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['DIAGNOSE', '문제와 우선순위'],
              ['DESIGN', '흐름과 인터페이스'],
              ['ENGINEER', '앱과 시스템'],
              ['DEPLOY', '배포와 운영']
            ].map(([label, detail], index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: reduceMotion ? 0 : -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.42,
                  delay: reduceMotion ? 0 : 0.25 + index * 0.07,
                  ease: ENTER_EASE
                }}
                className="group flex items-center gap-4"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--toris-border)] font-mono text-[11px] text-[var(--toris-ink-muted)] transition-colors duration-200 group-hover:border-[var(--toris-signal)] group-hover:text-[var(--toris-signal-text)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>
                  <span className="block font-mono text-[11px] font-bold tracking-widest text-[var(--toris-ink)]">
                    {label}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--toris-ink-muted)]">
                    {detail}
                  </span>
                </span>
              </motion.div>
            ))}
          </div>
          <p className="mt-6 text-right font-mono text-[11px] tracking-widest text-[var(--toris-ink-muted)]">
            {projectCount}+ products built · One accountable partner
          </p>
        </div>
      </StudioSection>
    </StudioStage>
  );
}

export function ServicesSection() {
  const reduceMotion = useReducedMotion();
  const [activeServiceId, setActiveServiceId] = useState<StudioService['id']>(
    studioServices[0].id
  );
  const activeService =
    studioServices.find((service) => service.id === activeServiceId) ??
    studioServices[0];
  const ActiveIcon = SERVICE_ICONS[activeService.id];

  return (
    <StudioStage
      id="services"
      className="overflow-hidden border-b border-[var(--toris-border)] py-24 sm:py-32"
    >
      <StudioSection>
        <SectionHeading
          eyebrow="What I build"
          title={
            <>
              화면 한 장이 아니라,{' '}
              <span className="text-primary">작동하는 제품 전체를.</span>
            </>
          }
          description="서비스를 선택해 보세요. 사용자가 만나는 인터페이스부터 데이터와 배포 환경까지, 하나의 제품 흐름으로 연결합니다."
        />

        <div className="mt-12 grid gap-8 sm:mt-16 lg:grid-cols-[minmax(0,0.82fr)_minmax(28rem,1.18fr)] lg:items-start">
          <div>
            <p className="mb-3 flex items-center gap-2 font-mono text-[11px] font-bold tracking-widest text-[var(--toris-signal-text)]">
              <span className="size-1.5 rounded-full bg-[var(--toris-signal)]" />
              탭하거나 가리켜 상세 보기
            </p>
            <div className="border-t border-[var(--toris-border)]">
              {studioServices.map((service, index) => {
                const Icon = SERVICE_ICONS[service.id];
                const isActive = service.id === activeService.id;

                return (
                  <article key={service.id}>
                    <button
                      type="button"
                      onClick={() => setActiveServiceId(service.id)}
                      onMouseEnter={() => setActiveServiceId(service.id)}
                      onFocus={() => setActiveServiceId(service.id)}
                      aria-pressed={isActive}
                      className={`group relative grid min-h-24 w-full cursor-pointer grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-[var(--toris-border)] py-5 text-left transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--toris-focus)] sm:grid-cols-[3rem_1fr_auto] ${isActive ? 'bg-[color-mix(in_srgb,var(--toris-signal)_7%,transparent)]' : 'hover:bg-[color-mix(in_srgb,var(--toris-surface)_55%,transparent)]'}`}
                    >
                      {isActive ? (
                        <span
                          aria-hidden
                          className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-[var(--toris-signal)]"
                        />
                      ) : null}
                      <span
                        className={`font-mono text-[11px] font-bold transition-colors duration-200 ${isActive ? 'text-[var(--toris-signal-text)]' : 'text-muted-foreground'}`}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span>
                        <span
                          className={`block text-2xl font-black tracking-[-0.04em] transition-colors duration-200 sm:text-3xl ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}
                        >
                          {service.title}
                        </span>
                        <span className="mt-1 block text-xs font-medium text-[var(--toris-ink-muted)]">
                          {service.label}
                        </span>
                      </span>
                      <span
                        className={`flex size-11 items-center justify-center rounded-full border transition duration-200 ${
                          isActive
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-[var(--toris-control-border)] text-[var(--toris-ink-muted)] group-hover:border-[var(--toris-system)] group-hover:text-[var(--toris-ink)]'
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                    </button>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--toris-border)] bg-[var(--toris-surface)] p-5 shadow-[var(--toris-shadow-sm)] sm:p-8 lg:sticky lg:top-24">
            <div className="flex items-center justify-between border-b border-[var(--toris-border)] pb-4 text-xs font-semibold text-[var(--toris-ink-muted)]">
              <span>Product signal / {activeService.label}</span>
              <span className="flex items-center gap-2 text-[var(--toris-signal-text)]">
                <span className="size-1.5 rounded-full bg-[var(--toris-signal)]" />{' '}
                Live
              </span>
            </div>

            <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-xl border border-[var(--toris-border)] bg-[var(--toris-canvas)] p-5 sm:p-8">
              <div
                aria-hidden
                className="absolute inset-x-6 top-1/2 h-px bg-[var(--toris-border)]"
              >
                <span className="absolute left-0 top-1/2 size-2 -translate-y-1/2 rounded-full bg-[var(--toris-system)]" />
                <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--toris-system)]" />
                <span className="absolute right-0 top-1/2 size-2 -translate-y-1/2 rounded-full bg-[var(--toris-signal)]" />
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeService.id}
                  aria-live="polite"
                  initial={{
                    opacity: 0,
                    y: reduceMotion ? 0 : 16,
                    scale: reduceMotion ? 1 : 0.985
                  }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    y: reduceMotion ? 0 : -10,
                    scale: reduceMotion ? 1 : 0.99
                  }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.24,
                    ease: ENTER_EASE
                  }}
                  className="relative z-10 flex h-full flex-col"
                >
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-xs font-semibold text-[var(--toris-system-text)]">
                        Selected capability
                      </p>
                      <h3 className="mt-3 break-keep text-3xl font-black tracking-[-0.04em] text-[var(--toris-ink)] sm:text-4xl">
                        {activeService.title}
                      </h3>
                    </div>
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--toris-signal)] text-[var(--toris-on-signal)]">
                      <ActiveIcon className="size-5" />
                    </span>
                  </div>

                  <p className="mt-5 max-w-xl text-pretty break-keep text-sm leading-7 text-[var(--toris-ink-muted)] sm:text-base">
                    {activeService.description}
                  </p>

                  <div className="mt-auto grid grid-cols-2 gap-px border border-[var(--toris-border)] bg-[var(--toris-border)]">
                    {activeService.deliverables.map((item, index) => (
                      <div
                        key={item}
                        className="bg-[var(--toris-canvas)] p-3.5 sm:p-4"
                      >
                        <span className="font-mono text-[11px] text-[var(--toris-ink-muted)]">
                          LAYER {String(index + 1).padStart(2, '0')}
                        </span>
                        <p className="mt-2 break-keep text-xs font-bold text-[var(--toris-ink)] sm:text-sm">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <p className="mt-5 font-mono text-[11px] leading-6 text-[var(--toris-ink-muted)]">
              {activeService.stack.join(' / ')}
            </p>
          </div>
        </div>
      </StudioSection>
    </StudioStage>
  );
}

function WorkVisual({ work }: { work: StudioCaseStudy }) {
  const reduceMotion = useReducedMotion();

  if (work.image) {
    return (
      <div
        className="relative aspect-[16/9] overflow-hidden border-b border-border bg-foreground/5 xl:border-b-0 xl:border-r"
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--toris-system) 8%, var(--toris-surface))'
        }}
      >
        <Image
          src={work.image}
          alt={`${work.name} 프로젝트 화면`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, color-mix(in srgb, var(--toris-color-ink) 64%, transparent), transparent 58%)'
          }}
        />
        <span className="absolute bottom-4 left-4 rounded-full border border-white/30 bg-[var(--toris-color-ink)] px-3 py-1.5 font-mono text-[11px] font-bold tracking-widest text-white">
          Product interface
        </span>
      </div>
    );
  }

  if (work.slug === 'tracedesk') {
    return (
      <div className="relative aspect-[16/9] overflow-hidden border-b border-[var(--toris-border)] bg-[var(--toris-color-ink)] p-5 text-[var(--toris-color-mist)] sm:p-7 xl:border-b-0 xl:border-r">
        <div className="flex items-center justify-between border-b border-white/15 pb-3 font-mono text-[11px] tracking-widest text-white/70">
          <span>TraceDesk / Local timeline</span>
          <span className="flex items-center gap-2 text-[var(--toris-system-text)]">
            <span className="size-1.5 rounded-full bg-[var(--toris-system)]" />{' '}
            Local only
          </span>
        </div>
        <div className="mt-5 grid grid-cols-[5rem_1fr] gap-x-4 gap-y-3 font-mono text-[11px] sm:grid-cols-[7rem_1fr] sm:text-xs">
          {[
            ['09:12', 'VS Code · Product build', '82%'],
            ['10:04', 'Browser · QA session', '56%'],
            ['11:26', 'Terminal · Release', '68%']
          ].map(([time, label, width]) => (
            <div key={time} className="contents">
              <span className="text-white/45">{time}</span>
              <div>
                <p>{label}</p>
                <div className="mt-2 h-1 overflow-hidden bg-white/10">
                  <span
                    className="block h-full bg-[var(--toris-system)] transition-transform duration-300 group-hover:translate-x-1"
                    style={{ width }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/9] overflow-hidden border-b border-[var(--toris-border)] bg-[var(--toris-color-graphite)] p-5 font-mono text-[var(--toris-color-mist)] sm:p-7 xl:border-b-0 xl:border-r">
      <div className="flex items-center gap-2 border-b border-white/15 pb-3 text-[11px] tracking-widest text-white/70">
        <span className="size-1.5 rounded-full bg-[var(--toris-signal)]" />{' '}
        devpulse — daily run
      </div>
      <div className="mt-5 space-y-3 text-[11px] sm:text-xs">
        <p>
          <span className="text-[var(--toris-signal-text)]">$</span> collect
          --source dev-news
        </p>
        <p className="text-white/55">✓ 48 stories indexed</p>
        <p>
          <span className="text-[var(--toris-signal-text)]">$</span> summarize
          --model local
        </p>
        <p className="text-white/55">✓ cards · captions · video ready</p>
        <div className="flex gap-1 pt-1" aria-hidden>
          {[72, 94, 58, 86, 64, 100, 78, 90].map((height, index) => (
            <motion.span
              key={index}
              initial={{ scaleY: reduceMotion ? 1 : 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: reduceMotion ? 0 : 0.24,
                delay: reduceMotion ? 0 : index * 0.025
              }}
              className="h-7 flex-1 origin-bottom"
              style={{
                height: `${height / 3}px`,
                backgroundColor: 'var(--toris-signal)',
                opacity: 0.6
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function WorkSection() {
  return (
    <StudioCanvas id="work" className="py-24 sm:py-32">
      <StudioSection className="grid gap-14 lg:grid-cols-[minmax(17rem,0.62fr)_minmax(0,1.38fr)] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            eyebrow="Selected Work"
            title={
              <>
                기술보다 먼저,{' '}
                <span className="text-[var(--toris-signal-text)]">
                  달라진 결과를.
                </span>
              </>
            }
            description="외주 역량을 가장 잘 보여주는 여섯 작업을 문제, 구현, 결과와 담당 범위로 정리했습니다."
          />
          <StudioReveal className="mt-10 hidden lg:block">
            <Link
              href="/projects"
              className="group inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm font-bold text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              전체 프로젝트 보기
              <span className="flex size-9 items-center justify-center rounded-full border border-foreground/20 transition duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <FaArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </StudioReveal>
        </div>

        <div className="grid gap-8">
          {studioCaseStudies.map((work, index) => (
            <StudioReveal
              key={work.slug}
              delay={Math.min(index * 0.03, 0.12)}
              data-theme={
                work.slug === 'tracedesk' || work.slug === 'devpulse'
                  ? 'dark'
                  : undefined
              }
            >
              <Link
                href={`/projects/${work.slug}`}
                className="group grid cursor-pointer overflow-hidden rounded-2xl border border-[var(--toris-border)] bg-[var(--toris-surface)] shadow-[var(--toris-shadow-sm)] transition duration-300 ease-out hover:-translate-y-1 hover:border-[var(--toris-signal)] hover:shadow-[var(--toris-shadow-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--toris-focus)] active:scale-[0.995] xl:grid-cols-[minmax(0,1.12fr)_minmax(20rem,0.88fr)]"
              >
                <WorkVisual work={work} />
                <div className="flex flex-col p-6 sm:p-8 xl:p-9">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[var(--toris-signal-text)]">
                        Case {work.number} · {work.kind}
                      </p>
                      <h3 className="mt-3 break-keep text-3xl font-black tracking-[-0.04em] text-[var(--toris-ink)] sm:text-4xl">
                        {work.name}
                      </h3>
                    </div>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-foreground/15 text-muted-foreground transition duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                      <FaArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </div>

                  <dl className="mt-7 space-y-4">
                    {[
                      ['문제', work.problem],
                      ['구현', work.build],
                      ['결과', work.result]
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="grid gap-2 border-t border-border pt-3.5 sm:grid-cols-[3.5rem_1fr]"
                      >
                        <dt className="font-mono text-[11px] font-bold text-foreground">
                          {label}
                        </dt>
                        <dd className="text-pretty break-keep text-[13px] leading-6 text-muted-foreground">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-auto border-t border-border pt-5 xl:mt-7">
                    <p className="font-mono text-[11px] font-bold text-foreground">
                      담당 범위
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {work.scope.map((scope) => (
                        <span
                          key={scope}
                          className="rounded-full bg-foreground/5 px-3 py-1 text-[11px] text-muted-foreground"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </StudioReveal>
          ))}
        </div>

        <StudioReveal className="flex justify-center lg:hidden">
          <Link
            href="/projects"
            className="group inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full border border-foreground/20 px-5 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-[var(--toris-signal-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--toris-focus)]"
          >
            전체 25개 프로젝트 아카이브 보기
            <FaArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </StudioReveal>
      </StudioSection>
    </StudioCanvas>
  );
}

export function ProcessSection() {
  const reduceMotion = useReducedMotion();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const activeStep = studioProcess[activeStepIndex] ?? studioProcess[0];

  return (
    <StudioStage
      id="process"
      className="overflow-hidden border-b border-[var(--toris-border)] py-24 sm:py-32"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(90deg, transparent 49.9%, var(--toris-border) 50%, transparent 50.1%)'
        }}
      />
      <StudioSection className="relative">
        <div className="grid gap-14 lg:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.28fr)] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="How I build"
              title={
                <>
                  처음의 질문이{' '}
                  <span className="text-primary">
                    운영되는 제품이 될 때까지.
                  </span>
                </>
              }
              description="아래 단계를 선택해 보세요. 작업 범위와 다음 산출물을 매 단계에서 공유합니다."
            />

            <div className="mt-12 min-h-64 border-l border-[var(--toris-border)] pl-6 sm:pl-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeStep.number}
                  aria-live="polite"
                  initial={{ opacity: 0, x: reduceMotion ? 0 : -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: reduceMotion ? 0 : 10 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.24,
                    ease: ENTER_EASE
                  }}
                >
                  <p className="text-xs font-semibold text-[var(--toris-system-text)]">
                    Output / {activeStep.number}
                  </p>
                  <h3 className="mt-4 break-keep text-3xl font-black tracking-[-0.04em] text-[var(--toris-ink)]">
                    {activeStep.title}
                  </h3>
                  <p className="mt-5 max-w-lg text-pretty break-keep text-sm leading-7 text-[var(--toris-ink-muted)] sm:text-base">
                    {activeStep.description}
                  </p>
                  <p className="mt-7 inline-flex rounded-full border border-[var(--toris-signal)] bg-[var(--toris-surface)] px-4 py-2 text-xs font-bold text-[var(--toris-signal-text)]">
                    {activeStep.output}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <ol className="border-t border-[var(--toris-border)]">
            {studioProcess.map((step, index) => {
              const isActive = index === activeStepIndex;

              return (
                <li key={step.number}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveStepIndex(index)}
                    onFocus={() => setActiveStepIndex(index)}
                    onClick={() => setActiveStepIndex(index)}
                    aria-pressed={isActive}
                    className={`group relative grid min-h-32 w-full cursor-pointer grid-cols-[3rem_1fr_auto] items-center gap-3 border-b border-[var(--toris-border)] py-5 text-left transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--toris-focus)] sm:grid-cols-[4rem_1fr_auto] ${isActive ? 'bg-[color-mix(in_srgb,var(--toris-signal)_7%,transparent)]' : 'hover:bg-[color-mix(in_srgb,var(--toris-surface)_55%,transparent)]'}`}
                  >
                    {isActive ? (
                      <span
                        aria-hidden
                        className="absolute inset-y-4 left-0 w-0.5 rounded-full bg-[var(--toris-signal)]"
                      />
                    ) : null}
                    <span
                      className={`font-mono text-[11px] font-bold transition-colors duration-200 ${isActive ? 'text-[var(--toris-signal-text)]' : 'text-[var(--toris-ink-muted)]'}`}
                    >
                      {step.number}
                    </span>
                    <span>
                      <span
                        className={`block break-keep text-[clamp(2.4rem,6vw,5.8rem)] font-black leading-none tracking-[-0.04em] transition-colors duration-300 ${isActive ? 'text-[var(--toris-ink)]' : 'text-[var(--toris-color-steel)] group-hover:text-[var(--toris-ink-muted)]'}`}
                      >
                        {step.label}
                      </span>
                      <span className="mt-2 block break-keep text-sm font-bold text-[var(--toris-ink-muted)]">
                        {step.title}
                      </span>
                    </span>
                    <span
                      className={`h-px transition-all duration-300 ${isActive ? 'w-14 bg-[var(--toris-signal)]' : 'w-6 bg-[var(--toris-border)] group-hover:w-10'}`}
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </StudioSection>
    </StudioStage>
  );
}

export function LatestProofSection({ posts }: { posts: LandingPost[] }) {
  return (
    <StudioCanvas className="py-24 sm:py-32" aria-label="최신 기술 기록">
      <StudioSection className="max-w-6xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Build in Public"
            title={
              <>
                기술 글은{' '}
                <span className="text-[var(--toris-signal-text)]">
                  실행의 증거입니다.
                </span>
              </>
            }
            description="공부한 내용만이 아니라 만들고, 실패하고, 운영하며 얻은 판단을 기록합니다."
          />
          <Link
            href="/blog"
            className="group inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-bold text-foreground transition-colors hover:text-[var(--toris-system-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--toris-focus)]"
          >
            기술 블로그 보기
            <FaArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {posts.slice(0, 3).map((post, index) => (
            <StudioReveal key={post.slug} delay={index * 0.05}>
              <Link
                href={`/posts/${post.slug}`}
                className="group flex h-full min-h-64 flex-col rounded-2xl border border-[var(--toris-border)] bg-[var(--toris-surface)] p-6 shadow-[var(--toris-shadow-sm)] transition duration-200 ease-out hover:-translate-y-1 hover:border-[var(--toris-signal)] hover:shadow-[var(--toris-shadow-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--toris-focus)]"
              >
                <div className="flex items-center justify-between gap-3 font-mono text-[11px] font-bold tracking-widest text-[var(--toris-ink-muted)]">
                  <span className="text-[var(--toris-signal-text)]">
                    {post.category}
                  </span>
                  <time>{post.date}</time>
                </div>
                <h3 className="mt-7 text-balance break-keep text-xl font-black leading-snug tracking-tight text-foreground group-hover:text-[var(--toris-signal-text)]">
                  {post.title}
                </h3>
                {post.description ? (
                  <p className="mt-4 line-clamp-3 text-pretty break-keep text-sm leading-7 text-muted-foreground">
                    {post.description}
                  </p>
                ) : null}
                <span className="mt-auto flex items-center gap-2 pt-8 text-xs font-bold text-foreground">
                  읽기
                  <FaArrowRight className="size-3 transition-transform duration-150 group-hover:translate-x-1" />
                </span>
              </Link>
            </StudioReveal>
          ))}
        </div>
      </StudioSection>
    </StudioCanvas>
  );
}

function StudioContactCta() {
  return (
    <StudioCanvas className="pb-28 pt-8 sm:pb-36">
      <StudioReveal
        data-toris-theme="dark"
        className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-[var(--toris-canvas)] p-7 text-[var(--toris-ink)] shadow-[var(--toris-shadow-sm)] sm:p-12 md:p-16"
      >
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-[var(--toris-system-text)]">
              Start a project
            </p>
            <h2 className="mt-5 max-w-3xl text-balance break-keep text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl md:text-6xl">
              만들고 싶은 제품을 이야기해 주세요.
            </h2>
            <p className="mt-6 max-w-2xl text-pretty break-keep text-base leading-8 text-[var(--toris-ink-muted)]">
              개발 유형, 예산과 일정이 아직 정확하지 않아도 괜찮습니다. 현재
              상황을 기준으로 첫 범위를 함께 정리합니다.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/contact"
              className={studioActionStyles({ intent: 'inverse' })}
            >
              프로젝트 상담하기
              <FaPaperPlane className="size-3.5" />
            </Link>
            <a
              href={`mailto:${studioBusiness.email}`}
              className={studioActionStyles({ intent: 'outline' })}
            >
              <AiOutlineMail className="size-4" />
              이메일 보내기
            </a>
          </div>
        </div>
      </StudioReveal>
    </StudioCanvas>
  );
}

export function StudioPageCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="toris-studio relative left-1/2 -mb-8 -mt-24 w-screen !max-w-none -translate-x-1/2 overflow-hidden bg-[var(--toris-canvas)] text-[var(--toris-ink)]">
      {children}
    </div>
  );
}

export default function StudioLanding({
  projectCount,
  latestPosts
}: {
  projectCount: number;
  latestPosts: LandingPost[];
}) {
  return (
    <StudioPageCanvas>
      <StudioHero projectCount={projectCount} />
      <ServicesSection />
      <WorkSection />
      <ProcessSection />
      <LatestProofSection posts={latestPosts} />
      <StudioContactCta />
    </StudioPageCanvas>
  );
}

export function StudioRouteFooterCta() {
  return <StudioContactCta />;
}
