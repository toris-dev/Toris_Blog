import About from '@/components/portfolio/About';
import Activity from '@/components/portfolio/Activity';
import Archiving from '@/components/portfolio/Archiving';
import Projects from '@/components/portfolio/Projects';
import Skills from '@/components/portfolio/Skill';
import { Metadata } from 'next';

// 6시간마다 재생성
export const revalidate = 21600;

// 정적 생성 파라미터
export const generateStaticParams = async () => {
  return [{}]; // 파라미터가 없는 페이지
};

export const metadata: Metadata = {
  title: '토리스 포트폴리오 | Next.js 풀스택 개발자',
  description:
    'Next.js와 React를 활용하는 프론트엔드 중심의 풀스택 개발자 토리스의 포트폴리오입니다. 모던 웹 프로젝트와 기술 스택을 확인해보세요.',
  openGraph: {
    title: '토리스 포트폴리오 | Next.js 풀스택 개발자',
    description:
      'Next.js와 React를 활용하는 프론트엔드 중심의 풀스택 개발자 토리스의 포트폴리오입니다. 모던 웹 프로젝트와 기술 스택을 확인해보세요.'
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

export const dynamic = 'force-dynamic';
