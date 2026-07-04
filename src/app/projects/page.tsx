import type { Metadata } from 'next';
import ProjectsLanding from '@/components/projects/ProjectsLanding';

export const metadata: Metadata = {
  title: '프로젝트 | Toris Blog',
  description:
    '여행 플랫폼부터 데스크톱 도구, AI 파이프라인, Web3까지 — 토리스의 개인 프로젝트 쇼케이스.',
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
