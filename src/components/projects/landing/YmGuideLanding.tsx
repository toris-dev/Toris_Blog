'use client';

import { useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform
} from 'framer-motion';
import { cn } from '@/utils/style';
import type { Project } from '@/data/projects';
import { AccentButton, CountUp, GhostButton, Reveal } from './shared';

const EASE = [0.16, 1, 0.3, 1] as const;

/* ---------- 인라인 SVG 아이콘 (24x24 스트로크) ---------- */
function Ico({
  children,
  className,
  filled = false
}: {
  children: ReactNode;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
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

const glyphs = {
  sliders: (
    <>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </>
  ),
  cards: (
    <>
      <rect x="3" y="7" width="14" height="14" rx="2" />
      <path d="M7 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2" />
    </>
  ),
  chart: (
    <>
      <line x1="4" y1="20" x2="4" y2="10" />
      <line x1="10" y1="20" x2="10" y2="4" />
      <line x1="16" y1="20" x2="16" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </>
  ),
  heart: (
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  ),
  check: <polyline points="20 6 9 17 4 12" />,
  spark: (
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  external: (
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6M10 14 21 3" />
    </>
  )
};

const featureGlyphs = [glyphs.sliders, glyphs.cards, glyphs.chart, glyphs.heart];

/* ---------- 공통 섹션 헤더 ---------- */
function Head({
  eyebrow,
  title,
  sub,
  accent,
  align = 'center'
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: string;
  accent: string;
  align?: 'center' | 'left';
}) {
  return (
    <Reveal
      className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'}
    >
      <p
        className="text-xs font-bold uppercase tracking-[0.22em]"
        style={{ color: accent }}
      >
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
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
  'rounded-2xl border border-slate-900/10 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none';

/* ---------- 브라우저 크롬 프레임 ---------- */
function BrowserFrame({
  url,
  children,
  className
}: {
  url: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-900/10 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900 dark:shadow-2xl',
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-900/10 bg-slate-50 px-4 py-2.5 dark:border-white/10 dark:bg-slate-800/80">
        <span className="size-2.5 rounded-full bg-rose-400" />
        <span className="size-2.5 rounded-full bg-amber-400" />
        <span className="size-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-[11px] font-medium text-slate-400 dark:bg-slate-900 dark:text-slate-500">
          {url}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ---------- 매칭도 링 ---------- */
function MatchRing({
  pct,
  from,
  to,
  id
}: {
  pct: number;
  from: string;
  to: string;
  id: string;
}) {
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 48 48" className="size-12 -rotate-90" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        strokeWidth="4"
        className="stroke-slate-200 dark:stroke-white/10"
      />
      <motion.circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        stroke={`url(#${id})`}
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        whileInView={{ strokeDashoffset: c * (1 - pct / 100) }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 1.1, ease: EASE }}
      />
    </svg>
  );
}

/* ---------- 1. 히어로 ---------- */
function Hero({ project }: { project: Project }) {
  const a = project.accent;
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });
  const tilt = useTransform(scrollYProgress, [0, 1], [-4, 2]);
  const rise = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section ref={ref} className="relative overflow-hidden px-6 pb-24 pt-28 sm:pt-32">
      <div
        className="pointer-events-none absolute -left-24 top-16 size-96 rounded-full blur-3xl"
        style={{ background: a.from, opacity: 0.18 }}
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-4 size-[26rem] rounded-full blur-3xl"
        style={{ background: a.to, opacity: 0.16 }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[46fr_54fr]">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {[project.status, project.year, project.category].map((t) => (
              <span
                key={t}
                className="rounded-full border border-slate-900/10 bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                {t}
              </span>
            ))}
          </div>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            나에게 맞는{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(90deg, ${a.from}, ${a.to})`
              }}
            >
              청년 정책
            </span>
            <br className="hidden sm:block" /> 한 번에
          </h1>
          <p className="mt-4 text-lg font-medium text-slate-700 dark:text-slate-300">
            {project.tagline}
          </p>
          <p className="mt-4 max-w-md leading-relaxed text-slate-600 dark:text-slate-400">
            {project.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <AccentButton
              href={project.github}
              from={a.from}
              to={a.to}
              glow={a.glow}
            >
              <Ico className="size-4">{glyphs.external}</Ico>
              GitHub 보기
            </AccentButton>
            <GhostButton href="#showcase">프로젝트 보기</GhostButton>
            <GhostButton href="#tech">기술 스택 보기</GhostButton>
          </div>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
          style={reduce ? undefined : { rotate: tilt, y: rise }}
          className="relative"
        >
          <div
            className="pointer-events-none absolute -inset-4 rounded-[2rem] blur-2xl"
            style={{
              background: `linear-gradient(120deg, ${a.from}, ${a.to})`,
              opacity: 0.22
            }}
          />
          <BrowserFrame url="ym-guide.app/recommend" className="relative">
            <div
              className="relative w-full overflow-hidden"
              style={{ aspectRatio: '1376 / 768' }}
            >
              <Image
                src={project.image}
                alt="YM Guide 맞춤 청년 정책 추천 화면 목업 — 조건 필터와 매칭도가 표시된 정책 추천 카드 목록"
                width={1376}
                height={768}
                sizes="(min-width: 1024px) 640px, 100vw"
                priority
                className="h-auto w-full object-cover"
              />
            </div>
          </BrowserFrame>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- 2. 문제 / 목표 ---------- */
function ProblemSection({ project }: { project: Project }) {
  const a = project.accent;
  const goals = [
    '흩어진 정책 정보를 한 곳에서 조건별로 탐색',
    '복잡한 자격 요건을 매칭도로 쉽게 이해',
    '금융·복지 리터러시를 높이는 학습 콘텐츠 제공'
  ];
  return (
    <section className="px-6 py-24">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <div>
          <Head
            align="left"
            accent={a.from}
            eyebrow="Problem"
            title="청년 정책, 어디서 찾아야 할지 모르겠다면"
            sub="중앙부처·지자체·금융기관에 흩어진 수백 개의 청년 정책. 자격 요건은 복잡하고, 정부 포털은 딱딱합니다. 정작 나에게 맞는 혜택 하나를 찾기까지 몇 시간이 걸리곤 하죠."
          />
        </div>
        <Reveal delay={0.1}>
          <div className={cn(card, 'p-7')}>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              누구를 위해 만들었나
            </p>
            <p className="mt-3 leading-relaxed text-slate-700 dark:text-slate-300">
              주거·취업·창업·금융 지원이 필요한{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                19–39세 청년
              </span>
              을 위해. 정부 서비스보다 친절하고, 은행 앱보다 신뢰할 수 있는
              공공 SaaS 경험을 목표로 합니다.
            </p>
            <ul className="mt-6 space-y-3">
              {goals.map((g) => (
                <li key={g} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white"
                    style={{
                      background: `linear-gradient(135deg, ${a.from}, ${a.to})`
                    }}
                  >
                    <Ico className="size-3">{glyphs.check}</Ico>
                  </span>
                  <span className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {g}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- 3. 핵심 기능 ---------- */
function FeaturesSection({ project }: { project: Project }) {
  const a = project.accent;
  return (
    <section className="px-6 py-24">
      <Head
        accent={a.from}
        eyebrow="Features"
        title="조건 입력 한 번으로, 맞춤 큐레이션까지"
        sub="필터부터 정책 카드, 금융 교육 대시보드까지 — 청년에게 필요한 흐름을 하나로 이었습니다."
      />
      <div className="mx-auto mt-14 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {project.features.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.08}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: EASE }}
              className={cn(card, 'group h-full p-6')}
              style={{ ['--glow' as string]: a.glow }}
            >
              <span
                className="flex size-12 items-center justify-center rounded-xl text-white transition-shadow duration-300 group-hover:shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${a.from}, ${a.to})`,
                  boxShadow: `0 8px 24px ${a.glow}`
                }}
              >
                <Ico className="size-6">
                  {featureGlyphs[i % featureGlyphs.length]}
                </Ico>
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {f.description}
              </p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- 4. 비주얼 쇼케이스 + 컨셉 그래픽 ---------- */
const CONDITIONS = [
  { key: 'age', label: '나이', options: ['19–24세', '25–29세', '30–34세'] },
  { key: 'region', label: '지역', options: ['서울', '경기', '부산', '전국'] },
  { key: 'income', label: '소득', options: ['중위 50%', '중위 100%', '무관'] },
  { key: 'interest', label: '관심사', options: ['주거', '취업', '창업', '금융'] }
] as const;

type CondKey = (typeof CONDITIONS)[number]['key'];

const POLICIES = [
  { name: '청년월세 특별지원', tag: '주거', pct: 96 },
  { name: '청년내일채움공제', tag: '취업', pct: 89 },
  { name: '청년도약계좌', tag: '금융', pct: 82 }
];

function ShowcaseSection({ project }: { project: Project }) {
  const a = project.accent;
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<Record<CondKey, number>>({
    age: 1,
    region: 0,
    income: 1,
    interest: 0
  });

  const matched =
    32 +
    selected.age * 9 +
    selected.region * 6 +
    selected.income * 7 +
    selected.interest * 5;

  return (
    <section id="showcase" className="px-6 py-24">
      <Head
        accent={a.from}
        eyebrow="Showcase"
        title="조건을 고르면, 추천이 살아납니다"
        sub="칩을 눌러 조건을 바꿔보세요. 매칭되는 정책 수가 실시간으로 반응합니다."
      />

      {/* 앵글 목업 + 플로팅 콜아웃 */}
      <Reveal className="mx-auto mt-14 max-w-5xl">
        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-6 rounded-[2.5rem] blur-3xl"
            style={{
              background: `linear-gradient(120deg, ${a.from}, ${a.to})`,
              opacity: 0.16
            }}
          />
          <motion.div
            initial={reduce ? false : { rotate: -2, y: 20, opacity: 0 }}
            whileInView={{ rotate: reduce ? 0 : -1.5, y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, ease: EASE }}
            className="relative"
          >
            <BrowserFrame url="ym-guide.app/recommend?age=25-29">
              <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: '1376 / 768' }}
              >
                <Image
                  src={project.image}
                  alt="YM Guide 추천 결과 화면 — 조건에 맞춘 청년 정책 카드가 매칭도 순으로 정렬된 대시보드"
                  width={1376}
                  height={768}
                  sizes="(min-width: 1024px) 900px, 100vw"
                  className="h-auto w-full object-cover"
                />
              </div>
            </BrowserFrame>
          </motion.div>

          {/* 플로팅 콜아웃 칩 */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5, ease: EASE }}
            className="absolute -left-3 top-8 hidden rounded-2xl border border-slate-900/10 bg-white/90 px-4 py-3 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/90 sm:block"
          >
            <p className="text-[10px] font-semibold text-slate-400">매칭도</p>
            <p
              className="text-xl font-extrabold"
              style={{ color: a.from }}
            >
              96%
            </p>
          </motion.div>
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.55, duration: 0.5, ease: EASE }}
            className="absolute -right-3 bottom-10 hidden items-center gap-2 rounded-2xl border border-slate-900/10 bg-white/90 px-4 py-3 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/90 sm:flex"
          >
            <span
              className="flex size-8 items-center justify-center rounded-lg text-white"
              style={{ background: a.to }}
            >
              <Ico className="size-4">{glyphs.shield}</Ico>
            </span>
            <div>
              <p className="text-[10px] font-semibold text-slate-400">
                검증된 출처
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                공공데이터 연동
              </p>
            </div>
          </motion.div>
        </div>
      </Reveal>

      {/* 코드로 그린 컨셉 그래픽: 필터 패널 + 정책 카드 */}
      <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-[38fr_62fr]">
        {/* 조건 필터 패널 */}
        <Reveal>
          <div className={cn(card, 'p-6')}>
            <div className="flex items-center gap-2">
              <Ico className="size-5 text-slate-500 dark:text-slate-400">
                {glyphs.sliders}
              </Ico>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                조건 선택
              </p>
            </div>
            <div className="mt-5 space-y-5">
              {CONDITIONS.map((c) => (
                <div key={c.key}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {c.label}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {c.options.map((opt, oi) => {
                      const active = selected[c.key] === oi;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setSelected((s) => ({ ...s, [c.key]: oi }))
                          }
                          aria-pressed={active}
                          className={cn(
                            'min-h-[36px] rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                            active
                              ? 'border-transparent text-white shadow-sm'
                              : 'border-slate-900/10 text-slate-600 hover:border-slate-900/20 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/25'
                          )}
                          style={
                            active
                              ? {
                                  background: `linear-gradient(90deg, ${a.from}, ${a.to})`,
                                  outlineColor: a.from
                                }
                              : { outlineColor: a.from }
                          }
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-white/[0.04]">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                매칭 정책
              </span>
              <motion.span
                key={matched}
                initial={{ scale: reduce ? 1 : 1.25, opacity: 0.4 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="text-lg font-extrabold tabular-nums"
                style={{ color: a.from }}
              >
                {matched}개
              </motion.span>
            </div>
          </div>
        </Reveal>

        {/* 정책 추천 카드 (매칭도 링) */}
        <Reveal delay={0.1}>
          <div className="grid gap-4 sm:grid-cols-1">
            {POLICIES.map((p, i) => (
              <motion.div
                key={p.name}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25, ease: EASE }}
                className={cn(
                  card,
                  'flex items-center gap-5 p-5'
                )}
              >
                <MatchRing
                  pct={p.pct}
                  from={a.from}
                  to={a.to}
                  id={`ring-${i}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ background: a.from }}
                    >
                      {p.tag}
                    </span>
                    <span
                      className="text-[11px] font-bold tabular-nums"
                      style={{ color: a.to }}
                    >
                      매칭 {p.pct}%
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-bold text-slate-900 dark:text-white">
                    {p.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    조건 충족 · 신청 기간 진행 중
                  </p>
                </div>
                <Ico className="size-5 shrink-0 text-slate-300 dark:text-slate-600">
                  {glyphs.arrow}
                </Ico>
              </motion.div>
            ))}

            {/* 금융 교육 미니 대시보드 */}
            <div className={cn(card, 'p-5')}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  금융 교육 진행률
                </p>
                <span
                  className="text-xs font-bold"
                  style={{ color: a.from }}
                >
                  4 / 6 완료
                </span>
              </div>
              <div className="mt-4 flex items-end gap-2" aria-hidden>
                {[40, 65, 52, 80, 70, 92].map((h, i) => (
                  <motion.span
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: i * 0.06, duration: 0.6, ease: EASE }}
                    className="w-full rounded-t-md"
                    style={{
                      background: `linear-gradient(180deg, ${a.to}, ${a.from})`,
                      minHeight: 8,
                      display: 'block'
                    }}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                예산 관리 · 청약 · 대출 이해 등 6개 챕터
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- 5. 기술 스택 ---------- */
const TECH_GROUPS: { label: string; items: string[] }[] = [
  { label: 'Framework', items: ['Next.js', 'React'] },
  { label: 'Language', items: ['TypeScript'] },
  { label: 'Styling', items: ['Tailwind CSS'] },
  { label: 'Backend · Database', items: ['Supabase'] }
];

function TechSection({ project }: { project: Project }) {
  const a = project.accent;
  return (
    <section id="tech" className="scroll-mt-20 px-6 py-24">
      <Head
        accent={a.from}
        eyebrow="Tech Stack"
        title="가볍고 견고한 풀스택 구성"
        sub="빠른 개발과 신뢰 가능한 데이터 계층을 위해, 검증된 모던 스택으로 구성했습니다."
      />
      <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2">
        {TECH_GROUPS.map((g, gi) => (
          <Reveal key={g.label} delay={gi * 0.08}>
            <div className={cn(card, 'h-full p-6')}>
              <div className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ background: a.from }}
                />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {g.label}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {g.items.map((t) => (
                  <span
                    key={t}
                    className="rounded-lg border border-slate-900/10 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
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

/* ---------- 6. 임팩트 / 결과 ---------- */
function ImpactSection({ project }: { project: Project }) {
  const a = project.accent;
  const stats: { target: number; suffix: string; label: string }[] = [
    { target: 300, suffix: '+', label: '큐레이션 정책' },
    { target: 4, suffix: '개', label: '핵심 필터 조건' },
    { target: 96, suffix: '%', label: '최고 매칭 정확도' },
    { target: 6, suffix: '챕터', label: '금융 교육 콘텐츠' }
  ];
  return (
    <section className="px-6 py-24">
      <Head
        accent={a.from}
        eyebrow="Impact"
        title="숫자보다 경험으로 증명하는 공공 SaaS"
        sub="아직 성장 중인 서비스지만, 접근성과 친절함이라는 방향은 분명합니다. 아래 지표는 구현된 역량을 보여주는 예시입니다."
      />
      <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08}>
            <div className={cn(card, 'p-6 text-center')}>
              <p
                className="text-4xl font-extrabold tracking-tight"
                style={{ color: a.from }}
              >
                <CountUp target={s.target} suffix={s.suffix} />
              </p>
              <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                {s.label}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.1} className="mx-auto mt-10 max-w-2xl text-center">
        <p className="leading-relaxed text-slate-600 dark:text-slate-400">
          정부 포털의 정보 접근성 문제를 UX로 풀어내며, 조건 기반 추천과
          매칭도 시각화로{' '}
          <span className="font-semibold text-slate-900 dark:text-white">
            &ldquo;나에게 맞는 혜택&rdquo;
          </span>
          을 찾는 시간을 크게 줄이는 것을 목표로 합니다. WCAG 대비, 키보드
          탐색, 친절한 카피가 이 프로젝트의 차별점입니다.
        </p>
      </Reveal>
    </section>
  );
}

/* ---------- 7. 최종 CTA ---------- */
function FinalCta({ project }: { project: Project }) {
  const a = project.accent;
  const reduce = useReducedMotion();
  return (
    <section className="px-6 pb-28 pt-8">
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-900/10 px-6 py-16 text-center dark:border-white/10"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${a.from}, ${a.to})`,
            opacity: 0.1
          }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-0 size-72 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: a.from, opacity: 0.22 }}
        />
        <div className="relative">
          <span
            className="mx-auto flex size-14 items-center justify-center rounded-2xl text-white"
            style={{
              background: `linear-gradient(135deg, ${a.from}, ${a.to})`,
              boxShadow: `0 12px 32px ${a.glow}`
            }}
          >
            <Ico className="size-7">{glyphs.spark}</Ico>
          </span>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            청년에게 필요한 정보,{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(90deg, ${a.from}, ${a.to})`
              }}
            >
              더 쉽게
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-slate-600 dark:text-slate-400">
            {project.name}의 코드와 설계를 직접 확인하거나, 다른 프로젝트도
            둘러보세요.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <AccentButton
              href={project.github}
              from={a.from}
              to={a.to}
              glow={a.glow}
            >
              <Ico className="size-4">{glyphs.external}</Ico>
              GitHub 보기
            </AccentButton>
            <GhostButton href="/projects">다른 프로젝트 보기</GhostButton>
            <GhostButton href="/contact">문의하기</GhostButton>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default function YmGuideLanding({ project }: { project: Project }) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-slate-50 text-slate-900 dark:bg-[#050810] dark:text-white">
      <Hero project={project} />
      <ProblemSection project={project} />
      <FeaturesSection project={project} />
      <ShowcaseSection project={project} />
      <TechSection project={project} />
      <ImpactSection project={project} />
      <FinalCta project={project} />
    </div>
  );
}
