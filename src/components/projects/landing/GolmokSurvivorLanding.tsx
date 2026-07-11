'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import type { Project } from '@/data/projects';
import { cn } from '@/utils/style';
import { PhoneFrame } from './DeviceFrames';
import { AccentButton, EASE, GhostButton, Reveal } from './shared';

const GREEN = '#16C172';
const ORANGE = '#FF7A1A';

/* ---------- 인라인 SVG 아이콘 ---------- */
function Ico({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

const paths: Record<string, ReactNode> = {
  gamepad: (
    <>
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <circle cx="15" cy="13" r="1" />
      <circle cx="18" cy="11" r="1" />
      <path d="M17.32 5H6.68a4 4 0 0 0-3.98 3.6c-.01.1-.05.42-.1.83a35 35 0 0 0-.1 6.57A3.26 3.26 0 0 0 8.24 18l1.4-1.4a2 2 0 0 1 1.42-.6h1.88a2 2 0 0 1 1.42.6l1.4 1.4a3.26 3.26 0 0 0 5.74-2 35 35 0 0 0-.1-6.57c-.05-.41-.09-.73-.1-.83A4 4 0 0 0 17.32 5Z" />
    </>
  ),
  map: (
    <>
      <path d="M9 3 3.6 4.8A1 1 0 0 0 3 5.75v13.3a1 1 0 0 0 1.32.95L9 18.5l6 2.5 5.4-1.8a1 1 0 0 0 .6-.95V4.95a1 1 0 0 0-1.32-.95L15 5.5 9 3Z" />
      <line x1="9" y1="3" x2="9" y2="18.5" />
      <line x1="15" y1="5.5" x2="15" y2="21" />
    </>
  ),
  layers: (
    <>
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  up: <path d="M12 19V5m0 0-6 6m6-6 6 6" />,
  down: <path d="M12 5v14m0 0-6-6m6 6 6-6" />,
  left: <path d="M19 12H5m0 0 6-6m-6 6 6 6" />,
  right: <path d="M5 12h14m0 0-6-6m6 6-6 6" />
};

/* ---------- 섹션 헤딩 ---------- */
function Head({
  eyebrow,
  title,
  sub,
  align = 'center'
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: string;
  align?: 'center' | 'left';
}) {
  return (
    <Reveal
      className={
        align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'
      }
    >
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
        {title}
      </h2>
      {sub && (
        <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-400">
          {sub}
        </p>
      )}
    </Reveal>
  );
}

const card =
  'rounded-2xl border border-slate-900/10 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]';

/* ---------- 히어로: 게임 화면 목업 ---------- */
function LaneCar({
  color,
  duration,
  delay,
  reverse,
  top,
  staticLeft,
  reduce
}: {
  color: string;
  duration: number;
  delay: number;
  reverse?: boolean;
  top: string;
  staticLeft: string;
  reduce: boolean;
}) {
  if (reduce) {
    return (
      <span
        className="absolute h-3 w-7 rounded-[4px]"
        style={{ backgroundColor: color, top, left: staticLeft }}
        aria-hidden
      />
    );
  }
  return (
    <motion.span
      className="absolute h-3 w-7 rounded-[4px]"
      style={{ backgroundColor: color, top, left: -32 }}
      animate={{ x: reverse ? [300, -16] : [-16, 300] }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
        delay
      }}
      aria-hidden
    />
  );
}

function RoadLane({
  reduce,
  carColor,
  carColor2,
  duration
}: {
  reduce: boolean;
  carColor: string;
  carColor2: string;
  duration: number;
}) {
  return (
    <div className="relative h-12 shrink-0 overflow-hidden bg-slate-600 dark:bg-slate-700">
      {/* 중앙 점선 */}
      <div
        className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.7) 0 12px, transparent 12px 24px)'
        }}
        aria-hidden
      />
      <LaneCar
        color={carColor}
        duration={duration}
        delay={0}
        top="6px"
        staticLeft="18%"
        reduce={reduce}
      />
      <LaneCar
        color={carColor2}
        duration={duration * 1.3}
        delay={0.8}
        reverse
        top="30px"
        staticLeft="62%"
        reduce={reduce}
      />
    </div>
  );
}

function SubwayLane() {
  return (
    <div className="relative h-10 shrink-0 overflow-hidden bg-slate-900 dark:bg-slate-950">
      {[10, 26].map((y) => (
        <div
          key={y}
          className="absolute left-0 w-full"
          style={{
            top: y,
            height: 2,
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(148,163,184,0.6) 0 8px, transparent 8px 14px)'
          }}
          aria-hidden
        />
      ))}
    </div>
  );
}

