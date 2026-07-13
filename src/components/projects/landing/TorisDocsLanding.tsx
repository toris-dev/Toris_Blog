'use client';

import { useState } from 'react';
import type { Project } from '@/data/projects';
import { CinematicLanding, SignatureFrame } from './cinematic';

const nodes = ['INBOX', 'PROJECTS', 'WIKI', 'OUTPUT'] as const;

export default function TorisDocsLanding({ project }: { project: Project }) {
  const [selected, setSelected] = useState<(typeof nodes)[number]>('INBOX');
  const connected = selected === 'PROJECTS';

  return (
    <CinematicLanding
      project={project}
      eyebrow="NOTES INTO SYSTEMS"
      title="기록은 쌓이지 않고, 다음 행동으로 연결됩니다"
      thesis="프로젝트 문맥과 개발 지식, 산출물을 연결해 사람과 에이전트가 같은 흐름에서 일하도록 돕는 문서 시스템입니다."
      theme={{
        background: '#20242C',
        surface: '#2B303A',
        ink: '#F7F3E8',
        muted: '#B8B3A8',
        accent: '#22B8CF',
        accent2: '#7C6EE6'
      }}
      proof={[
        '프로젝트별 문맥',
        '기록에서 산출물까지',
        '공개 경계를 지키는 구조'
      ]}
      signature={
        <SignatureFrame label="지식 그래프 데모">
          <svg
            aria-hidden="true"
            viewBox="0 0 600 220"
            className="absolute inset-x-8 top-20"
          >
            <path
              d="M80 110L250 50L410 110L540 50"
              fill="none"
              stroke="#59606C"
              strokeWidth="6"
            />
            {connected ? (
              <path
                d="M250 50L410 110L540 50"
                fill="none"
                stroke="#22B8CF"
                strokeWidth="6"
              />
            ) : null}
            <path
              d="M250 50L540 180"
              fill="none"
              stroke={connected ? '#7C6EE6' : '#59606C'}
              strokeWidth="6"
            />
          </svg>
          <div className="relative grid min-h-64 grid-cols-2 place-items-center gap-16 sm:grid-cols-4">
            {nodes.map((node) => (
              <button
                key={node}
                data-testid={
                  node === 'PROJECTS' ? 'knowledge-node-projects' : undefined
                }
                type="button"
                aria-pressed={selected === node}
                className={
                  selected === node
                    ? 'min-h-11 rounded-full bg-cyan-500 px-5 font-mono font-bold text-slate-950 outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300'
                    : 'min-h-11 rounded-full bg-white/10 px-5 font-mono outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300'
                }
                onClick={() => setSelected(node)}
              >
                {node}
              </button>
            ))}
          </div>
          <p role="status" className="mt-5 text-center">
            {connected ? 'PROJECTS → WIKI → OUTPUT 연결' : `${selected} 선택됨`}
          </p>
        </SignatureFrame>
      }
    />
  );
}
