'use client';

import { useState } from 'react';
import type { Project } from '@/data/projects';
import { CinematicLanding, SignatureFrame } from './cinematic';
import { cinematicThemes } from './themes';

const steps = ['계약 초안', '모델 서명', '병원 확인', '체결 완료'] as const;

export default function Apps21nLanding({ project }: { project: Project }) {
  const [step, setStep] = useState(0);
  const done = step === steps.length - 1;

  return (
    <CinematicLanding
      project={project}
      eyebrow="CONTRACT OPERATIONS"
      title="서명은 흐르고, 상태는 남습니다"
      thesis="모델과 병원이 같은 계약 상태를 확인하며 초안부터 체결까지 이어가는 역할 기반 운영 플랫폼입니다."
      theme={cinematicThemes['21n-apps']}
      proof={['역할별 계약 흐름', '상태가 보이는 운영', '개인정보 없는 데모']}
      signature={
        <SignatureFrame label="전자계약 진행 데모">
          <ol className="grid gap-3 sm:grid-cols-4">
            {steps.map((label, index) => (
              <li
                key={label}
                className={
                  index <= step
                    ? 'rounded-2xl bg-emerald-400 p-4 text-slate-950'
                    : 'rounded-2xl bg-white/10 p-4'
                }
              >
                <span className="font-mono text-xs">0{index + 1}</span>
                <p
                  aria-current={index === step ? 'step' : undefined}
                  className="mt-2 font-bold"
                >
                  {label}
                </p>
              </li>
            ))}
          </ol>
          <button
            data-testid="contract-advance"
            type="button"
            className="mt-8 min-h-11 rounded-full bg-blue-600 px-6 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            onClick={() => setStep(done ? 0 : step + 1)}
          >
            {done ? '계약 흐름 다시 보기' : '다음 단계 확인'}
          </button>
        </SignatureFrame>
      }
    />
  );
}
