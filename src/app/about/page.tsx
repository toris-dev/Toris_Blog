import {
  AiFillGithub,
  FaDiscord,
  FaServer,
  FaTwitter
} from '@/components/icons';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '소개 - Toris Dev Blog',
  description:
    '블로그와 개발자 소개 페이지입니다. 블로그 운영 목적과 개발자 프로필을 확인하세요.',
  alternates: {
    canonical: 'https://toris-dev.vercel.app/about'
  }
};

export default function AboutPage() {
  // 기술 스택 리스트
  const skills = [
    {
      category: 'Frontend',
      technologies: [
        'React',
        'Next.js',
        'TypeScript',
        'Tailwind CSS',
        'Framer Motion',
        'Redux'
      ]
    },
    {
      category: 'Backend',
      technologies: [
        'Node.js',
        'Express',
        'NestJS',
        'MongoDB',
        'PostgreSQL',
        'Supabase'
      ]
    },
    {
      category: 'DevOps & Tools',
      technologies: [
        'Git',
        'Docker',
        'AWS',
        'CI/CD',
        'Vercel',
        'Jest',
        'Cypress'
      ]
    },
    {
      category: 'Web3 (부수적)',
      technologies: ['Solidity', 'Ethers.js', 'IPFS', 'Smart Contracts']
    }
  ];

  // 경력 정보
  const experiences = [
    {
      period: '2022 - 현재',
      company: 'Frontend Studio',
      role: '시니어 프론트엔드 개발자',
      description: 'Next.js, React 기반 웹 애플리케이션 개발 및 프로젝트 리드'
    },
    {
      period: '2020 - 2022',
      company: 'Tech Innovators',
      role: '풀스택 개발자',
      description: 'React 기반 웹 애플리케이션 및 Node.js 백엔드 서비스 개발'
    },
    {
      period: '2018 - 2020',
      company: 'Digital Solutions',
      role: '프론트엔드 개발자',
      description: '반응형 웹사이트 및 UI/UX 구현, JavaScript 프레임워크 활용'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-12">
        <div className="space-y-6 text-center">
          <h1 className="gradient-text text-4xl font-bold sm:text-5xl">
            Toris Dev Blog 소개
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-content/80 dark:text-content-dark/90">
            웹 개발과 AI 생산성 도구에 관한 경험과 지식을 공유하는 기술
            블로그입니다
          </p>
        </div>

        {/* 블로그 소개 섹션 */}
        <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-bkg-dark">
          <h2 className="mb-6 text-2xl font-bold text-content dark:text-content-dark">
            <span className="mr-2">📝</span>
            블로그 소개
          </h2>
          <div className="space-y-4 text-content/80 dark:text-content-dark/90">
            <p>
              Toris Dev Blog는 웹 개발, 프론트엔드 기술, 생산성 도구에 관한
              경험과 지식을 공유하기 위해 만들어졌습니다. 특히 Next.js, React,
              TypeScript를 중심으로 한 현대적인 웹 개발 방법론과 도구를
              다룹니다.
            </p>
            <p>
              이 블로그는 개발자들이 실전에서 마주하는 다양한 문제들과 그 해결
              방법, 그리고 효율적인 코딩 패턴을 공유하는 것을 목표로 합니다.
              또한 AI 기반 도구를 활용한 개발 생산성 향상 방법에 대해서도 깊이
              있게 다룹니다.
            </p>
            <p>
              Next.js, Supabase, Tailwind CSS, TypeScript를 주요 기술 스택으로
              사용하고 있으며, 블로그 자체도 이러한 기술들로 구현되어 있습니다.
            </p>
          </div>
        </section>

        {/* 운영자 소개 */}
        <section className="rounded-2xl bg-white p-8 shadow-sm dark:bg-bkg-dark">
          <h2 className="mb-6 text-2xl font-bold text-content dark:text-content-dark">
            <span className="mr-2">👨‍💻</span>
            운영자 소개
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center justify-center md:col-span-1">
              <div className="relative mb-4 size-40 overflow-hidden rounded-full border-4 border-primary/20">
                {/* 프로필 이미지 자리 - 실제 이미지로 교체하세요 */}
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/30 to-accent-1/30">
                  <FaServer className="size-20 text-white/60" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-content dark:text-content-dark">
                Toris
              </h3>
              <p className="mb-4 text-center text-sm text-content/70 dark:text-content-dark/70">
                프론트엔드 개발자 / AI 엔지니어
              </p>
              <div className="flex space-x-3">
                <a
                  href="https://github.com/toris-dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-content/70 transition-colors hover:text-primary dark:text-content-dark/70 dark:hover:text-primary"
                  aria-label="GitHub"
                >
                  <AiFillGithub className="size-5" />
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-content/70 transition-colors hover:text-primary dark:text-content-dark/70 dark:hover:text-primary"
                  aria-label="Twitter"
                >
                  <FaTwitter className="size-5" />
                </a>
                <a
                  href="https://discord.gg/uVq7PYEU"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-content/70 transition-colors hover:text-primary dark:text-content-dark/70 dark:hover:text-primary"
                  aria-label="Discord"
                >
                  <FaDiscord className="size-5" />
                </a>
              </div>
            </div>
            <div className="space-y-4 md:col-span-2">
              <p>
                안녕하세요, 저는 Next.js와 React를 주로 다루는 프론트엔드
                개발자입니다. 웹 개발을 통해 사용자 친화적인 인터페이스를
                만들고, AI 기술을 활용하여 개발자와 사용자 모두에게 더 나은
                경험을 제공하는 것에 관심이 많습니다.
              </p>
              <p>
                최근에는 AI를 활용한 개발 생산성 향상 도구와 Next.js의 서버
                컴포넌트, 인크리멘털 정적 생성(ISG) 같은 최신 웹 기술에 집중하고
                있습니다. 이 블로그를 통해 제가 배우고 경험한 것들을 다른
                개발자들과 공유하고자 합니다.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-primary/5 p-4 dark:bg-primary/10">
                  <h4 className="mb-2 font-medium text-primary">
                    주요 기술 스택
                  </h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-content/80 dark:text-content-dark/80">
                    <li>Next.js / React</li>
                    <li>TypeScript</li>
                    <li>Tailwind CSS</li>
                    <li>Supabase</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-accent-1/5 p-4 dark:bg-accent-1/10">
                  <h4 className="mb-2 font-medium text-accent-1">관심 분야</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-content/80 dark:text-content-dark/80">
                    <li>AI 기반 개발</li>
                    <li>UI/UX 디자인</li>
                    <li>서버리스 아키텍처</li>
                    <li>생산성 도구</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 연락 섹션 */}
        <section className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent-1/10 p-8 text-center dark:from-primary/5 dark:to-accent-1/5">
          <h2 className="mb-4 text-2xl font-bold text-content dark:text-content-dark">
            문의하기
          </h2>
          <p className="mb-6 text-content/80 dark:text-content-dark/90">
            블로그에 관한 피드백이나 협업 제안은 언제든지 환영합니다.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/contact"
              className="rounded-md bg-gradient-to-r from-primary to-accent-1 px-6 py-3 text-white transition-transform hover:scale-105"
            >
              연락처 페이지로 이동
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
