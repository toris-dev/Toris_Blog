export interface StudioService {
  id: 'web' | 'mobile' | 'desktop' | 'mvp';
  label: string;
  title: string;
  description: string;
  deliverables: string[];
  stack: string[];
}

export interface StudioCaseStudy {
  number: string;
  slug: string;
  name: string;
  kind: string;
  problem: string;
  build: string;
  result: string;
  scope: string[];
  stack: string[];
  image?: string;
  imageAlt?: string;
}

export interface StudioProcessStep {
  number: string;
  label: string;
  title: string;
  description: string;
  output: string;
}

export const studioServices: StudioService[] = [
  {
    id: 'web',
    label: 'Web Product',
    title: '웹 서비스·SaaS',
    description:
      '고객용 서비스부터 운영 어드민까지, 실제 업무 흐름을 담는 반응형 웹 제품을 설계하고 개발합니다.',
    deliverables: ['서비스 구조 설계', '반응형 UI', 'API·DB', '배포·운영'],
    stack: ['Next.js', 'React', 'NestJS', 'PostgreSQL']
  },
  {
    id: 'mobile',
    label: 'Mobile App',
    title: 'iOS·Android 앱',
    description:
      '하나의 제품 경험을 iOS와 Android에 맞게 구현하고 인증, 알림, 실시간 데이터 흐름까지 연결합니다.',
    deliverables: [
      '앱 UX 설계',
      '크로스플랫폼 개발',
      '푸시·실시간',
      '스토어 준비'
    ],
    stack: ['React Native', 'Expo', 'Flutter', 'Firebase']
  },
  {
    id: 'desktop',
    label: 'Desktop',
    title: '데스크톱·로컬 앱',
    description:
      '운영 도구와 생산성 앱처럼 OS 기능, 로컬 데이터, 백그라운드 작업이 필요한 제품을 만듭니다.',
    deliverables: ['데스크톱 UI', 'OS 연동', '로컬 데이터', '설치 패키지'],
    stack: ['Tauri', 'Rust', 'React', 'SQLite']
  },
  {
    id: 'mvp',
    label: 'MVP & Automation',
    title: 'MVP·AI 자동화',
    description:
      '아이디어를 검증 가능한 최소 제품으로 좁히고 반복 업무는 안정적인 자동화 파이프라인으로 전환합니다.',
    deliverables: [
      '요구사항 정리',
      '핵심 기능 MVP',
      '외부 API 연동',
      '운영 자동화'
    ],
    stack: ['TypeScript', 'Python', 'LLM', 'Cloud']
  }
];

