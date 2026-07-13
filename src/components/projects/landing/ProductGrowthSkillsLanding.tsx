'use client';

import { useState } from 'react';
import type { Project } from '@/data/projects';
import { CinematicLanding, SignatureFrame } from './cinematic';

const routes = [
  ['검색 노출 개선', 'seo-geo-optimizer'],
  ['스토어 등록 준비', 'app-store-listing-creator'],
  ['Expo 인터랙션', 'expo-interactive-design'],
  ['Flutter 인터랙션', 'flutter-interactive-design'],
  ['Expo Android 성능', 'expo-android-performance'],
  ['Flutter Android 성능', 'flutter-android-performance']
] as const;

export default function ProductGrowthSkillsLanding({
  project
}: {
  project: Project;
}) {
  const [selected, setSelected] = useState(0);

  return (
    <CinematicLanding
      project={project}
      eyebrow="EVIDENCE-DRIVEN AGENTS"
      title="성장 목표를, 검증 가능한 워크플로로"
      thesis="SEO·스토어 등록·모바일 인터랙션·Android 성능 작업을 증거 수집부터 검증까지 안내하는 6개 오픈소스 에이전트 스킬입니다."
      theme={{
        background: '#111827',
        surface: '#1F2937',
        ink: '#F9FAFB',
        muted: '#A7B0C0',
        accent: '#8B5CF6',
        accent2: '#38BDF8'
      }}
      proof={['6개 전문 워크플로', '검증 가능한 실행', 'Codex와 Claude에 설치']}
      signature={
        <SignatureFrame label="제품 성장 스킬 라우터">
          <div className="grid gap-3 sm:grid-cols-2">
            {routes.map(([goal], index) => {
              const active = selected === index;

              return (
                <button
                  key={goal}
                  data-testid={index === 0 ? 'skill-goal-search' : undefined}
                  type="button"
                  aria-pressed={active}
                  className={
                    active
                      ? 'min-h-11 rounded-2xl bg-violet-500 px-4 py-3 text-left font-bold outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900'
                      : 'min-h-11 rounded-2xl bg-white/10 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900'
                  }
                  onClick={() => setSelected(index)}
                >
                  {goal}
                </button>
              );
            })}
          </div>
          <article
            role="status"
            className="mt-6 rounded-2xl border border-sky-400/40 bg-sky-400/10 p-5"
          >
            <p className="font-mono text-sky-300">{routes[selected][1]}</p>
            <p className="mt-3 font-semibold">증거 수집 → 실행 → 검증</p>
          </article>
        </SignatureFrame>
      }
    />
  );
}
