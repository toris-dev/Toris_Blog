'use client';

import { useState } from 'react';
import type { Project } from '@/data/projects';
import { CinematicLanding, SignatureFrame } from './cinematic';
import { cinematicThemes } from './themes';

const trail = new Set([6, 7, 8, 13, 18, 17, 16, 11]);
const territory = new Set([6, 7, 8, 11, 12, 13, 16, 17, 18]);

export default function DongnePaintLanding({ project }: { project: Project }) {
  const [captured, setCaptured] = useState(false);

  return (
    <CinematicLanding
      project={project}
      eyebrow="CLOSE THE LOOP"
      title="선을 닫으면, 골목이 내 색이 됩니다"
      thesis="출발 영역으로 돌아오는 경로를 만들고 AI 봇보다 더 넓은 동네를 확보하는 짧고 경쟁적인 영역 점령 게임입니다."
      theme={cinematicThemes['dongne-paint']}
      proof={['닫힌 경로로 점령', 'AI 봇과 경쟁', '기기 안에 저장']}
      gallery={[
        {
          src: '/images/projects/dongne-paint/icon.png',
          alt: '동네 칠하기 대작전 앱 아이콘'
        }
      ]}
      signature={
        <SignatureFrame label="동네 영역 점령 데모">
          <div className="rounded-3xl bg-[#172033] p-5 sm:p-8">
            <div
              role="grid"
              aria-label="5×5 동네 영역"
              className="mx-auto grid max-w-sm grid-cols-5 gap-2"
            >
              {Array.from({ length: 25 }, (_, index) => {
                const secured = captured && territory.has(index);
                const onTrail = !captured && trail.has(index);
                const label = secured
                  ? '확보한 타일'
                  : onTrail
                    ? '경로 타일'
                    : '빈 타일';

                return (
                  <span
                    key={index}
                    role="gridcell"
                    aria-label={label}
                    className={`aspect-square rounded-lg border border-white/10 ${
                      secured
                        ? 'bg-[#18B87A]'
                        : onTrail
                          ? 'bg-[#FF6B4A]'
                          : 'bg-[#66747A]'
                    }`}
                  />
                );
              })}
            </div>
            <button
              data-testid="territory-capture"
              type="button"
              className="mt-6 min-h-11 rounded-full bg-[#FF6B4A] px-6 font-bold text-[#172033] outline-none focus-visible:ring-4 focus-visible:ring-[#FFF3D6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#172033]"
              onClick={() => setCaptured((current) => !current)}
            >
              {captured ? '다시 칠하기' : '경로 닫기'}
            </button>
            <p role="status" className="mt-3 text-[#FFF3D6]">
              {captured ? '영역 9칸 확보' : '경로를 출발 영역에 연결하세요'}
            </p>
          </div>
        </SignatureFrame>
      }
    />
  );
}
