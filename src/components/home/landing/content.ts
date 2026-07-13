// 3D 랜딩의 정적 콘텐츠 (커리어 스토리 · 기술 스택 설명)
// 아이콘은 직렬화가 안 되므로 문자열 key로 두고 컴포넌트에서 매핑한다.

export type IconKey =
  | 'mobile'
  | 'api'
  | 'contract'
  | 'infra'
  | 'users'
  | 'nextjs'
  | 'react'
  | 'typescript'
  | 'node'
  | 'nest'
  | 'reactnative'
  | 'postgres'
  | 'aws'
  | 'tailwind'
  | 'javascript';

export type DeveloperPipelineStageId = 'frame' | 'shape' | 'build' | 'ship';

export interface DeveloperPipelineStage {
  id: DeveloperPipelineStageId;
  number: '01' | '02' | '03' | '04';
  label: 'Frame' | 'Shape' | 'Build' | 'Ship';
  title: string;
  description: string;
  outcome: string;
  signals: readonly string[];
}

export interface DeveloperPipeline {
  eyebrow: 'HOW I BUILD';
  role: 'Product Full-Stack Developer';
  title: '제품의 처음과 끝을 연결하는 개발자';
  summary: string;
  closing: string;
  stages: readonly DeveloperPipelineStage[];
}

export const developerPipeline: DeveloperPipeline = {
  eyebrow: 'HOW I BUILD',
  role: 'Product Full-Stack Developer',
  title: '제품의 처음과 끝을 연결하는 개발자',
  summary:
    '문제를 제품의 언어로 정리하고, 화면과 시스템을 함께 설계해, 실제로 운영되는 결과까지 만듭니다.',
  closing:
    '한 경계에서 다음 팀으로 넘기는 대신, 결정이 제품 전체에서 어떻게 작동하는지 끝까지 확인합니다.',
  stages: [
    {
      id: 'frame',
      number: '01',
      label: 'Frame',
      title: '문제를 제품 언어로',
      description:
        '사용자 맥락과 제약을 읽고 해결할 문제, 핵심 흐름, 성공 조건을 좁힙니다.',
      outcome: '명확한 MVP와 우선순위',
      signals: ['사용자 흐름', '정보 구조', '제품 가설']
    },
    {
      id: 'shape',
      number: '02',
      label: 'Shape',
      title: '만지고 이해되는 경험으로',
      description:
        '웹과 모바일의 차이를 고려해 첫 화면부터 완료 상태까지 자연스럽게 이어지는 경험을 설계합니다.',
      outcome: '설명 없이도 작동하는 인터페이스',
      signals: ['Web', 'Mobile', 'Interaction']
    },
    {
      id: 'build',
      number: '03',
      label: 'Build',
      title: '화면과 시스템을 함께',
      description:
        'API, 데이터, 인증, 결제와 인프라를 화면의 흐름과 같은 제품 계약으로 연결합니다.',
      outcome: '변화에 견디는 제품 시스템',
      signals: ['API', 'Data', 'Integration', 'Infrastructure']
    },
    {
      id: 'ship',
      number: '04',
      label: 'Ship',
      title: '배포 이후까지 운영으로',
      description:
        '테스트와 배포 파이프라인을 만들고 실제 사용에서 발견한 신호를 다음 개선으로 되돌립니다.',
      outcome: '운영 가능한 릴리스와 반복',
      signals: ['Testing', 'CI/CD', 'Observability', 'Iteration']
    }
  ]
};

export interface TechNode {
  icon: IconKey;
  name: string;
  blurb: string;
}

// 궤도(orbit)에 배치할 핵심 스택 — hover/focus 시 사용 맥락을 노출
export const techStack: TechNode[] = [
  {
    icon: 'nextjs',
    name: 'Next.js',
    blurb: 'App Router · RSC · ISR로 이 블로그와 여러 서비스를 배포.'
  },
  {
    icon: 'react',
    name: 'React',
    blurb: '컴포넌트 · 훅 기반 UI, 이 랜딩의 스크롤 인터랙션까지.'
  },
  {
    icon: 'typescript',
    name: 'TypeScript',
    blurb: '프론트-백 전 영역을 타입으로 고정해 런타임 오류를 차단.'
  },
  {
    icon: 'node',
    name: 'Node.js',
    blurb: '서버리스 함수와 API 라우트, 빌드 파이프라인의 런타임.'
  },
  {
    icon: 'nest',
    name: 'NestJS',
    blurb: '모듈러 백엔드 아키텍처, tRPC와 결합해 계약형 API.'
  },
  {
    icon: 'reactnative',
    name: 'React Native',
    blurb: 'Expo로 iOS·Android 앱을 하나의 코드베이스에서.'
  },
  {
    icon: 'postgres',
    name: 'PostgreSQL',
    blurb: '관계형 데이터 모델링과 트랜잭션 무결성.'
  },
  {
    icon: 'aws',
    name: 'AWS',
    blurb: 'S3 · Lambda · 인프라 구성으로 서비스 운영.'
  },
  {
    icon: 'tailwind',
    name: 'Tailwind',
    blurb: '디자인 토큰 기반 유틸리티 CSS로 일관된 UI.'
  },
  {
    icon: 'javascript',
    name: 'JavaScript',
    blurb: '모든 것의 토대. 브라우저부터 서버까지.'
  }
];

// 지식 베이스 씬에서 궤도에 도는 카테고리 라벨(대표값). 실제 카운트는 데이터로 대체.
export const knowledgeThemes = [
  'Learning',
  'Projects',
  'Career',
  'Personal',
  'Archive'
];
