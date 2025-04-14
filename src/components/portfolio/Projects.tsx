import { HiBriefcase } from '@/components/icons';
import '@/styles/carousel.module.css';
import dynamic from 'next/dynamic';

// 동적으로 클라이언트 컴포넌트 불러오기
const AnimatedContainer = dynamic(() => import('./project/AnimatedContainer'), {
  ssr: false
});
const ProjectCarousel = dynamic(() => import('./project/ProjectCarousel'), {
  ssr: false
});
const AnimatedProjectSection = dynamic(
  () => import('./project/AnimatedProjectSection'),
  { ssr: false }
);

// 프로젝트 데이터 정적 정의
const shelterImages = [
  {
    url: 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F38552da6-340d-42c1-a9a1-b181ff331f03%2F124a14e0-54be-440b-82f3-d1cd4e913b0f%2F%25E1%2584%258F%25E1%2585%25A1%25E1%2584%258F%25E1%2585%25A1%25E1%2584%258B%25E1%2585%25A9SW02_page-0004.jpg&blockId=1dcb93dc-5ef5-4859-b833-81c68883634b',
    alt: '주요 설명',
    label: '쉼터 주요 설명'
  },
  {
    url: 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F38552da6-340d-42c1-a9a1-b181ff331f03%2Fe2002379-4547-4eb2-82f9-b5b63e192668%2F%25E1%2584%258F%25E1%2585%25A1%25E1%2584%258F%25E1%2585%25A1%25E1%2584%258B%25E1%2585%25A9SW02_page-0005.jpg&blockId=17b7d305-aa75-44fa-afeb-1240e93d2b08',
    alt: '프론트엔드 개발',
    label: '프론트엔드 개발'
  },
  {
    url: 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F38552da6-340d-42c1-a9a1-b181ff331f03%2F805f8749-deb7-42d4-acca-5af36f3ac814%2F%25E1%2584%258F%25E1%2585%25A1%25E1%2584%258F%25E1%2585%25A1%25E1%2584%258B%25E1%2585%25A9SW02_page-0006.jpg&blockId=8a5ea47a-4c36-4d6c-b3ae-57af4e4f7067',
    alt: '백엔드 개발',
    label: '백엔드 개발'
  }
];

const selfBlogImages = [
  {
    url: 'https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FcwlQW3%2FbtsGbVxG5Ct%2Fl1aqJWmtoZLAQejwRsaP11%2Fimg.png',
    alt: 'ligthHouse 표',
    label: 'ligthHouse 표'
  },
  {
    url: 'https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FTEOI5%2FbtsGReRt513%2FpUJRlodPnvdctt4i1r0bak%2Fimg.png',
    alt: '챗봇',
    label: '챗봇'
  },
  {
    url: '/comment.png',
    alt: '댓글 이미지',
    label: '블로그 댓글'
  }
];

