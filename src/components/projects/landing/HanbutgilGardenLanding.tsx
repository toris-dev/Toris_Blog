'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiArrowLeft } from '@react-icons/all-files/fi/FiArrowLeft';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { FiGithub } from '@react-icons/all-files/fi/FiGithub';
import { FiRefreshCw } from '@react-icons/all-files/fi/FiRefreshCw';
import { FiSun } from '@react-icons/all-files/fi/FiSun';
import type { Project } from '@/data/projects';
import { EASE, Reveal } from './shared';

const SOLUTION = [
  0, 5, 6, 7, 8, 3, 4, 9, 14, 13, 12, 11, 10, 15, 20, 21, 16, 17, 22, 23, 18,
  19, 24
];
const ROCKS = new Set([1, 2]);
const END = 24;

const gardenFont = {
  fontFamily:
    '"AppleMyungjo", "Nanum Myeongjo", "Noto Serif KR", ui-serif, serif'
};

function GardenPuzzle({ reduce }: { reduce: boolean }) {
  const [path, setPath] = useState<number[]>([0]);
  const [message, setMessage] = useState('이어진 타일만 눌러 길을 만드세요.');
  const [wrong, setWrong] = useState<number | null>(null);
  const complete = path.length === SOLUTION.length && path.at(-1) === END;
  const nextHint = SOLUTION[path.length];

  const isAdjacent = (from: number, to: number) => {
    const fx = from % 5;
    const fy = Math.floor(from / 5);
    const tx = to % 5;
    const ty = Math.floor(to / 5);
    return Math.abs(fx - tx) + Math.abs(fy - ty) === 1;
  };

  const choose = (cell: number) => {
    if (complete || ROCKS.has(cell)) return;
    const last = path.at(-1) ?? 0;
    const previous = path.at(-2);

    if (cell === previous) {
      setPath((current) => current.slice(0, -1));
      setMessage('한 칸 되돌아왔습니다.');
      return;
    }

    if (!isAdjacent(last, cell) || path.includes(cell)) {
      setWrong(cell);
      setMessage('길은 겹치거나 건너뛸 수 없습니다.');
      window.setTimeout(() => setWrong(null), 420);
      return;
    }

    const next = [...path, cell];
    setPath(next);
    if (cell === END && next.length !== SOLUTION.length) {
      setMessage('도착은 마지막 타일이어야 합니다. 한 칸씩 되돌아가 보세요.');
    } else if (next.length === SOLUTION.length && cell === END) {
      setMessage('정원이 하나의 길로 이어졌습니다.');
    } else {
      setMessage(`${SOLUTION.length - next.length}칸 남았습니다.`);
    }
  };

  const reset = () => {
    setPath([0]);
    setMessage('이어진 타일만 눌러 길을 만드세요.');
  };

  return (
    <div className="rounded-[2rem] border border-[#31542b]/15 bg-[#fffaf0]/90 p-4 shadow-[0_24px_70px_rgba(58,82,36,0.18)] backdrop-blur-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#7b765f]">
            작은 정원 · 연습 문제
          </p>
          <p className="mt-1 text-sm font-semibold text-[#254826]">
            모든 빈칸을 한 번씩
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="flex size-10 items-center justify-center rounded-full border border-[#31542b]/15 text-[#31542b] transition hover:bg-[#31542b]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5f8f2b]"
          aria-label="퍼즐 다시 시작"
        >
          <FiRefreshCw aria-hidden />
        </button>
      </div>

      <motion.div
        animate={
          wrong !== null && !reduce ? { x: [-4, 4, -3, 3, 0] } : undefined
        }
        className="mt-5 grid grid-cols-5 gap-1.5 rounded-2xl border border-[#927f58]/20 bg-[#e9dfc2] p-2.5 shadow-inner"
      >
        {Array.from({ length: 25 }, (_, cell) => {
          const order = path.indexOf(cell);
          const visited = order >= 0;
          const isRock = ROCKS.has(cell);
          const isStart = cell === 0;
          const isEnd = cell === END;
          const hinted = !complete && cell === nextHint;
          return (
            <motion.button
              key={cell}
              type="button"
              onClick={() => choose(cell)}
              whileTap={reduce || isRock ? undefined : { scale: 0.92 }}
              disabled={isRock}
              aria-label={
                isRock
                  ? `장애물 ${cell + 1}`
                  : isStart
                    ? '출발점'
                    : isEnd
                      ? '도착점'
                      : `정원 타일 ${cell + 1}`
              }
              className={`relative aspect-square overflow-hidden rounded-[10px] border transition focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#507827] ${
                isRock
                  ? 'cursor-not-allowed border-[#776c55]/20 bg-[#b8ad91]'
                  : visited
                    ? 'border-[#567d2c] bg-[#83aa3e] text-white shadow-[inset_0_-4px_0_rgba(47,82,27,0.2)]'
                    : 'border-[#b8a97f]/35 bg-[#fffaf0] hover:bg-[#f5f0df]'
              } ${wrong === cell ? 'ring-2 ring-[#ff7657]' : ''}`}
            >
              {isRock ? (
                <span className="absolute inset-[24%] rotate-12 rounded-[45%_55%_42%_58%] bg-[#817762] shadow-[inset_-3px_-4px_0_rgba(70,64,51,0.2)]" />
              ) : visited ? (
                <span className="flex size-full items-center justify-center text-[10px] font-bold sm:text-xs">
                  {isStart ? '시작' : isEnd ? <FiCheck /> : order + 1}
                </span>
              ) : isEnd ? (
                <span className="absolute inset-[27%] rounded-full border-[3px] border-[#ff7657] bg-white" />
              ) : (
                <span
                  aria-hidden
                  className={`absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d9cfb2] transition ${hinted ? 'animate-pulse bg-[#7fa33a] shadow-[0_0_0_5px_rgba(127,163,58,0.12)]' : ''}`}
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>

      <div className="mt-4 min-h-8 text-center text-xs text-[#68634f]">
        <AnimatePresence mode="wait">
          <motion.p
            key={message}
            initial={reduce ? false : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={complete ? 'font-semibold text-[#4c7724]' : undefined}
          >
            {message}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

function FallingPetals({ reduce }: { reduce: boolean }) {
  const petals = useMemo(
    () => [
      { left: '8%', delay: 0, duration: 10 },
      { left: '28%', delay: 3, duration: 13 },
      { left: '54%', delay: 1, duration: 11 },
      { left: '78%', delay: 5, duration: 14 },
      { left: '92%', delay: 2, duration: 12 }
    ],
    []
  );
  if (reduce) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {petals.map((petal, index) => (
        <motion.span
          key={petal.left}
          className="absolute -top-4 h-2.5 w-4 rounded-[70%_30%_70%_30%] bg-[#ff9e87]/70"
          style={{ left: petal.left }}
          animate={{
            y: ['0vh', '105vh'],
            x: [0, 34, -18],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
}

export default function HanbutgilGardenLanding({
  project
}: {
  project: Project;
}) {
  const reduce = useReducedMotion() ?? false;

  return (
    <div className="min-h-dvh overflow-x-clip bg-[#fff9e8] pt-24 text-[#244523] selection:bg-[#a9c95e] selection:text-[#183518]">
      <section className="relative overflow-hidden px-5 pb-20 pt-12 sm:pb-28 sm:pt-16">
        <div
          aria-hidden
          className="absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(92,112,55,0.16)_0.7px,transparent_0.7px)] [background-size:7px_7px]"
        />
        <div
          aria-hidden
          className="absolute -left-48 top-12 size-[30rem] rounded-full bg-[#b9d56d]/25 blur-[100px]"
        />
        <div
          aria-hidden
          className="absolute -right-40 top-1/3 size-[28rem] rounded-full bg-[#ffd597]/30 blur-[100px]"
        />
        <FallingPetals reduce={reduce} />

        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-sm text-[#5f684e] transition hover:text-[#244523]"
            >
              <FiArrowLeft aria-hidden /> 모든 프로젝트
            </Link>
          </motion.div>

          <div className="mt-10 grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.65, ease: EASE }}
                className="inline-flex items-center gap-2 rounded-full border border-[#5f8f2b]/20 bg-white/55 px-4 py-2 text-xs font-semibold text-[#496b2a] backdrop-blur-sm"
              >
                <FiSun aria-hidden /> 온라인 한붓그리기 논리 퍼즐
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.75, ease: EASE }}
                className="mt-7 text-5xl font-semibold leading-[1.04] tracking-[-0.05em] text-[#1d421f] sm:text-7xl"
                style={gardenFont}
              >
                길은 하나,
                <span className="block text-[#658f2c]">생각은 여러 갈래.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.7, ease: EASE }}
                className="mt-7 max-w-xl text-lg leading-8 text-[#59634d]"
              >
                돌은 피하고, 빈 타일은 남기지 않고. 한 번 그은 초록 길로 정원
                전체를 조용히 완성하세요.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.65, ease: EASE }}
                className="mt-9 flex flex-wrap gap-3"
              >
                <a
                  href="#play"
                  className="inline-flex h-12 items-center rounded-full bg-[#315d2d] px-7 text-sm font-bold text-white shadow-[0_14px_40px_rgba(49,93,45,0.22)] transition hover:-translate-y-0.5 hover:bg-[#274f25]"
                >
                  작은 정원 풀기
                </a>
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-[#315d2d]/20 bg-white/55 px-7 text-sm font-semibold text-[#315d2d] transition hover:bg-white"
                >
                  <FiGithub aria-hidden /> GitHub
                </a>
              </motion.div>
            </div>

            <motion.div
              id="play"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.9, ease: EASE }}
              className="scroll-mt-28"
            >
              <GardenPuzzle reduce={reduce} />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:pb-32">
        <Reveal className="mx-auto max-w-6xl">
          <div className="relative aspect-[2/1] overflow-hidden rounded-[2rem] border border-[#31542b]/10 bg-[#e7edbd] shadow-[0_26px_80px_rgba(58,82,36,0.16)]">
            <Image
              src="/images/projects/hanbutgil-garden.png"
              alt="꽃과 돌이 놓인 한붓길 정원 퍼즐 일러스트"
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover"
            />
          </div>
        </Reveal>
      </section>

      <section className="border-y border-[#31542b]/10 bg-[#f4efda] px-5 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#778062]">
              정원의 규칙
            </p>
            <h2
              className="mt-4 text-3xl font-semibold tracking-tight text-[#244523] sm:text-5xl"
              style={gardenFont}
            >
              설명은 짧게, 고민은 깊게.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-3">
            {[
              [
                '이어 그리기',
                '지금 선이 끝난 타일과 맞닿은 곳으로만 이동합니다. 건너뛰기는 없습니다.'
              ],
              [
                '한 번만 지나기',
                '이미 지나온 길은 다시 밟지 않습니다. 되돌리려면 바로 전 칸을 누릅니다.'
              ],
              [
                '마지막에 도착하기',
                '모든 빈 타일을 채운 뒤 산호빛 도착점에 닿으면 정원이 완성됩니다.'
              ]
            ].map(([title, text], index) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.65, ease: EASE }}
                className="border-t border-[#31542b]/20 pt-6"
              >
                <span className="font-mono text-xs text-[#8f876b]">
                  {['출발', '진행', '완성'][index]}
                </span>
                <h3 className="mt-4 text-xl font-bold text-[#2d522b]">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#626553]">{text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-5 py-28 text-center sm:py-36">
        <FallingPetals reduce={reduce} />
        <Reveal className="relative mx-auto max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#7d8066]">
            잠깐 쉬어가는 퍼즐
          </p>
          <h2
            className="mt-5 text-4xl font-semibold tracking-tight text-[#214622] sm:text-6xl"
            style={gardenFont}
          >
            다음 길은, 손끝에서 시작됩니다.
          </h2>
          <p className="mx-auto mt-6 max-w-xl leading-7 text-[#626553]">
            짧은 규칙 하나로 오래 생각하게 만드는 정원을 계속 가꾸고 있습니다.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#315d2d] px-7 text-sm font-bold text-white transition hover:-translate-y-0.5"
            >
              <FiGithub /> 프로젝트 보기
            </a>
            <Link
              href="/projects"
              className="inline-flex h-12 items-center rounded-full border border-[#315d2d]/20 bg-white/55 px-7 text-sm font-semibold text-[#315d2d] transition hover:bg-white"
            >
              다른 프로젝트
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
