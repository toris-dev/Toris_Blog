'use client';

import type { Home3DLandingData } from './types';
import CareerArchitectureScene from './scenes/CareerArchitectureScene';
import FinalCtaScene from './scenes/FinalCtaScene';
import HeroScene from './scenes/HeroScene';
import KnowledgeStatsScene from './scenes/KnowledgeStatsScene';
import ProjectShowcaseScene from './scenes/ProjectShowcaseScene';
import TechOrbitScene from './scenes/TechOrbitScene';

/**
 * 스크롤 기반 3D 포트폴리오 랜딩.
 * 다크 캔버스 위에서 히어로 → 지식베이스 → 커리어 → 프로젝트 → 스택 → CTA 순으로
 * 각 씬이 스크롤에 반응해 깊이감 있게 전개된다. 모든 모션은 reduced-motion을 존중한다.
 */
export default function Home3DLanding({ data }: { data: Home3DLandingData }) {
  return (
    <div className="relative left-1/2 isolate -mb-8 -mt-24 w-screen -translate-x-1/2 overflow-hidden bg-[#070713] text-white">
      {/* 전역 그리드 오버레이 (장식) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-35"
        aria-hidden
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
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
      <CareerArchitectureScene />
      <ProjectShowcaseScene />
      <TechOrbitScene />
      <FinalCtaScene />
    </div>
  );
}
