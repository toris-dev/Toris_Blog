'use client';

import { useState } from 'react';
import type { Project } from '@/data/projects';
import { CinematicLanding, SignatureFrame } from './cinematic';

export default function BubbleBibleLanding({ project }: { project: Project }) {
  const [complete, setComplete] = useState(false);

  return (
    <CinematicLanding
      project={project}
      eyebrow="READ · REFLECT · SHARE"
      title="오늘의 말씀에서, 함께하는 습관으로"
      thesis="읽기와 묵상 기록을 교회와 소그룹의 나눔으로 잇는 모바일 중심 성경 경험입니다."
      theme={{
        background: '#FFF8E7',
        surface: '#F4E8CC',
        ink: '#4A3326',
        muted: '#806B58',
        accent: '#C99A36',
        accent2: '#7393B3'
      }}
      proof={['매일 이어지는 읽기', '개인 묵상 기록', '교회·소그룹 연결']}
      gallery={[
        {
          src: '/images/projects/bubble-bible/feature.png',
          alt: 'Bubble Bible 브랜드 소개 화면'
        },
        {
          src: '/images/projects/bubble-bible/icon.png',
          alt: 'Bubble Bible 앱 아이콘'
        }
      ]}
      signature={
        <SignatureFrame label="오늘의 읽기 데모">
          <article className="mx-auto max-w-lg rounded-[2rem] bg-[#FFFDF7] p-8 text-[#4A3326] shadow-2xl">
            <p className="text-xs tracking-[.2em]">TODAY</p>
            <h2 className="mt-6 font-serif text-3xl">
              오늘의 말씀을 천천히 읽어 보세요.
            </h2>
            <button
              data-testid="bible-complete"
              type="button"
              disabled={complete}
              className="mt-8 min-h-11 rounded-full bg-[#C99A36] px-6 font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A3326] disabled:opacity-60"
              onClick={() => setComplete(true)}
            >
              {complete ? '읽기 완료됨' : '읽기 완료'}
            </button>
            <p role="status" className="mt-4 font-semibold">
              {complete ? '오늘의 읽기 완료 · 7일 연속' : '읽기 전'}
            </p>
            <button
              type="button"
              disabled={!complete}
              className="mt-3 min-h-11 rounded-full border border-[#7393B3] px-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A3326] disabled:opacity-40"
            >
              소그룹에 나누기
            </button>
          </article>
        </SignatureFrame>
      }
    />
  );
}