export const studioCaseStudies: StudioCaseStudy[] = [
  {
    number: '01',
    slug: '21n-apps',
    name: '예쁜계약',
    kind: 'B2B2C 전자계약 플랫폼',
    problem:
      '모델과 병원이 서로 다른 화면에서 계약 초안, 서명, 확인, 체결 상태를 놓치지 않고 이어가야 했습니다.',
    build:
      '역할별 계약 흐름과 상태 타임라인을 설계하고 Next.js·NestJS·PostgreSQL 모노레포로 제품 경계를 연결했습니다.',
    result:
      '계약의 현재 단계와 다음 행동을 한 흐름에서 확인하는 운영 기반을 만들었습니다.',
    scope: ['제품 설계', '프론트엔드', '백엔드', '인프라'],
    stack: ['Next.js', 'NestJS', 'PostgreSQL'],
    image: '/images/projects/21n-apps/cover.svg',
    imageAlt: '예쁜계약 전자계약 상태 흐름'
  },
  {
    number: '02',
    slug: 'snapmate',
    name: 'SnapMate',
    kind: '모바일 사진 공유 앱',
    problem:
      '촬영한 사진이 여러 메신저와 앨범에 흩어져 가족과 친구가 함께 보는 경험이 끊겼습니다.',
    build:
      '앱 안의 카메라, 그룹별 갤러리, 실시간 동기화를 하나의 짧은 공유 흐름으로 구현했습니다.',
    result:
      '촬영 직후 선택한 그룹의 공용 앨범에 순간이 쌓이는 모바일 제품 경험을 완성했습니다.',
    scope: ['모바일 UX', '앱 개발', '클라우드 연동'],
    stack: ['Expo', 'React Native', 'Firebase'],
    image: '/images/projects/snapmate/feature.png',
    imageAlt: 'SnapMate 그룹 사진 공유 기능 소개'
  },
  {
    number: '03',
    slug: 'tracedesk',
    name: 'TraceDesk',
    kind: '로컬 퍼스트 데스크톱',
    problem:
      'PC 활동을 돌아보고 싶지만 민감한 기록을 외부 서버에 보내지 않는 방식이 필요했습니다.',
    build:
      'Rust 백그라운드 에이전트와 React UI, 로컬 SQLite를 Tauri 앱 하나로 통합했습니다.',
    result:
      '외부 전송 없이 활동 수집, 타임라인 분석, 내보내기가 가능한 운영형 데스크톱 앱을 배포했습니다.',
    scope: ['데스크톱 UX', '시스템 연동', '데이터 설계'],
    stack: ['Tauri', 'Rust', 'React', 'SQLite']
  },
  {
    number: '04',
    slug: 'love-trip',
    name: 'LOVETRIP',
    kind: '여행 설계 웹 플랫폼',
    problem:
      '교통, 숙소, 장소, 예산 정보가 흩어져 여행 계획과 정산을 여러 서비스에서 반복해야 했습니다.',
    build:
      '일정 플래너, 지도·관광 API, 예산과 공동 여행 설계를 하나의 반응형 웹 흐름으로 묶었습니다.',
    result:
      '여행 전 계획부터 여행 후 기록까지 이어지는 올인원 제품 구조를 구현했습니다.',
    scope: ['서비스 기획', '웹 개발', 'API 연동'],
    stack: ['Next.js', 'Supabase', 'Naver Maps'],
    image: '/images/projects/love-trip.png',
    imageAlt: 'LOVETRIP 여행 일정과 예산 설계 화면'
  },
  {
    number: '05',
    slug: 'devpulse',
    name: 'devPulse',
    kind: 'AI 콘텐츠 자동화',
    problem:
      '개발 뉴스를 찾고 요약해 카드뉴스와 영상으로 만드는 반복 작업에 많은 시간이 들었습니다.',
    build:
      '수집, 로컬 LLM 요약, 카드 생성, FFmpeg 영상 렌더링을 엔드투엔드 파이프라인으로 자동화했습니다.',
    result:
      '외부 LLM API 비용 없이 재실행 가능한 로컬 콘텐츠 생산 시스템을 운영하고 있습니다.',
    scope: ['자동화 설계', 'Python 개발', '렌더링'],
    stack: ['Python', 'Ollama', 'FFmpeg']
  },
  {
    number: '06',
    slug: 'toris-blog',
    name: 'TORIS Archive',
    kind: '콘텐츠·신뢰 플랫폼',
    problem:
      '프로젝트와 기술 기록이 쌓일수록 검색과 탐색, 검색엔진 노출을 함께 관리해야 했습니다.',
    build:
      'MDX 아카이브, 카테고리·태그, 구조화 데이터, sitemap과 성능 계측을 Next.js에 통합했습니다.',
    result:
      '52개 이상의 기술 기록이 실제 개발과 운영 역량을 증명하는 지속 가능한 채널이 됐습니다.',
    scope: ['정보 구조', '프론트엔드', 'SEO·GEO', '운영'],
    stack: ['Next.js', 'MDX', 'Vercel'],
    image: '/images/projects/toris-blog.png',
    imageAlt: 'TORIS 기술 블로그 화면'
  }
];

export const studioProcess: StudioProcessStep[] = [
  {
    number: '01',
    label: 'Discover',
    title: '상담과 문제 정의',
    description:
      '사업 목표, 사용자, 일정과 예산을 확인하고 지금 만들어야 할 범위를 함께 좁힙니다.',
    output: '요구사항 요약 · 우선순위'
  },
  {
    number: '02',
    label: 'Shape',
    title: '제품 설계',
    description:
      '핵심 사용자 흐름, 화면 구조, 기술 경계를 정리해 개발 전에 위험을 먼저 드러냅니다.',
    output: '화면 흐름 · 기술 설계'
  },
  {
    number: '03',
    label: 'Build',
    title: '개발과 공유',
    description:
      '작동하는 결과를 짧은 주기로 공유하며 우선순위와 세부 경험을 함께 조정합니다.',
    output: '주간 빌드 · 변경 기록'
  },
  {
    number: '04',
    label: 'Ship',
    title: '출시와 운영',
    description:
      '배포, 도메인, 분석과 운영 문서까지 연결하고 다음 개선을 이어갈 수 있게 인계합니다.',
    output: '프로덕션 배포 · 운영 가이드'
  }
];

export const studioBusiness = {
  name: process.env.NEXT_PUBLIC_BUSINESS_NAME || 'TORIS',
  owner: process.env.NEXT_PUBLIC_BUSINESS_OWNER || '토리스',
  registrationNumber:
    process.env.NEXT_PUBLIC_BUSINESS_REGISTRATION_NUMBER || '',
  email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'ironjustlikethat@gmail.com',
  location: '대한민국 · 원격 협업'
};
