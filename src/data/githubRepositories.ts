export type RepositoryKind = 'Product' | 'Open source' | 'Learning' | 'Archive';

export interface GitHubRepository {
  repo: string;
  description: string;
  tech: string;
  kind: RepositoryKind;
}

const repository = (
  repo: string,
  description: string,
  tech: string,
  kind: RepositoryKind
): GitHubRepository => ({ repo, description, tech, kind });

/**
 * GitHub connector에서 확인한 toris-dev 공개 저장소 전체 목록.
 * 제품 쇼케이스와 별개로 학습·아카이브까지 누락 없이 탐색할 수 있게 유지한다.
 */
export const githubRepositories: GitHubRepository[] = [
  repository(
    'asyncraft',
    '취소 가능한 retry·timeout·circuit breaker를 제공하는 제로 의존성 비동기 툴킷.',
    'TypeScript',
    'Open source'
  ),
  repository(
    'torisui-kit',
    '접근성과 부드러운 상호작용을 기본값으로 둔 React 컴포넌트 시스템.',
    'React',
    'Open source'
  ),
  repository(
    'TraceDesk',
    '앱 사용과 집중 흐름을 로컬에서 기록하는 프라이버시 중심 데스크톱 도구.',
    'Tauri · Rust',
    'Product'
  ),
  repository(
    'devPulse',
    '개발 뉴스를 수집·요약해 카드와 영상으로 만드는 로컬 AI 파이프라인.',
    'Python',
    'Product'
  ),
  repository(
    'ym_guide',
    '청년 정책과 금융 혜택을 조건에 맞춰 추천하는 큐레이션 서비스.',
    'Next.js',
    'Product'
  ),
  repository(
    'bubbleBible-FE',
    '성경 읽기, 묵상 기록과 교회·소그룹 나눔을 연결하는 모바일 우선 플랫폼.',
    'React',
    'Product'
  ),
  repository(
    'PEPEBear',
    '지갑 연결과 게임화된 참여 경험을 담은 Solana 밈코인 프론트엔드.',
    'Solana · Next.js',
    'Product'
  ),
  repository(
    'YETI_SITE',
    '2004년 플래시 게임의 기억을 Solana 밈 프로젝트로 재해석한 공식 사이트.',
    'Next.js · Solana',
    'Product'
  ),
  repository(
    'CryptoTrade.gg',
    '거래 기록의 승률·손익·자산 배분을 한 화면에 보여주는 크립토 대시보드.',
    'Next.js · Web3',
    'Product'
  ),
  repository(
    'Toris_Blog',
    '기술 기록과 프로젝트를 한곳에 축적하는 현재의 개인 지식 베이스.',
    'Next.js',
    'Product'
  ),
  repository(
    'RanChat',
    'Supabase 실시간 통신을 활용한 블록체인 기반 익명 랜덤 채팅 실험.',
    'Next.js · Supabase',
    'Product'
  ),
  repository(
    'Infinity',
    '고객과 관리자 흐름, 주문과 결제를 구현한 20·30대 대상 의류 쇼핑몰.',
    'React · Express',
    'Product'
  ),
  repository(
    'WEB_CLOUD_Fellow-Friend_Trio',
    '군 장병과 또래 상담병을 익명 채팅·통화로 연결하는 비대면 상담 서비스.',
    'Web · Cloud',
    'Product'
  ),
  repository(
    'kakao_sw02_frontend',
    '군 장병 자살 예방 상담 앱의 React Native·Expo 프론트엔드.',
    'React Native',
    'Product'
  ),
  repository(
    'kakao_sw02_backend',
    '군 장병 상담 앱의 데이터와 상담 흐름을 담당하는 백엔드.',
    'Backend',
    'Product'
  ),
  repository(
    'Vulnerability_Web',
    '서버 취약점 분석 보고서와 진단 결과를 차트로 탐색하는 보안 대시보드.',
    'React · Firebase',
    'Product'
  ),
  repository(
    'nextjs-notion-blog',
    'Notion을 콘텐츠 저장소로 활용한 개인 블로그 구현.',
    'Next.js · Notion',
    'Product'
  ),
  repository(
    'ReactNative_Curved_Navigation_Bar',
    '곡선형 선택 상태와 애니메이션을 제공하는 React Native 내비게이션 바.',
    'React Native',
    'Open source'
  ),
  repository(
    'backend-interview-question',
    '백엔드 면접 질문과 핵심 답변을 함께 축적하는 커뮤니티형 지식 저장소.',
    'Markdown',
    'Open source'
  ),
  repository(
    'toris-dev.github.io',
    '초기 개인 포트폴리오와 개발자 아이덴티티를 담은 정적 사이트.',
    'Web',
    'Archive'
  ),
  repository(
    'toris-dev',
    'GitHub 프로필에서 기술 스택과 현재 관심사를 소개하는 프로필 저장소.',
    'Markdown',
    'Archive'
  ),
  repository(
    'obsidian_note',
    'Obsidian에서 작성한 개발 지식과 개인 노트를 보관하는 아카이브.',
    'Markdown',
    'Archive'
  ),
  repository(
    'TIL',
    'JavaScript·Next.js·Promise 등 매일 배운 핵심을 짧게 정리한 기록.',
    'Markdown',
    'Archive'
  ),
  repository(
    'DevOps_Code_Collection',
    'CI/CD와 IaC를 실습하며 재사용할 코드와 운영 메모를 모은 저장소.',
    'DevOps',
    'Learning'
  ),
  repository(
    'fastcampus-devops',
    'AWS 인프라 구축과 DevOps 운영 강의를 따라가며 만든 실습 기록.',
    'AWS · DevOps',
    'Learning'
  ),
  repository(
    'SpringBoot_lecture',
    'Spring Boot의 DI·AOP·JPA·Validation과 계층 설계를 익힌 실습.',
    'Spring Boot',
    'Learning'
  ),
  repository(
    'fastcampus-spring-practice',
    'Spring 기반 백엔드 강의 예제를 직접 구현한 연습 저장소.',
    'Spring',
    'Learning'
  ),
  repository(
    'nextAuth-Authentication-Authorization',
    'NextAuth, Prisma와 Postgres로 인증·인가 경계를 실습한 앱.',
    'Next.js · Prisma',
    'Learning'
  ),
  repository(
    'Next.js_study',
    'App Router와 Pages Router의 렌더링 전략을 비교한 Next.js 학습 모음.',
    'Next.js',
    'Learning'
  ),
  repository(
    'bun-nextjs-app',
    'Bun 런타임에서 Next.js 앱을 만들고 빌드하는 과정을 정리한 예제.',
    'Bun · Next.js',
    'Learning'
  ),
  repository(
    'bun-test',
    'Bun 런타임과 React 개발 흐름을 검증한 작은 실험.',
    'Bun · React',
    'Learning'
  ),
  repository(
    'chatApp',
    'Next.js App Router에서 채팅 UI와 데이터 흐름을 연습한 앱.',
    'Next.js',
    'Learning'
  ),
  repository(
    'coding-test-react',
    '컴포넌트 분리, 상태 처리와 테스트를 다루는 프론트엔드 코딩 과제.',
    'React · Vitest',
    'Learning'
  ),
  repository(
    'Algorithm_Problem',
    'JavaScript로 알고리즘 문제를 풀이하며 사고 과정을 기록한 저장소.',
    'JavaScript',
    'Learning'
  ),
  repository(
    'FastCampus_DataMining_Problem',
    '데이터 마이닝과 머신러닝 문제를 해결한 분석 실습.',
    'Python · ML',
    'Learning'
  ),
  repository(
    'eliceII_sql',
    'SQL 질의와 관계형 데이터 모델을 반복 훈련한 실습 저장소.',
    'SQL',
    'Learning'
  ),
  repository(
    'eliceII',
    '웹 개발 커리큘럼에서 만든 예제와 과제를 모은 학습 저장소.',
    'Web',
    'Learning'
  ),
  repository(
    'REST_API__Content_API_DATA',
    'REST API의 콘텐츠 구조와 데이터 요청을 실험한 예제.',
    'REST API',
    'Learning'
  ),
  repository(
    'python_DDOS_tools',
    '네트워크 공격 원리와 방어 관점을 학습하기 위한 초기 보안 실험 아카이브.',
    'Python · Security',
    'Archive'
  )
];

export const repositoryKinds: Array<'All' | RepositoryKind> = [
  'All',
  'Product',
  'Open source',
  'Learning',
  'Archive'
];
