import {
  AiOutlineMail,
  FaCode,
  FaGithub,
  FaTwitter,
  SiNextdotjs
} from '@/components/icons';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '소개 - toris-dev',
  description: '프론트엔드 및 Next.js 개발자 toris-dev에 대해 알아보세요.'
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
    <div className="container max-w-4xl py-16">
      {/* 소개 헤더 */}
      <section className="mb-16 text-center">
        <div className="web3-glass mb-6 inline-block p-2">
          <div className="relative mx-auto size-32 overflow-hidden rounded-full border-2 border-primary">
            <Image
              src="https://github.com/toris-dev.png"
              alt="토리스 프로필 이미지"
              fill
              className="object-cover"
            />
          </div>
        </div>
        <h1 className="mb-4 text-4xl font-bold">
          안녕하세요, <span className="gradient-text">toris-dev</span>입니다
        </h1>
        <p className="mb-6 text-xl text-content-dark">
          Next.js 기반 프론트엔드 및 풀스택 개발자
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="https://github.com/toris-dev"
            target="_blank"
            className="flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-primary transition-all hover:bg-primary/20"
          >
            <FaGithub size={20} />
            <span>GitHub</span>
          </Link>
          <Link
            href="https://twitter.com"
            target="_blank"
            className="flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-primary transition-all hover:bg-primary/20"
          >
            <FaTwitter size={20} />
            <span>Twitter</span>
          </Link>
          <Link
            href="/contact"
            className="flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-primary transition-all hover:bg-primary/20"
          >
            <AiOutlineMail size={20} />
            <span>연락하기</span>
          </Link>
        </div>
      </section>

      {/* 자기소개 */}
      <section className="mb-16">
        <div className="web3-card">
          <h2 className="mb-6 text-2xl font-bold">
            <span className="gradient-text">자기소개</span>
          </h2>
          <div className="space-y-4 text-content">
            <p>
              안녕하세요! 저는 React와 Next.js에 열정을 가진 프론트엔드 중심의
              풀스택 개발자입니다. 현대적인 웹 개발 기술과 사용자 경험에 중점을
              두고 다양한 프로젝트를 개발하고 있습니다.
            </p>
            <p>
              5년 이상의 프론트엔드 개발 경험과 3년 이상의 Next.js 경험을
              바탕으로 사용자 친화적이면서도 기술적으로 견고한 애플리케이션을
              구축하는 데 집중하고 있습니다. 백엔드 기술에도 능숙하여 풀스택
              개발을 즐깁니다.
            </p>
            <p>
              React 기반 SPA, Next.js를 활용한 SSR/SSG 웹사이트, REST API 설계,
              데이터베이스 모델링에 이르기까지 웹 개발의 전 영역에 관심이
              있으며, 최신 웹 기술 트렌드를 꾸준히 탐구하고 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 기술 스택 */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold">
          <span className="gradient-text">기술 스택</span>
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {skills.map((skillGroup) => (
            <div
              key={skillGroup.category}
              className="web3-card transition-all hover:-translate-y-1"
            >
              <h3 className="mb-4 text-lg font-semibold text-primary">
                {skillGroup.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {skillGroup.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                  >
                    {tech === 'Next.js' && (
                      <SiNextdotjs className="mr-1 size-3" />
                    )}
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 경력 */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold">
          <span className="gradient-text">경력</span>
        </h2>
        <div className="space-y-6">
          {experiences.map((exp, index) => (
            <div
              key={index}
              className="web3-card relative border-l-4 border-primary"
            >
              <span className="absolute -left-3 top-6 flex size-6 items-center justify-center rounded-full bg-primary text-white">
                <FaCode size={14} />
              </span>
              <div className="ml-4">
                <div className="mb-2 text-sm font-medium text-primary">
                  {exp.period}
                </div>
                <h3 className="mb-1 text-lg font-bold">{exp.company}</h3>
                <div className="mb-2 text-primary">{exp.role}</div>
                <p className="text-content-dark">{exp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <div className="web3-card bg-gradient-to-r from-primary/20 to-accent-1/20">
          <h2 className="mb-4 text-2xl font-bold">프로젝트 협업 문의</h2>
          <p className="mb-6 text-content-dark">
            모던 웹 개발 프로젝트를 함께 만들고 싶으신가요? 언제든지 연락
            주세요!
          </p>
          <Link
            href="/contact"
            className="web3-button inline-flex items-center"
          >
            <AiOutlineMail className="mr-2 size-5" />
            <span>연락하기</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
