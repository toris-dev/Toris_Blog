'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { FaArrowRight, HiBriefcase } from '@/components/icons';
import { career } from '../content';
import { EASE } from '../shared';
import { Chip, Reveal, SceneHeading, TechIcon } from '../ui';

export default function CareerArchitectureScene() {
  const reduce = useReducedMotion();

  return (
    <section
      className="relative px-4 py-24 sm:py-32"
      aria-label="풀스택 커리어"
      style={{ perspective: '1400px' }}
    >
      {/* 은은한 상단 구분 글로우 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-fuchsia-600/10 to-transparent" />

      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SceneHeading
            eyebrow="Full-Stack Work"
            title={
              <>
                <span className="text-fuchsia-300">{career.org}</span> — 앱부터
                인프라까지
              </>
            }
            description={career.summary}
          />
        </Reveal>

        <Reveal className="mt-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-sm font-semibold text-fuchsia-200">
            <HiBriefcase className="size-4" />
            {career.role}
          </span>
          <span className="text-sm text-slate-400">{career.headline}</span>
        </Reveal>

        {/* 아키텍처 흐름 */}
        <div className="mt-14 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-2">
          {career.layers.map((layer, i) => (
            <div
              key={layer.title}
              className="flex flex-1 items-center gap-4 lg:flex-col lg:gap-2"
            >
              <motion.div
                initial={{ opacity: 0, y: reduce ? 0 : 28, rotateX: reduce ? 0 : -8 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={reduce ? { duration: 0 } : { duration: 0.55, delay: i * 0.1, ease: EASE }}
                className="group relative w-full flex-1 rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-xl transition-colors [transform-style:preserve-3d] hover:border-indigo-400/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                    <TechIcon icon={layer.icon} className="size-5" />
                  </span>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Layer {i + 1}
                    </div>
                    <h3 className="text-base font-bold text-white">{layer.title}</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  {layer.detail}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {layer.stack.map((s) => (
                    <Chip key={s}>{s}</Chip>
                  ))}
                </div>
              </motion.div>

              {/* 연결 화살표 (마지막 제외) */}
              {i < career.layers.length - 1 && (
                <FaArrowRight
                  className="size-4 shrink-0 rotate-90 text-indigo-400/60 lg:rotate-0"
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
