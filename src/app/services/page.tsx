import {
  ServicesSection,
  StudioPageCanvas,
  StudioPageIntro,
  StudioRouteFooterCta
} from '@/components/studio/StudioLanding';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '서비스 - 웹·앱·데스크톱·MVP 개발 | TORIS',
  description:
    '웹 서비스, 모바일 앱, 데스크톱 제품, MVP와 AI 자동화를 제품 단위로 설계하고 개발합니다.'
};

export default function ServicesPage() {
  return (
    <StudioPageCanvas>
      <StudioPageIntro
        eyebrow="Services"
        title={
          <>
            화면만이 아니라{' '}
            <span className="text-[var(--toris-signal-text)]">
              운영되는 제품을 만듭니다.
            </span>
          </>
        }
        description="아이디어와 업무 맥락을 읽고, 사용자 경험부터 API·데이터·배포까지 필요한 범위를 하나의 제품으로 연결합니다."
      />
      <ServicesSection />
      <StudioRouteFooterCta />
    </StudioPageCanvas>
  );
}
