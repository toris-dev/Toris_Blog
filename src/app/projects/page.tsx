import type { Metadata } from 'next';
import ProjectsLanding from '@/components/projects/ProjectsLanding';

export const metadata: Metadata = {
  title: '프로젝트 | Toris Blog',
  description:
    '모바일 제품과 게임부터 AI 자동화, Web3, 지식 시스템과 에이전트 스킬까지 — 토리스의 인터랙티브 프로젝트 쇼케이스.',
  openGraph: {
    title: '프로젝트 | Toris Blog',
    description:
      '아이디어를 실험하고 제품으로 만듭니다. 토리스의 개인 프로젝트 쇼케이스.',
    type: 'website'
  }
};

export default function ProjectsPage() {
  return <ProjectsLanding />;
}
