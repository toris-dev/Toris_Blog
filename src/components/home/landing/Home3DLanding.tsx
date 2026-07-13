'use client';

import type { Home3DLandingData } from './types';
import DeveloperIdentityScene from './scenes/DeveloperIdentityScene';
import FinalCtaScene from './scenes/FinalCtaScene';
import HeroScene from './scenes/HeroScene';
import KnowledgeStatsScene from './scenes/KnowledgeStatsScene';
import ProjectShowcaseScene from './scenes/ProjectShowcaseScene';
import TechOrbitScene from './scenes/TechOrbitScene';

/**
 * 스크롤 기반 3D 포트폴리오 랜딩.
 * 테마 토큰(bg-background/text-foreground 등) 기반 캔버스 위에서 히어로 →
 * 지식베이스 → 개발자 정체성 → 프로젝트 → 스택 → CTA 순으로 각 씬이 스크롤에 반응해
 * 전개된다. 라이트/다크/사이버펑크 테마에 모두 대응하고 reduced-motion을 존중한다.
 */
export default function Home3DLanding({ data }: { data: Home3DLandingData }) {
  return (
    <div className="relative left-1/2 isolate -mb-8 -mt-24 w-screen -translate-x-1/2 overflow-hidden bg-background text-foreground">
      {/* 전역 그리드 오버레이 (장식) — 테마 전경색 기반이라 라이트/다크/사이버펑크 모두 대응 */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        aria-hidden
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground) / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.06) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)'
        }}
      />

      <HeroScene postCount={data.postCount} projectCount={data.projectCount} />
      <KnowledgeStatsScene
        postCount={data.postCount}
        categoryCount={data.categoryCount}
        tagCount={data.tagCount}
        categories={data.categories}
        topTags={data.topTags}
        featuredPosts={data.featuredPosts}
      />
      <DeveloperIdentityScene />
      <ProjectShowcaseScene />
      <TechOrbitScene />
      <FinalCtaScene />
    </div>
  );
}
