'use client';

import { useState } from 'react';
import type { Project } from '@/data/projects';
import { CinematicLanding, SignatureFrame } from './cinematic';

const phases = ['리시브', '토스', '스파이크'] as const;

export default function VolleyKingLanding({ project }: { project: Project }) {
  const [phase, setPhase] = useState(0);
  const done = phase === phases.length;
  const currentPhase = phases[Math.min(phase, phases.length - 1)];
  const ballPosition =
    phase === 0
      ? 'bottom-6 left-8'
      : phase === 1
        ? 'left-1/2 top-4 -translate-x-1/2'
        : 'right-8 top-1/2 -translate-y-1/2';

  return (
    <CinematicLanding
      project={project}
      eyebrow="THIRTY SECOND RALLY"
      title="세 번의 타이밍, 30초의 랠리"
      thesis="리시브·토스·스파이크의 순간을 연결해 콤보를 쌓는 짧고 선명한 모바일 배구 아케이드입니다."
      theme={{
        background: '#2563EB',
        surface: '#FFF8E6',
        ink: '#172033',
        muted: '#526071',
        accent: '#EF4444',
        accent2: '#FACC15'
      }}
      proof={['30초에 집중', '세 번의 타이밍', 'Flame과 Blender 파이프라인']}
      gallery={[
        {
          src: '/images/projects/volley-king-30/home.png',
          alt: '30초 배구왕 홈 화면',
          portrait: true
        },
        {
          src: '/images/projects/volley-king-30/gameplay.png',
          alt: '30초 배구왕 경기 화면',
          portrait: true
        }
      ]}
      signature={
        <SignatureFrame label="30초 배구 랠리 데모">
          <p className="font-mono text-4xl font-black">00:30</p>
          <div className="relative mt-8 h-52 rounded-3xl bg-[#FFF8E6] text-[#172033]">
            <span
              aria-hidden="true"
              className={`absolute size-12 rounded-full bg-[#FACC15] transition-all ${ballPosition}`}
            />
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 font-black">
              {done ? 'SPIKE!' : currentPhase}
            </p>
          </div>
          <button
            data-testid="volley-hit"
            type="button"
            className="mt-5 min-h-11 rounded-full bg-[#EF4444] px-6 font-bold text-white outline-none focus-visible:ring-4 focus-visible:ring-[#FACC15] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2563EB]"
            onClick={() => setPhase(done ? 0 : phase + 1)}
          >
            {done ? '다시 랠리' : currentPhase}
          </button>
          <p role="status" className="mt-3" aria-live="polite">
            {done ? 'NICE SPIKE · COMBO 3' : `COMBO ${phase}`}
          </p>
        </SignatureFrame>
      }
    />
  );
}
