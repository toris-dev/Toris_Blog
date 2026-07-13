'use client';

import { useState } from 'react';
import type { Project } from '@/data/projects';
import { CinematicLanding, SignatureFrame } from './cinematic';
import { cinematicThemes } from './themes';

export default function StarlightGreenhouseLanding({
  project
}: {
  project: Project;
}) {
  const [dust, setDust] = useState(0);
  const unlocked = dust === 3;

  return (
    <CinematicLanding
      project={project}
      eyebrow="IDLE UNDER THE STARS"
      title="별씨앗 하나가, 온실의 밤을 밝힙니다"
      thesis="별가루를 모아 설비를 열고 천천히 생산을 키우는 로컬 저장 기반의 작은 방치형 성장 게임입니다."
      theme={cinematicThemes['starlight-greenhouse']}
      proof={[
        '탭으로 시작하는 성장',
        '설비로 이어지는 생산',
        '최대 8시간 오프라인 보상'
      ]}
      gallery={[
        {
          src: '/images/projects/starlight-greenhouse/icon.png',
          alt: '별빛 온실 앱 아이콘'
        }
      ]}
      signature={
        <SignatureFrame label="별씨앗 성장 데모">
          <div
            aria-hidden="true"
            className={
              unlocked
                ? 'mx-auto grid size-40 place-items-center rounded-full bg-cyan-300 text-7xl shadow-[0_0_90px_#74D9E8]'
                : 'mx-auto grid size-40 place-items-center rounded-full bg-violet-950 text-6xl'
            }
          >
            {unlocked ? '🌱' : '✦'}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              data-testid="seed-grow"
              type="button"
              className="min-h-11 rounded-full bg-violet-500 px-6 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
              onClick={() => setDust((current) => Math.min(3, current + 1))}
            >
              별씨앗 돌보기
            </button>
            <button
              type="button"
              className="min-h-11 rounded-full border border-white/40 px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
              onClick={() => setDust(0)}
            >
              초기화
            </button>
          </div>
          <p role="status" className="mt-4 text-center font-bold">
            {unlocked ? '별가루 3 · 새싹 조명 해금' : `별가루 ${dust}`}
          </p>
          <div className="mt-2 space-y-1 text-center text-[var(--cinema-page-muted)]">
            {unlocked ? <p>초당 +1</p> : null}
            <p>오프라인 보상 최대 8시간</p>
          </div>
        </SignatureFrame>
      }
    />
  );
}
