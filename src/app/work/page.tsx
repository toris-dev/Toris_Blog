import {
  StudioPageCanvas,
  StudioPageIntro,
  StudioRouteFooterCta,
  WorkSection
} from '@/components/studio/StudioLanding';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '작업 사례 - 제품 문제부터 운영까지 | TORIS',
  description:
    '웹, 모바일, 데스크톱, AI 자동화 제품을 문제·구현·결과·담당 범위 중심으로 정리한 대표 작업 사례입니다.'
};

export default function WorkPage() {
  return (
    <StudioPageCanvas>
      <StudioPageIntro
        eyebrow="Selected Work"
        title={
          <>
            만든 기술보다{' '}
            <span className="text-[var(--toris-signal-text)]">
              바꾼 흐름을 보여드립니다.
            </span>
          </>
        }
        description="서로 다른 플랫폼의 여섯 작업을 어떤 문제를 읽었고, 무엇을 구현했으며, 어디까지 담당했는지 중심으로 정리했습니다."
      />
      <WorkSection />
      <StudioRouteFooterCta />
    </StudioPageCanvas>
  );
}
