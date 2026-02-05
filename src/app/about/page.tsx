'use client';

import {
  AiFillGithub,
  FaCode,
  FaDatabase,
  FaDiscord,
  FaGit,
  FaGithub,
  FaNodeJs,
  FaReact,
  FaServer,
  FaTwitter,
  SiNextDotJs,
  SiReact,
  SiSpring,
  SiTypescript
} from '@/components/icons';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { ComponentType, useState } from 'react';

const ProjectModal = dynamic(
  () => import('@/components/ui/ProjectModal').then((m) => m.default),
  { ssr: false }
);

export default function AboutPage() {
  // 모달 상태 관리
  const [selectedProject, setSelectedProject] = useState<{
    project: any;
    type: 'company' | 'personal';
  } | null>(null);

  // 기술 이름에 따른 아이콘 매핑
  const getTechIcon = (
    techName: string
  ): ComponentType<{ className?: string }> | null => {
    const iconMap: Record<string, ComponentType<{ className?: string }>> = {
      // Frontend
      React: SiReact,
      'Next.js': SiNextDotJs,
      'React Native': FaReact,
      Expo: FaReact,
      TypeScript: SiTypescript,
      'JavaScript (ES6)': FaCode,
      HTML5: FaCode,
      CSS: FaCode,
      'Tailwind CSS': FaCode,
      // Backend
      'Node.js': FaNodeJs,
      Spring: SiSpring,
      'Spring Framework': SiSpring,
      'Spring Boot': SiSpring,
      Java8: FaCode,
      JSP: FaCode,
      jQuery: FaCode,
      MyBatis: FaDatabase,
      iBatis: FaDatabase,
      // Database
      MongoDB: FaDatabase,
      MySQL: FaDatabase,
      MariaDB: FaDatabase,
      Supabase: FaDatabase,
      // DevOps & Tools
      Git: FaGit,
      GitHub: FaGithub,
      Docker: FaServer,
      AWS: FaServer,
      Vercel: SiNextDotJs,
      Notion: FaCode,
      Slack: FaCode
    };

    // 부분 일치 검색
    for (const [key, icon] of Object.entries(iconMap)) {
      if (
        techName.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(techName.toLowerCase())
      ) {
        return icon;
      }
    }

    return FaCode; // 기본 아이콘
  };

  // 기술 스택 리스트
  const skills = [
    {
      category: 'Frontend',
      technologies: [
        'React',
        'Next.js',
        'React Native',
        'Expo',
        'TypeScript',
        'JavaScript (ES6)',
        'HTML5',
        'CSS',
        'Tailwind CSS'
      ]
    },
    {
      category: 'Backend',
      technologies: [
        'Node.js',
        'Spring',
        'Java8',
        'JSP',
        'jQuery',
        'MyBatis',
        'iBatis'
      ]
    },
    {
      category: 'Database',
      technologies: ['MongoDB', 'MySQL', 'MariaDB', 'Supabase']
    },
    {
      category: 'DevOps & Tools',
      technologies: ['Git', 'Docker', 'AWS', 'Vercel', 'Notion', 'Slack']
    }
  ];

  // 경력 정보
  const experiences = [
    {
      period: '2024.08 - 2024.08',
      company: '셈웨어',
      role: '프론트엔드 개발자',
      description:
        'React, Next.js 기반 웹 서비스 개발 및 전자정부프레임워크 기반 시스템 유지보수'
    }
  ];

  // 회사 프로젝트
  const companyProjects = [
    {
      name: '잇다',
      period: '2025.01 - 2025.08 (8개월)',
      team: '개발자 3명, PM 1명, 외부 업체 협업',
      description:
        '교원들이 콘텐츠를 제작·공유하고, 이벤트 참여를 통해 상호 작용할 수 있는 플랫폼 구축',
      role: [
        '교원학습공동체 플랫폼 내 이벤트 기획 및 운영, 콘텐츠 제작 유도',
        '참여 유도형 콘텐츠 기획 및 홍보, 결과 분석 리포트 작성',
        '사용자 참여 확대를 위한 프로그램/이벤트 운영 및 관리',
        '관계 부서 협업을 통한 플랫폼 활성화 및 이벤트 시스템 운영 고도화'
      ],
      techStack: [
        'Spring',
        'MyBatis',
        'iBatis',
        'JSP',
        'MariaDB',
        'Git',
        'Eclipse'
      ],
      achievements: [
        '관리자 전용 OTP 인증 시스템 직접 구현',
        '콘텐츠 제작·공유 활성화로 교원 참여 콘텐츠 2.5배 증가',
        '신규 채널 생성 수 2배 증가',
        '월간 방문자 수 3배 증가'
      ],
      learnings: [
        '이벤트 시스템 설계 및 운영 경험: 월별 이벤트 시스템 기획·개발을 주도하며 이벤트 운영 전반에 대한 이해도 향상',
        '관리자 보안 기능 강화: 관리자 전용 OTP 인증 시스템을 직접 구현하며, 인증 로직 및 보안 흐름에 대한 실무 이해도 강화',
        '협업 중심 업무 수행: PM, 디자이너, 외부 업체와의 협업을 통해 다양한 역할 간 커뮤니케이션 능력 향상',
        '콘텐츠 자동화 및 플랫폼 활성화 기여: 이벤트와 콘텐츠 발행을 자동화하고, 사용자 참여를 유도하는 프로그램 설계로 서비스 실사용률 증가에 기여',
        '프론트-백엔드 전반 경험: 기획, 디자인, 프론트엔드 개발은 물론 Spring 기반 백엔드 API 개발 및 연동까지 직접 경험한 풀스택 업무 수행'
      ],
      link: 'https://itda.edunet.net/intro.do'
    },
    {
      name: '알지오매스',
      period: '2024.08 - 2024.12 (5개월)',
      team: '콘텐츠 기획 및 개발 인원 2명, 디자이너 2명, 기획자 1명',
      description:
        '초·중등 학생 대상의 수학 문제 풀이 콘텐츠를 시각적으로 구성하고, 학습 경험을 제공하는 웹 서비스 개발',
      role: [
        '알지오매스 콘텐츠 페이지의 프론트엔드 UI/UX 개발',
        '콘텐츠 유형에 따른 재사용 가능한 컴포넌트 구조 설계',
        '디자이너와 협업하여 문제지 형태의 콘텐츠 인터페이스 구현',
        '학습 흐름에 맞춘 상태 관리 및 사용자 상호작용 로직 개발'
      ],
      techStack: ['React', 'TypeScript', 'CSS'],
      achievements: [
        '재사용 가능한 컴포넌트 구조로 개발 효율성 향상',
        '사용자 친화적인 학습 인터페이스 구현'
      ],
      learnings: [
        '교육 콘텐츠 플랫폼 개발 경험',
        '디자이너와의 협업을 통한 UI/UX 구현 역량 강화',
        '재사용 가능한 컴포넌트 설계 능력 향상'
      ],
      link: 'https://cdn.algeomath.kr/algeo/upload/algeomath-classroom/app.20251015/index.html?data=kids.SB_5_1_%ED%8F%89%ED%96%89%EC%82%AC%EB%B3%80%ED%98%95%EC%9D%98_%EB%84%93%EC%9D%B4'
    },
    {
      name: '셈웨어 회사 페이지 리뉴얼',
      period: '2024.08 - 2024.08',
      team: '프론트엔드 개발 사원',
      description:
        '셈웨어 회사 공식 웹사이트의 메인페이지, 헤더, 푸터 등 UI 컴포넌트를 최신 디자인 트렌드와 반응형 기준에 맞춰 리뉴얼',
      role: [
        'React, styled-components 기반 메인페이지, 헤더, 푸터 등 UI 컴포넌트 개발',
        '내장 라이브러리 API 기반 서비스 라이브러리 마이그레이션 수행',
        '디자이너와 협업하여 UI/UX 개선, 디자인 시안 검수 및 디테일 최적화',
        '다양한 화면 사이즈 대응, 반응형 웹과 접근성 고려'
      ],
      techStack: ['React', 'styled-components', 'JavaScript (ES6)', 'CSS'],
      achievements: [
        '최신 디자인 트렌드와 반응형 기준에 맞춘 웹페이지 개발 완료',
        'API 기반 라이브러리 전환으로 유지보수성과 확장성 강화',
        '사용자 경험 중심 UI/UX 개선으로 서비스 완성도 향상'
      ],
      learnings: [
        'React와 styled-components를 활용한 컴포넌트 기반 UI 개발 경험',
        '디자이너와의 협업을 통한 UI/UX 개선 및 디자인 시안 검수 역량 강화',
        '반응형 웹 개발 및 접근성 고려한 웹 개발 경험',
        'API 기반 라이브러리 마이그레이션을 통한 유지보수성 및 확장성 향상 경험'
      ],
      link: 'https://www.cemware.com/'
    },
    {
      name: 'SteamUp 학습도구 공학용 라이브러리 API 마이그레이션',
      period: '2024.08 - 2024.08',
      team: '프론트엔드 개발 사원',
      description:
        '기존 SteamUp 내장 라이브러리를 API 기반 서비스 라이브러리로 마이그레이션하고, 프론트엔드와 연동하여 UI 컴포넌트 개발',
      role: [
        '기존 SteamUp 내장 라이브러리를 API 기반 서비스 라이브러리로 마이그레이션',
        '마이그레이션된 API를 프론트엔드(React)와 연동하여 UI 컴포넌트 개발',
        '디자이너와 협업하여 UI/UX 개선, 디자인 시안 검수 및 디테일 최적화',
        '반응형 웹 및 접근성 고려, 다양한 화면 환경 대응'
      ],
      techStack: ['React', 'TypeScript', 'JavaScript (ES6)', 'CSS'],
      achievements: [
        'API 전환을 통한 유지보수성과 확장성 강화',
        '프론트엔드와 성공적으로 연동하여 서비스 안정성 확보',
        '사용자 경험 중심 UI/UX 개선으로 웹페이지 완성도 향상'
      ],
      learnings: [
        '내장 라이브러리에서 API 기반 서비스로의 마이그레이션 경험',
        'API와 프론트엔드 연동을 통한 서비스 통합 개발 경험',
        '디자이너와의 협업을 통한 UI/UX 개선 및 디테일 최적화 역량 강화',
        '반응형 웹 개발 및 접근성 고려한 다양한 화면 환경 대응 경험'
      ],
      link: 'https://www.steamup.academy/ko'
    }
  ];

  // 개인 프로젝트
  const personalProjects = [
    {
      name: 'Toris Blog',
      period: '2024.03',
      description:
        'Next.js 기반 정적 블로그 구조 설계 및 콘텐츠 작성 기능 구현. 다크모드, 코드 하이라이팅, 카테고리/태그 필터 등 주요 기능 개발',
      techStack: [
        'Next.js',
        'TypeScript',
        'Tailwind CSS',
        'MDX',
        'Vercel',
        'GitHub Actions'
      ],
      features: [
        '다크모드 지원',
        '코드 하이라이팅',
        '카테고리/태그 필터',
        '블로그 SEO 최적화 (og:image 자동 생성, 메타 태그 적용)',
        'Markdown 기반 포스트 렌더링',
        '파일 기반 CMS 구조',
        'GitHub Actions를 활용한 자동 배포 및 CI 구성'
      ],
      learnings: [
        '정적 콘텐츠 렌더링과 파일 기반 라우팅에 대한 이해도 향상',
        'SEO·접근성·성능 등 실 서비스 운영을 고려한 프론트엔드 개발 역량 강화',
        '개인 기술 블로그를 통한 개발 지식 공유 및 기술 브랜딩 시작',
        '블로그 기능 개선을 반복하며 Next.js 생태계에 대한 실무 감각 습득'
      ],
      github: 'https://github.com/toris-dev/Toris_Blog',
      link: 'https://toris-blog.vercel.app',
      isDeveloping: false
    },
    {
      name: 'ym_guide',
      period: '2025.12',
      description:
        '청년들을 위한 금융, 정책, 복지 혜택 큐레이션 플랫폼. 청년정책 OPEN API를 통한 정책 검색, 맞춤형 혜택 추천, 금융 교육 기능을 제공하는 서비스',
      techStack: [
        'Next.js',
        'TypeScript',
        'Tailwind CSS',
        'Supabase',
        'PostgreSQL'
      ],
      features: [
        '카테고리별 정책 필터링 및 검색',
        '간단한 질문 기반 맞춤형 혜택 추천',
        '청년정책 OPEN API 연동 및 실시간 업데이트',
        '북마크 기능 및 마이페이지 관리',
        '금융 교육 콘텐츠 제공'
      ],
      learnings: [
        '정부 OPEN API 연동 및 데이터 처리 경험',
        '맞춤형 추천 시스템 설계 및 구현',
        'Supabase를 활용한 백엔드 개발 경험',
        '청년 대상 서비스 UX/UI 설계 경험'
      ],
      github: 'https://github.com/toris-dev/ym_guide',
      link: 'https://ym-guide.vercel.app',
      isDeveloping: false
    },
    {
      name: 'love-trip',
      period: '2025.08',
      description:
        '연인과의 여행을 위해 교통편, 숙소, 데이트 장소, 경비를 한 번에 추천해주는 커플 맞춤 여행 서비스. Tour API 기반 실시간 관광 정보 제공 및 네이버 지도 통합',
      techStack: [
        'Next.js',
        'TypeScript',
        'Supabase',
        'Tour API',
        'Naver Maps API',
        'pnpm'
      ],
      features: [
        '출발지/목적지/예산 기반 최적 여행 코스 자동 생성',
        'Tour API 기반 실시간 관광 정보 제공',
        '네이버 지도 통합으로 직관적인 코스 확인',
        '데이트 장소 큐레이션 (카페, 레스토랑, 야경 명소)',
        '예산 관리 및 1/N 정산 기능',
        '커플 캘린더 및 일정 관리',
        '모노레포 구조 (web, crawler, shared 패키지)'
      ],
      learnings: [
        '모노레포 구조 설계 및 관리 경험',
        '외부 API (Tour API, Naver Maps) 연동 경험',
        '크롤러 패키지를 통한 데이터 수집 시스템 구축',
        '커플 타겟 서비스 UX/UI 설계 경험',
        'Supabase를 활용한 실시간 데이터 동기화'
      ],
      github: 'https://github.com/toris-dev/love-trip',
      link: 'https://love2trip.vercel.app/',
      isDeveloping: true
    },
    {
      name: 'PEPEBear',
      period: '2025.11',
      description:
        'Solana 블록체인 기반 커뮤니티 중심 밈 암호화폐 프로젝트. 게이미피케이션 요소(포인트, 레벨, 업적), 실시간 토큰 홀더 추적, 단계별 성장 시스템을 제공하는 Web3 서비스',
      techStack: [
        'Next.js',
        'TypeScript',
        'React',
        'Solana',
        'Web3',
        'Anchor Framework'
      ],
      features: [
        'Solana 지갑 연동 (Phantom, Solflare 등)',
        '게이미피케이션 요소 (포인트, 레벨, 업적 시스템)',
        '실시간 토큰 홀더 추적 및 랭킹 변화 애니메이션',
        '라이브 토큰 통계 (참여자, 거래량, 보상)',
        '타임라인 기반 단계별 성장 시각화',
        '반응형 디자인 및 SEO 최적화'
      ],
      learnings: [
        'Solana 블록체인 및 Web3 개발 경험',
        '지갑 연동 및 스마트 컨트랙트 상호작용',
        '실시간 온체인 데이터 추적 및 시각화',
        '게이미피케이션 시스템 설계 및 구현',
        'Web3 서비스 UX/UI 설계 경험'
      ],
      github: 'https://github.com/toris-dev/PEPEBear',
      link: 'https://pepe-bear.vercel.app',
      isDeveloping: false
    },
    {
      name: 'bubbleBible-FE',
      period: '2025.08',
      description:
        '매일 한 구절로 신앙 루틴을 만드는 모바일 우선 성경 플랫폼. 개인 묵상과 교회·소그룹 중심의 공동체 기능을 결합한 성경 서비스의 프론트엔드',
      techStack: [
        'React',
        'TypeScript',
        'Next.js',
        'Tailwind CSS',
        'PWA',
        'Push Notifications'
      ],
      features: [
        '성경 본문 뷰어 (하이라이트, 북마크, 폰트 조절)',
        '포인트·레벨 시스템 (읽기·댓글·좋아요 활동별 보상)',
        '교회 그룹 커뮤니티 (묵상 나눔, 기도제목 공유)',
        'PWA 지원 및 푸시 알림 기능',
        '모바일 우선 UX (다크모드, 접근성, 반응형)',
        '암송 챌린지 및 오늘의 말씀 추천',
        '랭킹 시스템 및 그룹 활동 통계'
      ],
      learnings: [
        '모바일 우선 웹앱 개발 경험',
        'PWA 구현 및 푸시 알림 시스템 구축',
        '커뮤니티 기능이 있는 콘텐츠 플랫폼 개발',
        '게이미피케이션을 통한 사용자 참여 유도',
        '종교 서비스 특화 UX/UI 설계 경험'
      ],
      github: 'https://github.com/toris-dev/bubbleBible-FE',
      link: 'https://bubble-bible-fe.vercel.app',
      isDeveloping: true
    },
    {
      name: 'CryptoTrade.gg',
      period: '2025.02 - 2025.04',
      description: '암호화폐 트레이드 전적 조회 서비스',
      techStack: ['TypeScript', 'Next.js'],
      features: ['암호화폐 트레이드 전적 조회', '데이터 시각화'],
      learnings: ['암호화폐 데이터 시각화 경험'],
      github: 'https://github.com/toris-dev/CryptoTrade.gg',
      link: 'https://tradinggg.vercel.app',
      isDeveloping: false
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-12">
        <div className="space-y-6 text-center">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
            Toris Dev Blog 소개
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            웹 개발과 AI 생산성 도구에 관한 경험과 지식을 공유하는 기술
            블로그입니다
          </p>
        </div>

        {/* 블로그 소개 섹션 */}
        <section className="shadow-soft rounded-2xl border border-primary/30 bg-card/50 p-8 backdrop-blur-sm">
          <h2 className="mb-6 text-2xl font-bold text-card-foreground">
            <span className="mr-2">📝</span>
            블로그 소개
          </h2>
          <div className="space-y-4 text-muted-foreground">
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
        <section className="shadow-soft rounded-2xl border border-primary/30 bg-card/50 p-8 backdrop-blur-sm">
          <h2 className="mb-6 text-2xl font-bold text-card-foreground">
            <span className="mr-2">👨‍💻</span>
            운영자 소개
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center justify-center md:col-span-1">
              <div className="shadow-soft hover:shadow-medium relative mb-4 size-40 overflow-hidden rounded-full border-4 border-primary/50 transition-shadow">
                {/* 프로필 이미지 자리 - 실제 이미지로 교체하세요 */}
                <div className="flex size-full items-center justify-center bg-primary/10">
                  <Image
                    src="https://github.com/toris-dev.png"
                    alt="토리스 프로필 이미지"
                    width={100}
                    height={100}
                    className="size-full rounded-full object-cover"
                  />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-card-foreground">
                Toris
              </h3>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                프론트엔드 개발자
              </p>
              <p className="mb-2 text-center text-xs text-muted-foreground">
                경력 1년차
              </p>
              <div className="flex space-x-3">
                <a
                  href="https://github.com/toris-dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary dark:hover:text-primary"
                  aria-label="GitHub"
                >
                  <AiFillGithub className="size-5" />
                </a>
                <a
                  href="https://x.com/TorisDev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary dark:hover:text-primary"
                  aria-label="Twitter"
                >
                  <FaTwitter className="size-5" />
                </a>
                <a
                  href="https://discord.com/users/516088509891870760"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-primary dark:hover:text-primary"
                  aria-label="Discord"
                >
                  <FaDiscord className="size-5" />
                </a>
              </div>
            </div>
            <div className="space-y-4 md:col-span-2">
              <p>
                JS(TypeScript)를 기반으로 프론트엔드를 시작해, 백엔드(Spring,
                JSP, jQuery)까지 아우르는 1년차 백엔드 경험이 있는 프론트엔드
                개발자입니다.
              </p>
              <p>
                React, Next.js를 활용한 웹 서비스 구축과 전자정부프레임워크 기반
                시스템 유지보수 경험을 보유하고 있으며, 이벤트 시스템, UX 개선,
                콘텐츠 자동화 등 실무 중심의 프로젝트에 참여했습니다.
              </p>
              <p>
                기획부터 운영까지 end-to-end 개발 경험을 통해 비즈니스 기여에
                집중하며, 기술에 대한 호기심과 학습 의지가 강하고, 사용자 중심의
                서비스 개선에 관심이 많은 개발자입니다.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="shadow-soft rounded-lg border border-primary/30 bg-primary/10 p-4">
                  <h4 className="mb-2 font-medium text-primary">
                    주요 기술 스택
                  </h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    <li>React / Next.js</li>
                    <li>TypeScript</li>
                    <li>Spring / Java</li>
                    <li>Node.js</li>
                  </ul>
                </div>
                <div className="shadow-soft rounded-lg border border-secondary/30 bg-secondary/10 p-4">
                  <h4 className="mb-2 font-medium text-secondary">관심 분야</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    <li>사용자 경험 개선</li>
                    <li>풀스택 개발</li>
                    <li>서비스 기획 및 운영</li>
                    <li>협업 및 커뮤니케이션</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 기술 스택 섹션 */}
        <section className="shadow-soft rounded-2xl border border-primary/30 bg-card/50 p-8 backdrop-blur-sm">
          <h2 className="mb-6 text-2xl font-bold text-card-foreground">
            <span className="mr-2">🛠️</span>
            기술 스택
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="shadow-soft rounded-lg border border-primary/30 bg-muted/30 p-4 backdrop-blur-sm"
              >
                <h3 className="mb-3 font-semibold text-card-foreground">
                  {skill.category}
                </h3>
                <ul className="space-y-2">
                  {skill.technologies.map((tech, techIndex) => {
                    const Icon = getTechIcon(tech);
                    return (
                      <li
                        key={techIndex}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        {Icon && (
                          <Icon className="size-4 shrink-0 text-primary" />
                        )}
                        <span>{tech}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* 경력 섹션 */}
        <section className="shadow-soft rounded-2xl border border-primary/30 bg-card/50 p-8 backdrop-blur-sm">
          <h2 className="mb-6 text-2xl font-bold text-card-foreground">
            <span className="mr-2">💼</span>
            경력
          </h2>
          <div className="space-y-6">
            {experiences.map((exp, index) => (
              <div
                key={index}
                className="rounded-lg border-l-4 border-primary bg-muted/30 p-6"
              >
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-xl font-semibold text-card-foreground">
                    {exp.company}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {exp.period}
                  </span>
                </div>
                <p className="mb-2 font-medium text-primary">{exp.role}</p>
                <p className="text-muted-foreground">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 회사 프로젝트 섹션 */}
        <section className="shadow-soft rounded-2xl border border-primary/30 bg-card/50 p-8 backdrop-blur-sm">
          <h2 className="mb-6 text-2xl font-bold text-card-foreground">
            <span className="mr-2">🏢</span>
            회사 프로젝트
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {companyProjects.map((project, index) => (
              <div
                key={index}
                className="shadow-soft hover:shadow-medium group relative flex flex-col overflow-hidden rounded-2xl border border-primary/30 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/50"
              >
                {/* 헤더 */}
                <div className="mb-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="text-xl font-bold text-card-foreground transition-all group-hover:text-primary group-hover:drop-shadow-[0_0_8px_hsl(var(--primary))]">
                      {project.name}
                    </h3>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    <span>{project.period}</span>
                    {project.team && <span>{project.team}</span>}
                  </div>
                </div>

                {/* 설명 */}
                <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-foreground/80">
                  {project.description}
                </p>

                {/* 기술 스택 */}
                <div className="mb-5">
                  <h4 className="mb-2.5 text-xs font-semibold text-card-foreground">
                    기술 스택
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.slice(0, 6).map((tech, techIndex) => {
                      const Icon = getTechIcon(tech);
                      return (
                        <span
                          key={techIndex}
                          className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                        >
                          {Icon && <Icon className="size-3 shrink-0" />}
                          {tech}
                        </span>
                      );
                    })}
                    {project.techStack.length > 6 && (
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        +{project.techStack.length - 6}
                      </span>
                    )}
                  </div>
                </div>

                {/* 주요 성과 */}
                {project.achievements && project.achievements.length > 0 && (
                  <div className="mb-5">
                    <h4 className="mb-2.5 text-xs font-semibold text-card-foreground">
                      주요 성과
                    </h4>
                    <ul className="space-y-1.5">
                      {project.achievements
                        .slice(0, 3)
                        .map((achievement, achIndex) => (
                          <li
                            key={achIndex}
                            className="line-clamp-1 text-xs text-foreground/70"
                          >
                            • {achievement}
                          </li>
                        ))}
                      {project.achievements.length > 3 && (
                        <li className="text-xs text-muted-foreground">
                          +{project.achievements.length - 3}개 더
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* 버튼 */}
                <div className="mt-auto border-t border-primary/30 pt-4">
                  <button
                    onClick={() =>
                      setSelectedProject({ project, type: 'company' })
                    }
                    className="shadow-soft hover:shadow-medium w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:scale-[1.02] hover:bg-primary/90"
                  >
                    자세히 보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 개인 프로젝트 섹션 */}
        <section className="shadow-soft rounded-2xl border border-primary/30 bg-card/50 p-8 backdrop-blur-sm">
          <h2 className="mb-6 text-2xl font-bold text-card-foreground">
            <span className="mr-2">🚀</span>
            개인 프로젝트
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {personalProjects.map((project, index) => (
              <div
                key={index}
                className={`shadow-soft group relative flex flex-col overflow-visible rounded-2xl border bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 ${
                  project.isDeveloping
                    ? 'border-yellow-500/80 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:border-yellow-500 hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]'
                    : 'border-primary/30 hover:border-primary/50 hover:shadow-lg'
                }`}
              >
                {/* 개발중 배지 - 카드 상단 */}
                {project.isDeveloping && (
                  <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
                    <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full border-2 border-yellow-500 bg-yellow-500/90 px-4 py-1.5 text-sm font-bold text-yellow-950 shadow-[0_0_15px_rgba(234,179,8,0.6)] backdrop-blur-sm">
                      🔨 개발중
                    </span>
                  </div>
                )}

                {/* 헤더 */}
                <div className="mb-4">
                  <h3 className="mb-2 text-xl font-bold text-card-foreground transition-all group-hover:text-primary group-hover:drop-shadow-[0_0_8px_hsl(var(--primary))]">
                    {project.name}
                  </h3>
                  {project.period && (
                    <span className="text-xs text-muted-foreground">
                      {project.period}
                    </span>
                  )}
                </div>

                {/* 설명 */}
                <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-foreground/80">
                  {project.description}
                </p>

                {/* 기술 스택 */}
                <div className="mb-5">
                  <h4 className="mb-2.5 text-xs font-semibold text-card-foreground">
                    기술 스택
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.slice(0, 6).map((tech, techIndex) => {
                      const Icon = getTechIcon(tech);
                      return (
                        <span
                          key={techIndex}
                          className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                        >
                          {Icon && <Icon className="size-3 shrink-0" />}
                          {tech}
                        </span>
                      );
                    })}
                    {project.techStack.length > 6 && (
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        +{project.techStack.length - 6}
                      </span>
                    )}
                  </div>
                </div>

                {/* 주요 기능 */}
                {project.features && project.features.length > 0 && (
                  <div className="mb-5">
                    <h4 className="mb-2.5 text-xs font-semibold text-card-foreground">
                      주요 기능
                    </h4>
                    <ul className="space-y-1.5">
                      {project.features
                        .slice(0, 3)
                        .map((feature, featIndex) => (
                          <li
                            key={featIndex}
                            className="line-clamp-1 text-xs text-foreground/70"
                          >
                            • {feature}
                          </li>
                        ))}
                      {project.features.length > 3 && (
                        <li className="text-xs text-muted-foreground">
                          +{project.features.length - 3}개 더
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* 버튼 */}
                <div className="mt-auto border-t border-primary/30 pt-4">
                  <button
                    onClick={() =>
                      setSelectedProject({ project, type: 'personal' })
                    }
                    className="shadow-soft hover:shadow-medium w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:scale-[1.02] hover:bg-primary/90"
                  >
                    자세히 보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 연락 섹션 */}
        <section className="shadow-soft rounded-2xl border border-primary/30 bg-primary/10 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-card-foreground">
            문의하기
          </h2>
          <p className="mb-6 text-muted-foreground">
            블로그에 관한 피드백이나 협업 제안은 언제든지 환영합니다.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/contact"
              className="rounded-md bg-primary px-6 py-3 text-primary-foreground transition-transform hover:scale-105 hover:bg-primary/90"
            >
              연락처 페이지로 이동
            </Link>
          </div>
        </section>

        {/* 프로젝트 모달 */}
        {selectedProject && (
          <ProjectModal
            isOpen={!!selectedProject}
            onClose={() => setSelectedProject(null)}
            project={selectedProject.project}
            type={selectedProject.type}
          />
        )}
      </div>
    </div>
  );
}
