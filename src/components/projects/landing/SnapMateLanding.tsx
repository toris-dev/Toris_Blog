'use client';

import { useRef, type ReactNode } from 'react';
import Link from 'next/link';
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform
} from 'framer-motion';
import type { Project } from '@/data/projects';
import { PhoneFrame } from './DeviceFrames';
import { AccentButton, EASE, GhostButton, Reveal } from './shared';

/* ---------- 인라인 SVG 아이콘 ---------- */
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

const paths = {
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  cloud: <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />,
  heart: (
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  ),
  camera: (
    <>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </>
  )
};

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
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-500 dark:text-amber-400">
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
  'rounded-2xl border border-slate-900/10 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]';

/* ---------- 사진 비주얼 (앰버 그라디언트 + 컵 실루엣) ---------- */
function PhotoVisual({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-amber-300 via-orange-300 to-amber-500 ${className ?? ''}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full text-white/50"
        aria-hidden
      >
        <path
          d="M30 44h36v10a18 18 0 0 1-36 0z"
          fill="currentColor"
          stroke="none"
        />
        <path
          d="M66 46h6a7 7 0 0 1 0 14h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <ellipse cx="48" cy="80" rx="26" ry="4" fill="currentColor" />
        <path
          d="M40 26c0 4 4 4 4 8M52 22c0 5 4 5 4 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/* ---------- 갤러리 썸네일 ---------- */
const THUMBS = [
  'from-amber-200 to-orange-300',
  'from-orange-200 to-amber-400',
  'from-yellow-200 to-orange-300',
  'from-amber-300 to-rose-200',
  'from-orange-300 to-amber-200',
  'from-amber-200 to-yellow-300',
  'from-rose-200 to-amber-300',
  'from-amber-400 to-orange-200'
];

function GalleryScreen() {
  return (
    <div className="flex h-full flex-col bg-white pt-9 dark:bg-slate-950">
      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          <p className="text-[13px] font-bold text-slate-900 dark:text-white">
            우리 둘
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            사진 128장
          </p>
        </div>
        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white">
          방금
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-3">
        <PhotoVisual className="aspect-square rounded-lg" />
        {THUMBS.map((t) => (
          <div
            key={t}
            className={`aspect-square rounded-lg bg-gradient-to-br ${t}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- 히어로 ---------- */
function Hero({ project }: { project: Project }) {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-32">
      <div className="pointer-events-none absolute -right-24 top-24 size-96 rounded-full bg-amber-400/25 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 size-80 rounded-full bg-orange-400/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-500 dark:text-amber-400">
            {project.category} · {project.status}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            찍는{' '}
            <span className="bg-gradient-to-r from-amber-500 to-orange-400 bg-clip-text text-transparent">
              순간
            </span>
            ,<br />
            함께 본다
          </h1>
          <p className="mt-6 max-w-md leading-relaxed text-slate-600 dark:text-slate-400">
            앱 카메라로 찍으면 그룹 갤러리에 바로. 보내는 과정 없이, 찍는 게 곧
            공유입니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <AccentButton
              href="#snapmate-register"
              from={project.accent.from}
              to={project.accent.to}
              glow={project.accent.glow}
            >
              출시 알림 받기
            </AccentButton>
            <GhostButton href="#snapmate-how">작동 방식 보기</GhostButton>
          </div>
        </motion.div>
        <div className="relative mx-auto h-[540px] w-[340px]">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 40 }}
            animate={{ opacity: 0.85, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.15,
              type: 'spring',
              bounce: 0.3
            }}
            className="absolute right-0 top-0 origin-bottom rotate-6"
          >
            <PhoneFrame className="w-[240px]">
              <GalleryScreen />
            </PhoneFrame>
          </motion.div>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
            className="absolute left-0 top-6"
          >
            <PhoneFrame className="w-[250px]">
              <div className="relative flex h-full flex-col bg-slate-950">
                <PhotoVisual className="absolute inset-x-0 top-16 aspect-square" />
                <span className="absolute left-1/2 top-9 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/45 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur">
                  커플 갤러리 · 지수랑
                </span>
                <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
                  <span className="flex size-14 items-center justify-center rounded-full border-4 border-white/90">
                    <span className="size-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
                  </span>
                </div>
              </div>
            </PhoneFrame>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 1. 문제: 말풍선 ---------- */
const COMPLAINTS = [
  { text: '사진 보내줘~', side: 'left' },
  { text: '아 맞다, 이따 보낼게', side: 'right' },
  { text: '3주 뒤: 아직도 안 보냄', side: 'note' }
] as const;

function ProblemSection() {
  const reduce = useReducedMotion();
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Problem"
        title="찍고, 고르고, 보내고… 그러다 안 보내죠"
        sub="공유는 늘 나중으로 밀립니다. 추억이 한 사람의 갤러리에 갇히는 이유."
      />
      <div className="mx-auto mt-12 flex max-w-md flex-col gap-4">
        {COMPLAINTS.map((c, i) => (
          <motion.div
            key={c.text}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{
              opacity: 1,
              y: 0,
              rotate: c.side === 'note' ? -2 : 0
            }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.3, duration: 0.55, ease: EASE }}
            className={
              c.side === 'left'
                ? 'self-start rounded-2xl rounded-bl-sm bg-slate-200 px-4 py-2.5 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                : c.side === 'right'
                  ? 'self-end rounded-2xl rounded-br-sm bg-gradient-to-r from-amber-500 to-orange-400 px-4 py-2.5 text-sm font-medium text-white'
                  : 'self-center rounded-xl border border-dashed border-slate-900/25 px-5 py-2.5 text-sm font-semibold text-slate-500 dark:border-white/25 dark:text-slate-400'
            }
          >
            {c.text}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------- 2. 시그니처 A: 셔터 → 갤러리 착지 스크럽 ---------- */
function ShutterScrubSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end']
  });
  const p = scrollYProgress;
  const flash = useTransform(p, [0.25, 0.3, 0.35], [0, 0.6, 0]);
  const shutterScale = useTransform(p, [0.25, 0.3, 0.35], [1, 0.85, 1]);
  const chromeOpacity = useTransform(p, [0.35, 0.45], [1, 0]);
  const photoX = useTransform(p, [0.35, 0.7], [0, 12]);
  const photoY = useTransform(p, [0.35, 0.7], [0, -32]);
  const photoScale = useTransform(p, [0.35, 0.7], [1, 0.287]);
  const photoRadius = useTransform(p, [0.35, 0.7], [0, 10]);
  const galleryOpacity = useTransform(p, [0.68, 0.85], [0, 1]);
  const ringOpacity = useTransform(p, [0.74, 0.8], [0, 1]);
  const toastOpacity = useTransform(p, [0.82, 0.9], [0, 1]);
  const toastY = useTransform(p, [0.82, 0.9], [12, 0]);

  const photoStyle = reduce
    ? {
        x: 12,
        y: -32,
        scale: 0.287,
        borderRadius: 10,
        transformOrigin: 'top left'
      }
    : {
        x: photoX,
        y: photoY,
        scale: photoScale,
        borderRadius: photoRadius,
        transformOrigin: 'top left'
      };

  return (
    <section
      id="snapmate-how"
      ref={ref}
      className={reduce ? 'relative' : 'relative h-[250vh]'}
    >
      <div
        className={
          reduce
            ? 'px-6 py-24'
            : 'sticky top-0 flex min-h-screen flex-col items-center justify-center px-6 py-16'
        }
      >
        <Head
          eyebrow="How it works"
          title="셔터가 곧 전송 버튼"
          sub="찍은 사진이 그대로 그룹 갤러리 첫 칸에 착지합니다. 스크롤로 직접 확인해 보세요."
        />
        <div className="mt-10">
          <PhoneFrame className="w-[280px]">
            <div className="relative h-full bg-slate-950">
              {/* 갤러리 레이어 */}
              <motion.div
                style={{ opacity: reduce ? 1 : galleryOpacity }}
                className="absolute inset-0 flex flex-col bg-white pt-9 dark:bg-slate-950"
              >
                <div className="flex items-center justify-between px-4 pb-2">
                  <div>
                    <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                      우리 둘
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      사진 129장
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white">
                    방금
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 px-3">
                  <motion.div
                    style={{ opacity: reduce ? 1 : ringOpacity }}
                    className="aspect-square rounded-[10px] ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-950"
                  />
                  {THUMBS.map((t) => (
                    <div
                      key={t}
                      className={`aspect-square rounded-lg bg-gradient-to-br ${t}`}
                    />
                  ))}
                </div>
                <div className="absolute inset-x-0 bottom-6 flex justify-center">
                  <motion.div
                    style={
                      reduce
                        ? undefined
                        : { opacity: toastOpacity, y: toastY }
                    }
                    className="flex items-center gap-1.5 rounded-full border border-slate-900/10 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-700 shadow-lg dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Ico className="size-3 text-amber-500" filled>
                      {paths.heart}
                    </Ico>
                    지수님이 좋아합니다
                  </motion.div>
                </div>
              </motion.div>
              {/* 착지하는 사진 레이어 */}
              <motion.div
                style={photoStyle}
                className="absolute inset-x-0 top-[88px] z-10 aspect-square w-full overflow-hidden"
              >
                <PhotoVisual className="size-full" />
              </motion.div>
              {/* 뷰파인더 크롬 레이어 */}
              <motion.div
                style={{ opacity: reduce ? 0 : chromeOpacity }}
                className="pointer-events-none absolute inset-0 z-20"
              >
                <span className="absolute left-1/2 top-9 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/45 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur">
                  커플 갤러리 · 지수랑
                </span>
                <div className="absolute inset-x-0 top-[88px] aspect-square">
                  <div className="absolute left-1/3 top-0 h-full w-px bg-white/25" />
                  <div className="absolute left-2/3 top-0 h-full w-px bg-white/25" />
                  <div className="absolute left-0 top-1/3 h-px w-full bg-white/25" />
                  <div className="absolute left-0 top-2/3 h-px w-full bg-white/25" />
                </div>
                <motion.div
                  style={reduce ? undefined : { scale: shutterScale }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2"
                >
                  <span className="flex size-14 items-center justify-center rounded-full border-4 border-white/90">
                    <span className="size-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
                  </span>
                </motion.div>
              </motion.div>
              {/* 플래시 */}
              <motion.div
                style={{ opacity: reduce ? 0 : flash }}
                className="pointer-events-none absolute inset-0 z-30 bg-white"
              />
            </div>
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}

/* ---------- 3. 그룹 갤러리 ---------- */
const GROUPS = [
  { name: '커플', meta: '2명', badge: null, tints: ['bg-amber-400', 'bg-orange-400'] },
  { name: '가족', meta: '5명', badge: '새 사진 12', tints: ['bg-amber-500', 'bg-rose-400', 'bg-orange-300'] },
  { name: '제주 여행 팟', meta: '4명', badge: null, tints: ['bg-orange-400', 'bg-amber-300', 'bg-yellow-400'] }
];

function GroupSection() {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Private groups"
        title="우리끼리만 보는 앨범"
        sub="커플, 가족, 여행 팟. 그룹마다 따로 쌓이는 실시간 갤러리."
      />
      <div className="mx-auto mt-12 flex max-w-lg flex-col gap-4">
        {GROUPS.map((g, i) => (
          <Reveal key={g.name} delay={i * 0.1}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25, ease: EASE }}
              className={`${card} flex items-center justify-between p-4 shadow-sm`}
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {g.tints.map((t) => (
                    <span
                      key={t}
                      className={`size-8 rounded-full ${t} ring-2 ring-white dark:ring-slate-900`}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {g.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {g.meta}
                  </p>
                </div>
              </div>
              {g.badge ? (
                <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-600 ring-1 ring-amber-500/40 dark:text-amber-300">
                  {g.badge}
                </span>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  방금 활동
                </span>
              )}
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- 4. 시그니처 B: 2대 동기화 ---------- */
function SyncSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-120px' });
  const reduce = useReducedMotion();
  const done = reduce ? true : inView;

  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Realtime sync"
        title="내 폰에서 찍으면, 네 폰에 뜬다"
        sub="업로드 버튼도, 전송 버튼도 없습니다. 셔터 한 번이면 끝."
      />
      <div
        ref={ref}
        className="relative mx-auto mt-14 flex max-w-2xl items-end justify-between gap-6 sm:gap-14"
      >
        {/* 점선 비행 경로 */}
        <svg
          viewBox="0 0 100 60"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-2/3 w-full"
          aria-hidden
        >
          <motion.path
            d="M28 42 C 40 12, 60 12, 72 34"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="0.9"
            strokeDasharray="3 3"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={inView || reduce ? { pathLength: 1 } : {}}
            transition={
              reduce ? { duration: 0 } : { delay: 0.6, duration: 0.5 }
            }
          />
        </svg>
        {/* 비행하는 미니 사진 */}
        {!reduce && (
          <motion.div
            initial={{ opacity: 0, left: '26%', top: '38%', scale: 0.6 }}
            animate={
              inView
                ? {
                    opacity: [0, 1, 1, 0],
                    left: ['26%', '45%', '64%'],
                    top: ['38%', '10%', '30%'],
                    scale: [0.6, 1, 0.45]
                  }
                : {}
            }
            transition={{ delay: 0.85, duration: 0.8, ease: 'easeInOut' }}
            className="absolute z-20 overflow-hidden rounded-lg shadow-xl"
          >
            <PhotoVisual className="size-12" />
          </motion.div>
        )}
        {/* 왼쪽 폰: 카메라 */}
        <PhoneFrame className="w-[170px] sm:w-[210px]">
          <div className="relative flex h-full flex-col bg-slate-950">
            <PhotoVisual className="absolute inset-x-0 top-12 aspect-square" />
            <span className="absolute left-1/2 top-8 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/45 px-2 py-0.5 text-[9px] font-semibold text-white">
              내 폰
            </span>
            <motion.div
              animate={done && !reduce ? { scale: [1, 0.78, 1] } : {}}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2"
            >
              <span className="flex size-11 items-center justify-center rounded-full border-[3px] border-white/90">
                <span className="size-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
              </span>
            </motion.div>
          </div>
        </PhoneFrame>
        {/* 오른쪽 폰: 상대 갤러리 */}
        <PhoneFrame className="w-[170px] sm:w-[210px]">
          <div className="relative flex h-full flex-col bg-white pt-8 dark:bg-slate-950">
            <div className="flex items-center justify-between px-3 pb-2">
              <p className="text-[11px] font-bold text-slate-900 dark:text-white">
                지수의 폰
              </p>
              <motion.span
                initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                animate={done ? { opacity: 1, scale: 1 } : {}}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { delay: 1.9, type: 'spring', bounce: 0.5 }
                }
                className="rounded-full bg-amber-500 px-2 py-0.5 text-[8px] font-bold text-white"
              >
                새 사진 1
              </motion.span>
            </div>
            <div className="grid grid-cols-3 gap-1 px-2.5">
              <motion.div
                initial={reduce ? false : { scale: 0 }}
                animate={done ? { scale: 1 } : {}}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { delay: 1.5, type: 'spring', bounce: 0.4 }
                }
                className="aspect-square overflow-hidden rounded-md"
              >
                <PhotoVisual className="size-full" />
              </motion.div>
              {THUMBS.slice(0, 5).map((t) => (
                <div
                  key={t}
                  className={`aspect-square rounded-md bg-gradient-to-br ${t} opacity-60`}
                />
              ))}
            </div>
          </div>
        </PhoneFrame>
      </div>
    </section>
  );
}

/* ---------- 5. 신뢰 ---------- */
const TRUST = [
  { icon: paths.zap, title: '평균 1.2초 업로드', desc: 'Cloudflare R2 미디어 파이프라인으로 찍는 즉시 도착합니다.' },
  { icon: paths.lock, title: '그룹 외 접근 차단', desc: '초대된 멤버만 볼 수 있는 비공개 갤러리. 링크 유출 걱정 없이.' },
  { icon: paths.cloud, title: '원본 화질 그대로', desc: '압축으로 뭉개지지 않는 원본 저장. 추억은 선명해야 하니까.' }
];

function TrustSection() {
  return (
    <section className="px-6 py-24">
      <Head
        eyebrow="Reliability"
        title="가볍고, 빠르고, 안전하게"
        sub="사진 공유 앱이 갖춰야 할 기본기를 서버리스로 단단하게."
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
        {TRUST.map((t, i) => (
          <Reveal key={t.title} delay={i * 0.1}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: EASE }}
              className={`${card} h-full p-6 shadow-sm`}
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Ico className="size-5">{t.icon}</Ico>
              </span>
              <p className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                {t.title}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {t.desc}
              </p>
            </motion.div>
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
    <section
      id="snapmate-register"
      className="relative overflow-hidden px-6 py-28"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/20 blur-3xl" />
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative mx-auto max-w-xl text-center"
      >
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
          <Ico className="size-6">{paths.camera}</Ico>
        </span>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          다음{' '}
          <span className="bg-gradient-to-r from-amber-500 to-orange-400 bg-clip-text text-transparent">
            순간
          </span>
          부터 함께 보세요
        </h2>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          출시되면 가장 먼저 알려드릴게요. 이제 “사진 보내줘”라는 말은 필요
          없습니다.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <AccentButton
            from={project.accent.from}
            to={project.accent.to}
            glow={project.accent.glow}
          >
            출시 알림 받기
          </AccentButton>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            iOS · Android 동시 출시 예정
          </p>
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
            GitHub
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

export default function SnapMateLanding({ project }: { project: Project }) {
  return (
    <div className="overflow-x-clip bg-slate-50 text-slate-900 dark:bg-[#050810] dark:text-white">
      <Hero project={project} />
      <ProblemSection />
      <ShutterScrubSection />
      <GroupSection />
      <SyncSection />
      <TrustSection />
      <FinalCta project={project} />
      <LandingFooter project={project} />
    </div>
  );
}
