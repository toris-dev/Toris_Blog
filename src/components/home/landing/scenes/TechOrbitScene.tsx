'use client';

import { useState } from 'react';
import { techStack } from '../content';
import { Reveal, SceneHeading, TechIcon } from '../ui';

export default function TechOrbitScene() {
  const [active, setActive] = useState(0);
  const activeNode = techStack[active];

  // 원형 배치 좌표 (각도 기반, 결정적 → SSR 안전)
  const positions = techStack.map((_, i) => {
    const angle = (i / techStack.length) * Math.PI * 2 - Math.PI / 2;
    return {
      left: `${50 + Math.cos(angle) * 42}%`,
      top: `${50 + Math.sin(angle) * 42}%`
    };
  });

  const NodeButton = ({
    i,
    className,
    style
  }: {
    i: number;
    className?: string;
    style?: React.CSSProperties;
  }) => {
    const node = techStack[i];
    const isActive = i === active;
    return (
      <button
        type="button"
        onMouseEnter={() => setActive(i)}
        onFocus={() => setActive(i)}
        onClick={() => setActive(i)}
        aria-pressed={isActive}
        aria-label={`${node.name} — ${node.blurb}`}
        style={style}
        className={
          'group inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 ' +
          (isActive
            ? 'border-indigo-400/60 bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/20 '
            : 'border-white/10 bg-slate-900/70 text-slate-300 hover:border-white/25 hover:text-white ') +
          (className ?? '')
        }
      >
        <TechIcon icon={node.icon} className="size-4" />
        <span>{node.name}</span>
      </button>
    );
  };

  return (
    <section
      className="relative px-4 py-24 sm:py-32"
      aria-label="기술 스택"
      style={{ perspective: '1000px' }}
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SceneHeading
            eyebrow="Tech Stack"
            title={<>궤도를 도는 핵심 스택</>}
            description="노드에 마우스를 올리거나 포커스하면 각 기술을 어떻게 쓰는지 볼 수 있어요."
          />
        </Reveal>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2">
          {/* 궤도 (데스크톱) */}
          <div className="relative mx-auto hidden aspect-square w-full max-w-md sm:block">
            {/* 회전하는 장식 링 (reduced-motion이면 정지) */}
            <div
              className="absolute inset-4 rounded-full border border-dashed border-white/10 motion-safe:animate-[spin_50s_linear_infinite]"
              aria-hidden
            />
            <div
              className="absolute inset-16 rounded-full border border-white/5 motion-safe:animate-[spin_36s_linear_infinite_reverse]"
              aria-hidden
            />
            {/* 중심 코어 */}
            <div className="absolute left-1/2 top-1/2 flex size-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-indigo-400/30 bg-indigo-500/10 text-center backdrop-blur">
              <TechIcon icon={activeNode.icon} className="size-8 text-indigo-200" />
              <span className="mt-1 px-1 text-xs font-bold text-white">
                {activeNode.name}
              </span>
            </div>
            {/* 노드 */}
            {techStack.map((_, i) => (
              <NodeButton
                key={i}
                i={i}
                className="absolute -translate-x-1/2 -translate-y-1/2 motion-safe:animate-none"
                style={positions[i]}
              />
            ))}
          </div>

          {/* 노드 그리드 (모바일) */}
          <div className="flex flex-wrap justify-center gap-2 sm:hidden">
            {techStack.map((_, i) => (
              <NodeButton key={i} i={i} />
            ))}
          </div>

          {/* 활성 노드 설명 */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-200">
                <TechIcon icon={activeNode.icon} className="size-6" />
              </span>
              <h3 className="text-2xl font-bold text-white">{activeNode.name}</h3>
            </div>
            <p
              className="mt-4 min-h-14 text-base leading-relaxed text-slate-300"
              aria-live="polite"
            >
              {activeNode.blurb}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {techStack.map((t, i) => (
                <button
                  key={t.name}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className={
                    'h-1.5 rounded-full transition-all ' +
                    (i === active ? 'w-6 bg-indigo-400' : 'w-1.5 bg-white/20 hover:bg-white/40')
                  }
                  aria-label={`${t.name} 설명 보기`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
