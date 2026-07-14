import {
  ProcessSection,
  StudioPageCanvas,
  StudioPageIntro,
  StudioRouteFooterCta
} from '@/components/studio/StudioLanding';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '진행 방식 - 상담부터 배포와 운영까지 | TORIS',
  description:
    '상담, 제품 설계, 개발과 공유, 출시와 운영으로 이어지는 TORIS의 제품 개발 진행 방식입니다.'
};

export default function ProcessPage() {
  return (
    <StudioPageCanvas>
      <StudioPageIntro
        eyebrow="Process"
        title={
          <>
            빠르게 만들되{' '}
            <span className="text-[var(--toris-signal-text)]">
              결정은 생략하지 않습니다.
            </span>
          </>
        }
        description="작업의 현재 상태와 다음 산출물을 함께 공유합니다. 진행 과정이 보이면 일정과 품질을 더 정확하게 판단할 수 있습니다."
      />
      <ProcessSection />
      <StudioRouteFooterCta />
    </StudioPageCanvas>
  );
}
