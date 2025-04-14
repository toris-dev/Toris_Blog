import About from '@/components/portfolio/About';
import Activity from '@/components/portfolio/Activity';
import Archiving from '@/components/portfolio/Archiving';
import Projects from '@/components/portfolio/Projects';
import Skills from '@/components/portfolio/Skill';
import { Metadata } from 'next';

// 6시간마다 재생성
export const revalidate = 60 * 60 * 6;

// 정적 생성 파라미터
export const generateStaticParams = async () => {
  return [{}]; // 파라미터가 없는 페이지
};

export const metadata: Metadata = {
  title: '토리스 포트폴리오',
  description:
    '웹 개발자 토리스의 포트폴리오입니다. 프로젝트, 스킬, 아카이빙을 확인해보세요.',
  openGraph: {
    title: '토리스 포트폴리오',
    description:
      '웹 개발자 토리스의 포트폴리오입니다. 프로젝트, 스킬, 아카이빙을 확인해보세요.'
  }
};

export default function Portfolio() {
  return (
    <div className="m-0 flex size-full min-h-screen flex-col items-center justify-center p-0 text-black dark:text-white">
      <hr className="w-full rounded-sm border border-purple-300 dark:border-purple-500" />
      <About />
      <hr className="w-full rounded-sm border border-purple-300 dark:border-purple-500" />
      <Skills />
      <hr className="w-full rounded-sm border border-purple-300 dark:border-purple-500" />
      <Archiving />
      <hr className="w-full rounded-sm border border-purple-300 dark:border-purple-500" />
      <Projects />
      <hr className="w-full rounded-sm border border-purple-300 dark:border-purple-500" />
      <Activity />
    </div>
  );
}

// 동적 렌더링 설정을 제거하고 정적 생성으로 변경
// export const dynamic = 'force-dynamic';