// 프로젝트 데이터
const projectsData = [
  {
    id: 'shelter',
    period: '2023.09 ~ 2023.10',
    title: '쉼터',
    subtitle: '구름 하반기 프로젝트',
    description:
      '국군 장병들을 위한 원격 정신 케어 서비스로, 전문 상담관과의 원격 상담, 국방 신문고, 국군 장병 커뮤니티 기능을 제공합니다.',
    icon1: 'MdPhoneIphone',
    icon2: 'MdHealthAndSafety',
    highlights: [
      '크로스플랫폼 앱 개발을 위해 React Native 선택',
      '의사소통을 비용을 줄이기 위해 Express + Graphql 개발',
      '단일 엔드포인트 API 개발'
    ],
    role: '백엔드 파트로 진행하였지만 프론트엔드분들의 부재로 인해 React의 경험을 살려 React Native를 이용하여 개발 진행',
    repoLinks: [
      {
        label: 'Backend Repo',
        url: 'https://github.com/toris-dev/kakao_sw02_backend'
      },
      {
        label: 'Frontend Repo',
        url: 'https://github.com/toris-dev/kakao_sw02_frontend'
      }
    ],
    tech: {
      backend: [
        {
          icon: 'SiExpress',
          label: 'Express',
          color: 'text-gray-600 dark:text-gray-400'
        },
        { icon: 'SiMongodb', label: 'Mongoose', color: 'text-green-600' },
        { icon: 'SiGraphql', label: 'Apollo-Graphql', color: 'text-pink-600' }
      ],
      frontend: [
        { icon: 'FaReact', label: 'React Native', color: 'text-blue-500' },
        {
          icon: 'SiExpress',
          label: 'Expo SDK',
          color: 'text-black dark:text-white'
        }
      ],
      database: [
        { icon: 'SiMongodb', label: 'MongoDB', color: 'text-green-500' }
      ],
      devTools: [
        {
          icon: 'SiVercel',
          label: 'Heroku',
          color: 'text-black dark:text-white'
        },
        {
          icon: 'FaCodeBranch',
          label: 'Git, Gitpod, prettier, eslint',
          color: 'text-gray-700 dark:text-gray-300'
        }
      ]
    },
    images: shelterImages
  },
  {
    id: 'blog',
    period: '2024.03 ~ 2024.04',
    title: '개인 블로그 제작',
    subtitle: '1人 개인 프로젝트',
    description:
      'Next.JS로 SEO와 성능을 최적화한 개인 블로그 제작 프로젝트입니다.',
    icon1: 'MdWeb',
    icon2: 'FaBlog',
    highlights: [
      'Next.JS Pages Router에서 App Router로 마이그레이션 작업을 통한 최적화',
      'Lighthouse 지표 [100, 100, 74, 100]으로 성능 개선 확인',
      '게시글, 댓글, 대댓글, 좋아요, 태그, 카테고리, 관리자 계정 구현',
      '번들 사이즈 36% 감소',
      'Github Actions + Vercel을 통한 CI/CD 구축과 배포'
    ],
    repoLinks: [
      {
        label: 'GitHub Repository',
        url: 'https://github.com/toris-dev/Toris_Blog'
      }
    ],
    tech: {
      language: [
        { icon: 'SiTypescript', label: 'TypeScript', color: 'text-blue-600' }
      ],
      frontend: [
        {
          icon: 'SiNextdotjs',
          label: 'Next.JS',
          color: 'text-black dark:text-white'
        },
        {
          icon: 'TbApi',
          label: '@tanstack/react-query',
          color: 'text-red-500'
        },
        { icon: 'SiTailwindcss', label: 'tailwindcss', color: 'text-sky-500' }
      ],
      backend: [
        { icon: 'FaNodeJs', label: 'Node.JS', color: 'text-green-600' },
        { icon: 'FaReact', label: 'openai API', color: 'text-blue-400' },
        {
          icon: 'SiVercel',
          label: 'Supabase',
          color: 'text-gray-600 dark:text-gray-400'
        }
      ],
      database: [
        {
          icon: 'SiVercel',
          label: 'Supabase',
          color: 'text-black dark:text-white'
        }
      ],
      test: [
        {
          icon: 'SiCypress',
          label: 'Cypress',
          color: 'text-gray-700 dark:text-gray-300'
        }
      ],
      devTools: [
        {
          icon: 'FaCodeBranch',
          label: 'ESLint, Prettier, Git',
          color: 'text-gray-600 dark:text-gray-400'
        },
        {
          icon: 'SiVercel',
          label: 'Vercel',
          color: 'text-black dark:text-white'
        },
        {
          icon: 'AiFillGithub',
          label: 'GitHub Actions',
          color: 'text-black dark:text-white'
        }
      ]
    },
    images: selfBlogImages
  }
];

// 정적 사이트 생성 설정
export const generateStaticParams = async () => {
  return [{ locale: 'ko' }];
};

// 메타데이터 설정
export const metadata = {
  title: '프로젝트 소개 | 토리스 포트폴리오',
  description:
    '토리스의 프로젝트 포트폴리오 - 웹 개발 및 소프트웨어 엔지니어링 프로젝트들을 소개합니다'
};

// 메인 프로젝트 컴포넌트
const Projects = () => {
  return (
    <section id="projects" className="flex w-full flex-col items-center pb-16">
      <AnimatedContainer className="relative mb-16 flex flex-col items-center">
        <div className="absolute -z-10 size-20 rounded-full bg-blue-100 blur-xl dark:bg-blue-900/30" />
        <div className="mb-3 flex items-center space-x-3">
          <HiBriefcase className="text-4xl text-blue-600 dark:text-blue-400" />
          <h2 className="text-center text-4xl font-bold text-black dark:text-white">
            프로젝트 소개
          </h2>
        </div>
        <div className="h-1 w-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
      </AnimatedContainer>

      {/* 프로젝트 섹션 렌더링 */}
      {projectsData.map((project, index) => (
        <AnimatedProjectSection
          key={project.id}
          project={project}
          isLast={index === projectsData.length - 1}
        />
      ))}
    </section>
  );
};

export default Projects;