function RiverLane({ reduce }: { reduce: boolean }) {
  return (
    <div className="relative h-10 shrink-0 overflow-hidden bg-sky-500 dark:bg-sky-800">
      {[6, 20].map((y, i) =>
        reduce ? (
          <span
            key={y}
            className="absolute h-[3px] w-10 rounded-full bg-white/40"
            style={{ top: y, left: `${20 + i * 35}%` }}
            aria-hidden
          />
        ) : (
          <motion.span
            key={y}
            className="absolute h-[3px] w-10 rounded-full bg-white/40"
            style={{ top: y, left: -40 }}
            animate={{ x: [0, 320] }}
            transition={{
              duration: 7 + i * 2,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 1.4
            }}
            aria-hidden
          />
        )
      )}
    </div>
  );
}

function AlleyLane({
  children,
  tall
}: {
  children?: ReactNode;
  tall?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden bg-amber-100 dark:bg-amber-950/60',
        tall ? 'h-12' : 'h-9'
      )}
    >
      {children}
    </div>
  );
}

function HeroGameScreen() {
  const reduce = useReducedMotion() ?? false;
  return (
    <div className="flex h-full flex-col bg-emerald-50 pt-9 dark:bg-slate-950">
      {/* 스코어 카운터 */}
      <div className="flex items-center justify-between px-4 pb-2">
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold text-white"
          style={{ backgroundColor: GREEN }}
        >
          SCORE 128
        </span>
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
          BEST 341
        </span>
      </div>
      {/* 레인 스택 */}
      <div className="flex flex-1 flex-col">
        <RiverLane reduce={reduce} />
        <RoadLane
          reduce={reduce}
          carColor={ORANGE}
          carColor2="#f8fafc"
          duration={4.5}
        />
        <SubwayLane />
        <AlleyLane tall>
          {/* 주인공 캐릭터 */}
          <motion.span
            className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-md shadow-md"
            style={{ backgroundColor: GREEN }}
            animate={reduce ? undefined : { y: [0, -4, 0] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            aria-hidden
          >
            <span className="absolute left-1 top-1 size-1 rounded-full bg-white/90" />
            <span className="absolute right-1 top-1 size-1 rounded-full bg-white/90" />
          </motion.span>
        </AlleyLane>
        <RoadLane
          reduce={reduce}
          carColor="#facc15"
          carColor2={ORANGE}
          duration={3.6}
        />
        <AlleyLane />
        <SubwayLane />
        <RoadLane
          reduce={reduce}
          carColor="#f8fafc"
          carColor2="#facc15"
          duration={5.2}
        />
        <AlleyLane tall />
      </div>
      {/* 하단 힌트 */}
      <p className="border-t border-slate-900/10 py-2 text-center text-[9px] font-bold tracking-wide text-slate-400 dark:border-white/10 dark:text-slate-500">
        탭해서 한 칸 전진
      </p>
    </div>
  );
}

function Hero({ project }: { project: Project }) {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-32">
      {/* 픽셀 격자 배경 */}
      <div
        className="pointer-events-none absolute inset-0 text-slate-900 opacity-[0.05] dark:text-white"
        style={{
          backgroundImage:
            'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      <div
        className="pointer-events-none absolute -left-24 top-24 size-96 rounded-full blur-3xl"
        style={{ backgroundColor: 'rgba(22,193,114,0.16)' }}
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full blur-3xl"
        style={{ backgroundColor: 'rgba(255,122,26,0.12)' }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div className="flex flex-wrap gap-2">
            {[project.status, project.year, project.category].map((p) => (
              <span
                key={p}
                className="rounded-full border border-slate-900/10 bg-white/70 px-3 py-1 text-xs font-bold text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-300"
              >
                {p}
              </span>
            ))}
          </div>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            골목길 생존기
            <span
              className="mt-3 block bg-gradient-to-r bg-clip-text text-3xl text-transparent sm:text-4xl lg:text-5xl"
              style={{
                backgroundImage: `linear-gradient(90deg, ${GREEN}, ${ORANGE})`
              }}
            >
              서울 골목, 한 칸만 더
            </span>
          </h1>
          <p className="mt-6 max-w-md leading-relaxed text-slate-600 dark:text-slate-400">
            {project.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <AccentButton
              href={project.github}
              from={project.accent.from}
              to={project.accent.to}
              glow={project.accent.glow}
            >
              GitHub 프로필
            </AccentButton>
            <GhostButton href="#golmok-gameplay">게임플레이 보기</GhostButton>
          </div>
        </motion.div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
          className="relative mx-auto"
        >
          <PhoneFrame className="w-[270px]">
            <HeroGameScreen />
          </PhoneFrame>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- 1. 하이퍼캐주얼의 본질 ---------- */
const GOALS = [
  { big: '3초', small: '안에 규칙 이해' },
  { big: '30초', small: '한 판의 길이' },
  { big: '"한 번만 더"', small: '죽어도 다시 누르는 손' }
];

function ProblemSection() {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Why"
        title="하이퍼캐주얼의 본질에 집중"
        sub="Crossy Road가 증명한 원터치 횡단의 손맛. 거기에 도로·골목·지하철·한강 — 매일 지나치는 한국 도시 풍경을 입혀 차별화합니다."
      />
      <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-3">
        {GOALS.map((g, i) => (
          <Reveal key={g.big} delay={i * 0.1}>
            <div className={`${card} h-full p-6 text-center shadow-sm`}>
              <p
                className="text-2xl font-extrabold tracking-tight"
                style={{ color: i === 2 ? ORANGE : GREEN }}
              >
                {g.big}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {g.small}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- 2. 핵심 기능 ---------- */
function FeaturesSection({ project }: { project: Project }) {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Features"
        title="작지만 단단한 게임"
        sub="검증된 재미 위에, 우리 동네의 디테일을 얹었습니다."
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
        {project.features.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.1}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: EASE }}
              className={`${card} h-full p-6 shadow-sm`}
            >
              <span
                className="flex size-10 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: 'rgba(22,193,114,0.14)',
                  color: GREEN
                }}
              >
                <Ico className="size-5">
                  {paths[f.icon] ?? paths.gamepad}
                </Ico>
              </span>
              <p className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                {f.title}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {f.description}
              </p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- 3. 게임플레이: 조작법 + MVP 목표 ---------- */
const CONTROLS = [
  { icon: paths.up, label: '탭 / 위 스와이프', desc: '한 칸 전진', hop: { y: -5 } },
  { icon: paths.left, label: '좌 스와이프', desc: '왼쪽 이동', hop: { x: -5 } },
  { icon: paths.right, label: '우 스와이프', desc: '오른쪽 이동', hop: { x: 5 } },
  { icon: paths.down, label: '아래 스와이프', desc: '한 칸 후진', hop: { y: 5 } }
];

const MVP = [
  '조작 즉시 반응 — 입력 지연 없는 한 칸',
  '억울하지 않은 죽음 — 납득 가능한 충돌 판정',
  '다시 하고 싶은 결과 화면 — 기록 갱신의 손맛',
  '자연스러운 보상형 광고 — 이어하기 한 번의 가치'
];

function GameplaySection() {
  const reduce = useReducedMotion();
  return (
    <section id="golmok-gameplay" className="scroll-mt-24 px-6 py-24">
      <Head
        eyebrow="Gameplay"
        title="손가락 하나면 충분합니다"
        sub="설명서가 필요 없는 조작. 스와이프 네 방향이 전부입니다."
      />
      <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
        {CONTROLS.map((c, i) => (
          <Reveal key={c.label} delay={i * 0.08}>
            <motion.div
              whileHover={reduce ? undefined : c.hop}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className={`${card} flex h-full flex-col items-center gap-2 p-5 text-center shadow-sm`}
            >
              <span
                className="flex size-10 items-center justify-center rounded-full text-white"
                style={{
                  background: `linear-gradient(135deg, ${GREEN}, #0FA35F)`
                }}
              >
                <Ico className="size-5">{c.icon}</Ico>
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {c.label}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {c.desc}
              </p>
            </motion.div>
          </Reveal>
        ))}
      </div>
      <Reveal className="mx-auto mt-10 max-w-2xl" delay={0.1}>
        <div className={`${card} p-6 shadow-sm sm:p-8`}>
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-900 dark:text-white">
            MVP 4대 목표
          </p>
          <ul className="mt-5 space-y-3.5">
            {MVP.map((t) => (
              <li
                key={t}
                className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300"
              >
                <span
                  className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: GREEN }}
                >
                  <Ico className="size-3">{paths.check}</Ico>
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- 4. 디자인 시스템 밴드 ---------- */
const TOKEN_LAYERS = ['primitive', 'semantic', 'component', 'Flutter ThemeData'];

function DesignSystemSection() {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Design System"
        title="브랜드까지 게임의 일부"
        sub="색 두 개로 끝나는 브랜드 코어, 그리고 그것을 코드로 배달하는 토큰 파이프라인."
      />
      <div className="mx-auto mt-12 max-w-3xl space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {[
            { hex: GREEN, name: '건너가 그린', role: '전진 · 성공 · 주인공' },
            { hex: ORANGE, name: '택시 오렌지', role: '광고 보상 CTA · 위험' }
          ].map((c, i) => (
            <Reveal key={c.hex} delay={i * 0.1}>
              <div className={`${card} flex items-center gap-4 p-5 shadow-sm`}>
                <span
                  className="size-14 shrink-0 rounded-2xl shadow-inner"
                  style={{ backgroundColor: c.hex }}
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {c.name}
                  </p>
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {c.hex}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {c.role}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.15}>
          <div className={`${card} p-6 shadow-sm`}>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              3-레이어 디자인 토큰
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {TOKEN_LAYERS.map((layer, i) => (
                <div key={layer} className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-bold',
                      i === TOKEN_LAYERS.length - 1
                        ? 'text-white'
                        : 'border border-slate-900/10 bg-white text-slate-800 dark:border-white/15 dark:bg-white/5 dark:text-slate-200'
                    )}
                    style={
                      i === TOKEN_LAYERS.length - 1
                        ? {
                            background: `linear-gradient(90deg, ${GREEN}, ${ORANGE})`
                          }
                        : undefined
                    }
                  >
                    {layer}
                  </span>
                  {i < TOKEN_LAYERS.length - 1 && (
                    <span
                      className="text-sm font-bold"
                      style={{ color: GREEN }}
                      aria-hidden
                    >
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              원시 팔레트에서 의미 토큰, 컴포넌트 토큰을 거쳐 Flutter
              ThemeData까지 한 줄로 흐릅니다. 색을 바꾸면 게임 전체가 함께
              바뀝니다.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- 5. 기술 스택 ---------- */
const STACK: { group: string; items: string[] }[] = [
  { group: '엔진', items: ['Flutter', 'Flame'] },
  { group: '저장', items: ['로컬 (shared_preferences)'] },
  { group: '수익화', items: ['AdMob 보상형'] },
  { group: '플랫폼', items: ['Android → iOS'] }
];

function TechSection() {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Tech Stack"
        title="가볍게 만들고, 빠르게 굴린다"
        sub="서버 없이 로컬로 시작해, 한 코드베이스로 두 플랫폼을 커버합니다."
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STACK.map((g, i) => (
          <Reveal key={g.group} delay={i * 0.08}>
            <div className={`${card} h-full p-5 shadow-sm`}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                {g.group}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {g.items.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-slate-900/10 bg-white px-3 py-1 text-xs font-semibold text-slate-800 dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- 6. 최종 CTA ---------- */
function FinalCta({ project }: { project: Project }) {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden px-6 py-28">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: 'rgba(22,193,114,0.14)' }}
      />
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative mx-auto max-w-xl text-center"
      >
        <span
          className="mx-auto flex size-12 items-center justify-center rounded-2xl text-white shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${GREEN}, ${ORANGE})`
          }}
        >
          <Ico className="size-6">{paths.gamepad}</Ico>
        </span>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          다음 판은{' '}
          <span
            className="bg-gradient-to-r bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(90deg, ${GREEN}, ${ORANGE})`
            }}
          >
            당신 차례
          </span>
          입니다
        </h2>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          한 칸씩 완성되어 가는 중입니다. 출시 소식은 GitHub 프로필에서
          만나보세요.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <AccentButton
            href={project.github}
            from={project.accent.from}
            to={project.accent.to}
            glow={project.accent.glow}
          >
            GitHub 프로필
          </AccentButton>
          <Link
            href="/projects"
            className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-500 dark:text-slate-400 dark:hover:text-white"
          >
            다른 프로젝트 보기 →
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ---------- 미니 푸터 ---------- */
function LandingFooter({ project }: { project: Project }) {
  return (
    <footer className="border-t border-slate-900/10 px-6 py-10 dark:border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400 sm:flex-row">
        <p>
          <span className="font-bold text-slate-900 dark:text-white">
            {project.name}
          </span>{' '}
          · © 2026 toris-dev
        </p>
        <div className="flex items-center gap-6">
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            GitHub 프로필 ↗
          </a>
          <Link
            href="/projects"
            className="transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            모든 프로젝트 →
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function GolmokSurvivorLanding({
  project
}: {
  project: Project;
}) {
  return (
    <div className="overflow-x-clip bg-emerald-50/40 text-slate-900 dark:bg-[#04100A] dark:text-white">
      <Hero project={project} />
      <ProblemSection />
      <FeaturesSection project={project} />
      <GameplaySection />
      <DesignSystemSection />
      <TechSection />
      <FinalCta project={project} />
      <LandingFooter project={project} />
    </div>
  );
}
