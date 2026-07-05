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

export interface ArchLayer {
  icon: IconKey;
  title: string;
  detail: string;
  stack: string[];
}

export const career = {
  org: '21앤 (21n)',
  role: 'Full-Stack Developer',
  headline: 'B2B2C 병원 시술 전자계약 플랫폼',
  summary:
    '병원·시술 모델·환자를 잇는 B2B2C 전자계약 서비스를 모바일 앱부터 인프라까지 풀스택으로 구축했습니다. React Native Expo 앱, NestJS·tRPC API, Next.js 웹, AWS 인프라를 하나의 모노레포로 운영하며 Modusign 전자서명과 PG 결제를 연동했습니다.',
  layers: [
    {
      icon: 'mobile',
      title: 'Mobile App',
      detail: '환자·모델용 크로스플랫폼 앱. Expo OTA로 빠른 배포.',
      stack: ['React Native', 'Expo', 'tRPC Client']
    },
    {
      icon: 'api',
      title: 'API Layer',
      detail: '타입-세이프 end-to-end. tRPC로 프론트-백 계약을 코드로 고정.',
      stack: ['NestJS', 'tRPC', 'TypeScript']
    },
    {
      icon: 'contract',
      title: 'Contract System',
      detail: 'Modusign 전자서명 연동 + PG 결제. 수수료·정산 비용 설계.',
      stack: ['Modusign', 'PG / 결제', 'Webhook']
    },
    {
      icon: 'infra',
      title: 'Infrastructure',
      detail: '모노레포 기반 CI/CD와 AWS 인프라로 운영 안정성 확보.',
      stack: ['AWS', 'Monorepo', 'CI/CD']
    },
    {
      icon: 'users',
      title: 'Users',
      detail: '병원 · 시술 모델 · 환자를 하나의 계약 흐름으로 연결.',
      stack: ['병원', '모델', '환자']
    }
  ] as ArchLayer[]
};

export interface TechNode {
  icon: IconKey;
  name: string;
  blurb: string;
}

// 궤도(orbit)에 배치할 핵심 스택 — hover/focus 시 사용 맥락을 노출
export const techStack: TechNode[] = [
  { icon: 'nextjs', name: 'Next.js', blurb: 'App Router · RSC · ISR로 이 블로그와 여러 서비스를 배포.' },
  { icon: 'react', name: 'React', blurb: '컴포넌트 · 훅 기반 UI, 이 랜딩의 스크롤 인터랙션까지.' },
  { icon: 'typescript', name: 'TypeScript', blurb: '프론트-백 전 영역을 타입으로 고정해 런타임 오류를 차단.' },
  { icon: 'node', name: 'Node.js', blurb: '서버리스 함수와 API 라우트, 빌드 파이프라인의 런타임.' },
  { icon: 'nest', name: 'NestJS', blurb: '모듈러 백엔드 아키텍처, tRPC와 결합해 계약형 API.' },
  { icon: 'reactnative', name: 'React Native', blurb: 'Expo로 iOS·Android 앱을 하나의 코드베이스에서.' },
  { icon: 'postgres', name: 'PostgreSQL', blurb: '관계형 데이터 모델링과 트랜잭션 무결성.' },
  { icon: 'aws', name: 'AWS', blurb: 'S3 · Lambda · 인프라 구성으로 서비스 운영.' },
  { icon: 'tailwind', name: 'Tailwind', blurb: '디자인 토큰 기반 유틸리티 CSS로 일관된 UI.' },
  { icon: 'javascript', name: 'JavaScript', blurb: '모든 것의 토대. 브라우저부터 서버까지.' }
];

// 지식 베이스 씬에서 궤도에 도는 카테고리 라벨(대표값). 실제 카운트는 데이터로 대체.
export const knowledgeThemes = [
  'Learning',
  'Projects',
  'Career',
  'Personal',
  'Archive'
];
