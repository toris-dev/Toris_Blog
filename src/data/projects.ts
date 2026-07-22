/**
 * 개인 프로젝트 데이터 — 각 레포지토리 README 기반
 * 이미지: GitHub OpenGraph (https://opengraph.githubassets.com)
 */

export interface ProjectFeature {
  icon: string;
  title: string;
  description: string;
}

/** 목록 필터용 태그 */
export type ProjectTag =
  | 'Company'
  | 'Personal'
  | 'Web3'
  | 'Mobile'
  | 'Frontend'
  | 'Fullstack';

export interface Project {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  platform: string;
  year: string;
  status: '운영 중' | '개발 중' | '출시';
  tags: ProjectTag[];
  accent: {
    from: string;
    to: string;
    glow: string;
  };
  tech: string[];
  features: ProjectFeature[];
  github: string;
  image: string;
  imageAlt?: string;
  ctaLabel?: string;
  span: 'lg' | 'md' | 'sm';
}

const og = (repo: string) =>
  `https://opengraph.githubassets.com/1/toris-dev/${repo}`;

const gh = (repo: string) => `https://github.com/toris-dev/${repo}`;

const taglines = {
  '21n-apps': '서명에서 체결까지, 모델과 병원을 잇는 전자계약 운영 흐름',
  snapmate: '찍는 순간, 우리만의 갤러리에 쌓이는 사진',
  'bubble-bible': '말씀을 읽고, 기록하고, 함께 나누는 작은 습관',
  'dongne-paint': '선을 닫는 순간, 골목이 내 색으로 바뀐다',
  'youth-money-guide': '흩어진 청년 정책을 조건과 공식 출처로 확인하세요',
  'starlight-greenhouse': '별씨앗을 심고, 밤하늘 아래 천천히 키우는 온실',
  'volley-king-30': '리시브부터 스파이크까지, 단 30초의 랠리',
  'toris-docs': '기록이 프로젝트의 다음 행동으로 이어지는 지식 시스템',
  'product-growth-skills': '제품 성장 목표를 검증 가능한 에이전트 워크플로로'
} as const;

export const projects: Project[] = [
  {
    slug: 'builderstep',
    name: '빌더스텝',
    tagline: '혼자 만드는 제품, 다음 단계는 함께',
    description:
      '아이디어·검증·MVP·출시·사용자 확보·첫 매출·반복 매출·성장까지, 사업화 8단계 중 지금 내 위치를 진단하고 가장 중요한 다음 행동을 짚어주는 1인 빌더 성장 플랫폼. 진단·맞춤 로드맵·목표 트래킹·전문가 상담·지표 대시보드를 제공합니다.',
    category: '창업 · 운영 코파일럿',
    platform: 'Web · SaaS',
    year: '2026',
    status: '운영 중',
    tags: ['Company', 'Fullstack'],
    accent: { from: '#FF6D1F', to: '#FFA057', glow: 'rgba(255,109,31,0.32)' },
    tech: ['Next.js', 'Hono', 'Cloudflare', 'Firebase Auth'],
    features: [
      {
        icon: 'check',
        title: '단계 진단',
        description:
          '몇 개의 질문으로 지금 사업화 단계를 진단하고 다음 행동을 제안한다.'
      },
      {
        icon: 'map',
        title: '맞춤 로드맵',
        description:
          '진단 결과를 바탕으로 첫 매출까지 이어지는 개인화된 실행 경로를 그린다.'
      },
      {
        icon: 'chart',
        title: '지표 대시보드',
        description:
          '매출·사용자 데이터를 단계 목표와 연결해 진척을 한눈에 확인한다.'
      },
      {
        icon: 'users',
        title: '빌더 커뮤니티',
        description:
          '기록·피드백·빌더 매칭으로 혼자 헤매지 않도록 함께 나아간다.'
      }
    ],
    github: 'https://builder.toris.kr',
    image: '/og-default.png',
    ctaLabel: '서비스 열기',
    span: 'lg'
  },
  {
    slug: 'knotice',
    name: 'k-notice',
    tagline: '문 앞의 한국어 안내문이, 실행 가능한 계획으로',
    description:
      '한국에 사는 사람을 위한 안내문 리더. 한국어 고지서·안내문의 텍스트를 읽어 날짜와 해야 할 행동을 뽑아내고, 애매한 부분은 표시하며 단계별 계획으로 바꿔준다. 영어·일본어·중국어·한국어를 지원하며, 사진은 기기 안에 머물고 인식된 텍스트만 처리하는 온디바이스 파이프라인.',
    category: '문서 분석 · 생활 도구',
    platform: 'Web · Touch',
    year: '2026',
    status: '운영 중',
    tags: ['Company', 'Frontend'],
    accent: { from: '#2563EB', to: '#38BDF8', glow: 'rgba(37,99,235,0.32)' },
    tech: ['OCR', 'On-Device', 'Cloudflare', '다국어'],
    features: [
      {
        icon: 'camera',
        title: '사진 한 장이면',
        description:
          '안내문을 찍으면 텍스트를 인식해 핵심 정보를 정리한다 — 사진은 기기 밖으로 나가지 않는다.'
      },
      {
        icon: 'check',
        title: '해야 할 행동 추출',
        description:
          '무엇을, 언제까지 해야 하는지 명확한 액션으로 정리하고 애매한 항목은 표시한다.'
      },
      {
        icon: 'clock',
        title: '마감일 정리',
        description:
          '흩어진 날짜를 모아 놓치지 않도록 단계별 계획으로 이어준다.'
      },
      {
        icon: 'globe',
        title: '4개 언어 지원',
        description:
          '영어·일본어·중국어·한국어로, 한국에 사는 누구나 안내문을 이해할 수 있게.'
      }
    ],
    github: 'https://knotice.pages.dev',
    image: '/og-default.png',
    ctaLabel: '서비스 열기',
    span: 'md'
  },
  {
    slug: 'hanbutgil-garden',
    name: '한붓길 정원',
    tagline: '한 번의 선으로, 고요한 정원을 완성하세요',
    description:
      '정원 타일 위의 모든 길을 한 번씩 이어 출발점과 도착점을 연결하는 온라인 한붓그리기 논리 퍼즐. 돌과 꽃을 피해 경로를 읽고, 손끝으로 초록빛 길을 완성하는 짧고 편안한 두뇌 휴식입니다.',
    category: '게임 · 논리 퍼즐',
    platform: 'Web · Touch',
    year: '2026',
    status: '개발 중',
    tags: ['Personal', 'Frontend'],
    accent: { from: '#5F8F2B', to: '#FF7657', glow: 'rgba(95,143,43,0.32)' },
    tech: ['Web Game', 'Logic Puzzle', 'Responsive UI'],
    features: [
      {
        icon: 'map',
        title: '한 번에 잇는 정원 길',
        description:
          '출발점에서 도착점까지 끊기지 않는 한 줄로 타일을 잇는 직관적인 규칙.'
      },
      {
        icon: 'layers',
        title: '돌과 꽃이 만드는 제약',
        description:
          '지나갈 수 없는 돌과 정원 오브젝트가 매 스테이지마다 새로운 사고 경로를 만든다.'
      },
      {
        icon: 'smartphone',
        title: '손끝에 맞춘 조작',
        description:
          '마우스와 터치 모두에서 자연스럽게 이어지는 짧고 명확한 퍼즐 플레이.'
      },
      {
        icon: 'heart',
        title: '고요한 정원 감성',
        description:
          '한지빛 바탕, 이끼 낀 돌과 계절 꽃으로 경쟁보다 몰입과 휴식에 집중.'
      }
    ],
    github: gh('hanbutgil_garden'),
    image: '/images/projects/hanbutgil-garden.png',
    span: 'lg'
  },
  {
    slug: 'memecatch',
    name: '밈캐치',
    tagline: '그 밈, 3초 안에 — 한국 밈 트렌드 사전',
    description:
      '유행하는 밈·유행어·챌린지의 뜻과 유래, 그리고 "지금 써도 되는지"까지 알려주는 한국 밈 트렌드 사전. 사용 안전 신호등과 밈 생명 게이지로 1,733개 밈을 큐레이션하고, 초성 검색·상황별 사용 가이드·제보 검수 시스템을 갖춘 PWA 서비스입니다.',
    category: '트렌드 사전 · 커뮤니티',
    platform: 'Web · PWA',
    year: '2026',
    status: '운영 중',
    tags: ['Personal', 'Frontend', 'Fullstack'],
    accent: { from: '#F97316', to: '#FBBF24', glow: 'rgba(249,115,22,0.35)' },
    tech: [
      'Next.js 16',
      'React 19',
      'TypeScript',
      'Tailwind CSS v4',
      'Supabase',
      'Serwist PWA'
    ],
    features: [
      {
        icon: 'shield',
        title: '사용 안전 신호등',
        description:
          '"지금 써도 되는가"를 색+아이콘+텍스트로. 써도 됨/맥락 주의/이미 늦음/쓰면 위험, 직장·친구·자녀·SNS 상황별 가이드까지.'
      },
      {
        icon: 'activity',
        title: '밈 생명 게이지',
        description:
          '급상승 → 유행 → 식는 중 → 추억. 밈의 생애주기를 불꽃 미터로 시각화하고 트렌드 점수를 pg_cron 일배치로 갱신.'
      },
      {
        icon: 'zap',
        title: '초성·유사어 검색',
        description:
          'Postgres pg_trgm + 초성 generated column으로 한국어 검색 구현. "ㅇㅍㅌ"만 쳐도 영포티가 나온다.'
      },
      {
        icon: 'users',
        title: '제보·검수 커뮤니티',
        description:
          '실시간 중복 검사로 새 밈 제보, RLS 기본 deny + security definer RPC로 안전한 반응·댓글·신고.'
      }
    ],
    github: 'https://catchmeme.com',
    image: og('memeCatch'),
    span: 'lg'
  },
  {
    slug: 'coursepick',
    name: '코스픽',
    tagline: '오늘 걷기 좋은 길을 골라드립니다',
    description:
      '내 상황(누구와, 목적, 시간, 조건)에 맞는 산책·러닝·등산 코스를 추천하는 한국형 코스 큐레이션 앱. 지도가 아니라 "실패 없는 코스 선택"이 핵심 — 강아지 데려가도 되는지, 유모차가 되는지, 밤에 안전한지에 답합니다.',
    category: '아웃도어 · 큐레이션',
    platform: 'Mobile (Android 우선)',
    year: '2026',
    status: '개발 중',
    tags: ['Personal', 'Mobile'],
    accent: { from: '#22C55E', to: '#4ADE80', glow: 'rgba(34,197,94,0.35)' },
    tech: ['Flutter', 'Dart', 'Kakao Map', 'Supabase', 'AdMob'],
    features: [
      {
        icon: 'pin',
        title: '상황별 코스 추천',
        description:
          '"오늘 어디 걷지?" 상황 버튼 6개 — 누구와, 무슨 목적으로, 얼마나 걸을지로 코스를 좁혀준다.'
      },
      {
        icon: 'check',
        title: '실패 방지 정보 중심',
        description:
          '반려견 동반, 유모차 통행, 야간 안전, 화장실 위치 — 걷기 전에 알아야 할 조건을 상세 화면 최상단에.'
      },
      {
        icon: 'map',
        title: '카카오맵 폴리라인',
        description: '코스 경로를 지도 위 폴리라인으로 시각화하고 저장.'
      }
    ],
    // 저장소 비공개 → 방문자용 링크는 GitHub 프로필로
    github: 'https://github.com/toris-dev',
    image: og('coursepick'),
    span: 'md'
  },
  {
    slug: 'golmok-survivor',
    name: '골목길 생존기',
    tagline: '서울 골목, 한 칸만 더 — 한국형 무한 횡단 게임',
    description:
      '한국의 도로·골목·지하철·시장·한강을 한 칸씩 건너며 기록을 갱신하는 원터치 하이퍼캐주얼 게임. Crossy Road류의 검증된 손맛에 한국 도시 생활 풍경을 입혔습니다. Flutter + Flame 엔진, 3-레이어 디자인 토큰 시스템으로 제작 중.',
    category: '게임 · 하이퍼캐주얼',
    platform: 'Mobile (Android → iOS)',
    year: '2026',
    status: '개발 중',
    tags: ['Personal', 'Mobile'],
    accent: { from: '#16C172', to: '#FF7A1A', glow: 'rgba(22,193,114,0.35)' },
    tech: ['Flutter', 'Flame', 'Dart', 'AdMob'],
    features: [
      {
        icon: 'gamepad',
        title: '원터치 횡단 손맛',
        description:
          '탭/스와이프만으로 전진·좌우·후진. 조작 즉시 반응, 억울하지 않은 죽음이 MVP 4대 목표.'
      },
      {
        icon: 'map',
        title: '한국 도시 테마',
        description:
          '골목·지하철·시장·한강 — 매일 지나치는 서울 풍경을 레인으로. 건너가 그린 × 택시 오렌지 브랜드.'
      },
      {
        icon: 'layers',
        title: '토큰 기반 디자인 시스템',
        description:
          'primitive→semantic→component 3-레이어 토큰을 Flutter ThemeData로 브릿지해 브랜드 일관성 유지.'
      }
    ],
    // 저장소 비공개 → 방문자용 링크는 GitHub 프로필로
    github: 'https://github.com/toris-dev',
    image: og('hwanseung-jiok'),
    span: 'md'
  },
  {
    slug: 'asyncraft',
    name: 'asyncraft',
    tagline: '실패하는 비동기 흐름을 견고하게 만드는 제로 의존성 툴킷',
    description:
      'retry, timeout, circuit breaker, 동시성 제한, async map, single-flight memoize를 하나의 작고 조합 가능한 패키지로 제공하는 TypeScript 라이브러리. 모든 대기가 AbortSignal을 지원하며 ESM·CJS와 완전한 타입 추론을 함께 제공합니다.',
    category: 'Developer Tool · npm',
    platform: 'Library (Node.js ≥ 18)',
    year: '2026',
    status: '운영 중',
    tags: ['Personal', 'Fullstack'],
    accent: { from: '#22D3EE', to: '#8B5CF6', glow: 'rgba(34,211,238,0.35)' },
    tech: ['TypeScript', 'Node.js', 'Vitest', 'tsup', 'fast-check'],
    features: [
      {
        icon: 'zap',
        title: '10개의 비동기 프리미티브',
        description:
          'retry·timeout·circuit breaker·concurrency limit부터 memoize·debounce까지 한 패키지에서 조합.'
      },
      {
        icon: 'shield',
        title: 'AbortSignal everywhere',
        description:
          '대기, 재시도, 큐에 들어간 작업까지 취소 가능. 타이머와 이벤트 리스너 누수를 테스트로 방지.'
      },
      {
        icon: 'layers',
        title: 'Zero dependency · Tree-shakeable',
        description:
          '런타임 의존성 없이 필요한 함수만 번들에 포함. ESM·CJS·타입 선언을 동시에 배포.'
      },
      {
        icon: 'cpu',
        title: 'AI-friendly API',
        description:
          '전체 TSDoc과 llms.txt로 개발자와 코딩 에이전트가 올바른 프리미티브를 빠르게 선택.'
      }
    ],
    github: gh('asyncraft'),
    image: og('asyncraft'),
    span: 'lg'
  },
  {
    slug: 'torisui-kit',
    name: 'TorisUI Kit',
    tagline:
      'Fluid, accessible, dark-first — 제품을 빠르게 만드는 React UI 시스템',
    description:
      '@toris-dev/ui로 배포되는 모던 React 컴포넌트 라이브러리. Soft-glass 비주얼, 유연한 디자인 토큰, 키보드 접근성, reduced-motion 대응과 30개 이상의 프로덕션 컴포넌트를 모노레포·문서 플레이그라운드·자동 릴리스 파이프라인으로 관리합니다.',
    category: 'Design System · npm',
    platform: 'React Library · Web',
    year: '2026',
    status: '운영 중',
    tags: ['Personal', 'Frontend'],
    accent: { from: '#A855F7', to: '#EC4899', glow: 'rgba(168,85,247,0.38)' },
    tech: ['React', 'TypeScript', 'CSS', 'Vitest', 'pnpm'],
    features: [
      {
        icon: 'layers',
        title: '30+ 프로덕션 컴포넌트',
        description:
          'Button·Dialog·Tabs·Toast·Data display까지 실제 제품에 필요한 인터랙션을 일관된 API로 제공.'
      },
      {
        icon: 'award',
        title: '접근성 기본값',
        description:
          'WAI-ARIA 패턴, roving focus, focus trap, 키보드·터치 조작과 reduced-motion을 기본 지원.'
      },
      {
        icon: 'activity',
        title: 'Fluid soft-glass motion',
        description:
          '다크 퍼스트 글래스 표면과 토큰 기반 테마, 부담 없이 반응하는 마이크로 인터랙션.'
      },
      {
        icon: 'check',
        title: '검증된 릴리스 하네스',
        description:
          'lint·typecheck·test·build 품질 게이트와 Changesets·Trusted Publishing으로 안전하게 배포.'
      }
    ],
    github: gh('torisui-kit'),
    image: og('torisui-kit'),
    span: 'md'
  },
  {
    slug: 'ym-guide',
    name: 'YM Guide',
    tagline: '나에게 맞는 청년 정책·금융 혜택을 한 번에',
    description:
      '흩어진 청년 정책·금융·복지 혜택을 조건 기반으로 큐레이션하는 플랫폼. 나이·지역·소득·관심사를 입력하면 맞춤 정책을 추천하고 금융 교육 콘텐츠까지 제공하는, 공공서비스보다 친절한 SaaS 경험입니다.',
    category: '정책 · 금융 큐레이션',
    platform: 'Web',
    year: '2026',
    status: '개발 중',
    tags: ['Personal', 'Frontend', 'Fullstack'],
    accent: { from: '#3B82F6', to: '#22C55E', glow: 'rgba(59,130,246,0.35)' },
    tech: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Supabase'],
    features: [
      {
        icon: 'list',
        title: '조건 기반 정책 추천',
        description: '나이·지역·소득·관심사 조건으로 맞춤 정책을 필터링해 추천.'
      },
      {
        icon: 'award',
        title: '정책 카드 큐레이션',
        description: '복잡한 정책을 한눈에 보는 카드 UI와 매칭도 표시.'
      },
      {
        icon: 'chart',
        title: '금융 교육 대시보드',
        description: '청년 금융 리터러시를 높이는 학습 콘텐츠와 진행 지표.'
      },
      {
        icon: 'users',
        title: '친절한 공공 SaaS UX',
        description:
          '공공 서비스의 딱딱함을 걷어낸 신뢰감 있고 접근성 높은 인터페이스.'
      }
    ],
    github: gh('ym_guide'),
    image: '/images/projects/ym-guide.png',
    span: 'md'
  },
  {
    slug: 'cryptotrade-gg',
    name: 'CryptoTrade.gg',
    tagline: '암호화폐 트레이드 전적을 데이터로 증명',
    description:
      '거래소 트레이드 기록을 불러와 승률·손익(PnL)·자산 배분을 시각화하는 크립토 트레이딩 대시보드. 트레이더의 전적을 한 페이지에 정리해 데이터로 실력을 보여주는 op.gg 스타일 서비스입니다.',
    category: 'Web3 · 데이터 대시보드',
    platform: 'Web',
    year: '2025',
    status: '개발 중',
    tags: ['Personal', 'Web3', 'Frontend', 'Fullstack'],
    accent: { from: '#3B82F6', to: '#22D3EE', glow: 'rgba(59,130,246,0.35)' },
    tech: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Recharts', 'Web3'],
    features: [
      {
        icon: 'chart',
        title: 'PnL 성과 차트',
        description: '기간별 손익 곡선을 인터랙티브 라인 차트로 시각화.'
      },
      {
        icon: 'trending',
        title: '승률 · ROI 카드',
        description:
          '승률·총 수익률·거래 횟수 등 핵심 지표를 카운트업으로 강조.'
      },
      {
        icon: 'list',
        title: '자산 배분 테이블',
        description: '보유 토큰별 비중과 성과를 테이블로 한눈에.'
      },
      {
        icon: 'activity',
        title: '데이터 중심 대시보드',
        description: '트레이딩 터미널처럼 날카로운 다크 UI와 데이터 밀도.'
      }
    ],
    github: gh('CryptoTrade.gg'),
    image: '/images/projects/cryptotrade.png',
    span: 'md'
  },
  {
    slug: 'love-trip',
    name: 'LOVETRIP',
    tagline: '교통·숙소·데이트 코스·경비를 한 번에, 맞춤형 여행 설계',
    description:
      '데이트 코스와 여행 코스를 찾는 모든 사람을 위한 올인원 여행 플랫폼. 출발지·목적지·예산·일정만 입력하면 최적의 교통편, 숙소, 데이트 코스를 자동으로 생성하고, 앨범과 지출 기록까지 추억을 한곳에 저장합니다.',
    category: '여행 플랫폼',
    platform: 'Web',
    year: '2026',
    status: '개발 중',
    accent: { from: '#F43F5E', to: '#FB7185', glow: 'rgba(244,63,94,0.35)' },
    tech: [
      'Next.js 16',
      'React 19',
      'TypeScript',
      'Supabase',
      'Naver Maps',
      'Tour API'
    ],
    features: [
      {
        icon: 'map',
        title: '여행 추천 & 일정 플래너',
        description:
          '출발지·목적지·예산·일정 입력 시 최적 교통편 + 숙소 + 데이트 코스를 자동 생성. Tour API 실시간 관광 정보와 네이버 지도 통합.'
      },
      {
        icon: 'heart',
        title: '데이트 장소 큐레이션',
        description:
          '지역별 분위기 좋은 카페, 레스토랑, 야경 명소, 전시회, 드라이브 코스를 타겟별 테마로 추천.'
      },
      {
        icon: 'dollar',
        title: '자동 예산 관리 & 1/N 정산',
        description:
          '경비 계산과 분담의 번거로움을 해결. 지출 기록과 자동 정산으로 여행 후 스트레스 제로.'
      },
      {
        icon: 'users',
        title: '협업형 여행 설계',
        description:
          '함께 쓰는 공동 여행 설계 툴. 사용자가 만든 데이트 코스를 탐색하고 나만의 코스를 공유하는 UGC 커뮤니티.'
      }
    ],
    tags: ['Personal', 'Fullstack', 'Frontend'],
    // 저장소는 비공개 → 방문자용 링크는 라이브 서비스로 연결
    github: 'https://love2trip.vercel.app',
    image: '/images/projects/love-trip.png',
    span: 'lg'
  },
  {
    slug: 'tracedesk',
    name: 'TraceDesk',
    tagline: '하루를 되짚어보는 인터랙티브 개인 활동 일지',
    description:
      'PC에서의 앱 사용, 복사·붙여넣기, 캡처, 유휴 시간을 로컬 SQLite에 기록하는 Tauri 데스크톱 앱. Rust 백그라운드 에이전트와 React UI가 하나의 앱으로 통합되어, 별도 서버나 외부 전송 없이 완전히 로컬에서 동작합니다.',
    category: '생산성 도구',
    platform: 'Desktop (macOS · Windows · Linux)',
    year: '2026',
    status: '운영 중',
    accent: { from: '#6366F1', to: '#8B5CF6', glow: 'rgba(99,102,241,0.35)' },
    tech: ['Tauri', 'Rust', 'React', 'TypeScript', 'SQLite'],
    features: [
      {
        icon: 'activity',
        title: '백그라운드 활동 수집',
        description:
          '앱 포커스, 유휴, 복사/붙여넣기, 스크린샷을 시스템 트레이에 상주하며 자동 수집. 창을 닫아도 기록은 계속.'
      },
      {
        icon: 'list',
        title: '타임라인 활동 일지',
        description:
          '필터 가능한 타임라인 피드. 항목 클릭 시 상세 패널로 그날의 흐름을 되짚기.'
      },
      {
        icon: 'chart',
        title: '생산성 분석',
        description:
          '생산성 점수, 주간 리포트, 시간별 집중도, 유휴 분석까지 — 데이터로 보는 나의 하루.'
      },
      {
        icon: 'shield',
        title: '완전 로컬 & 프라이버시',
        description:
          '모든 데이터는 로컬 SQLite에만 저장. 외부 전송 없음, 월별 gzip 아카이브와 보관 기간 설정 지원.'
      },
      {
        icon: 'download',
        title: 'JSON / CSV 내보내기',
        description: '날짜·범위를 골라 JSON 또는 Excel 호환 CSV로 내보내기.'
      },
      {
        icon: 'monitor',
        title: '시스템 모니터',
        description:
          'CPU · 메모리 · 포트 모니터 내장. 한국어/English, 라이트/다크 테마.'
      }
    ],
    tags: ['Personal', 'Fullstack'],
    // 데스크톱 앱 — 릴리스(다운로드) 페이지로 연결
    github: 'https://github.com/toris-dev/TraceDesk/releases',
    image: og('TraceDesk'),
    span: 'sm'
  },
  {
    slug: 'devpulse',
    name: 'devPulse',
    tagline: '로컬 LLM이 만드는 개발 뉴스 카드뉴스 & 비디오',
    description:
      '개발 뉴스를 크롤링하고 로컬 LLM으로 요약해 카드뉴스와 비디오까지 자동 생성하는 콘텐츠 파이프라인. API 비용 없이 로컬 모델만으로 수집 → 요약 → 디자인 → 렌더링을 완전 자동화합니다.',
    category: 'AI 파이프라인',
    platform: 'CLI · Automation',
    year: '2026',
    status: '운영 중',
    accent: { from: '#22C55E', to: '#4ADE80', glow: 'rgba(34,197,94,0.35)' },
    tech: ['Python', 'Local LLM', 'Ollama', 'FFmpeg', 'Web Crawling'],
    features: [
      {
        icon: 'globe',
        title: '개발 뉴스 크롤링',
        description:
          '주요 개발 뉴스 소스를 주기적으로 수집하는 크롤러 파이프라인.'
      },
      {
        icon: 'cpu',
        title: '로컬 LLM 요약',
        description:
          'API 비용 없이 로컬 LLM으로 뉴스 요약 및 핵심 인사이트 추출. 프라이버시와 비용을 동시에.'
      },
      {
        icon: 'layers',
        title: '카드뉴스 자동 생성',
        description: '요약된 콘텐츠를 시각적 카드뉴스 이미지로 자동 디자인.'
      },
      {
        icon: 'video',
        title: '비디오 렌더링',
        description:
          '카드뉴스를 이어붙여 숏폼 비디오까지 생성하는 엔드투엔드 파이프라인.'
      }
    ],
    tags: ['Personal', 'Fullstack'],
    github: gh('devPulse'),
    image: og('devPulse'),
    span: 'md'
  },
  {
    slug: 'loca',
    name: 'Loca',
    tagline: '지하철역 500m, 익명 실시간 대화',
    description:
      '지하철역 반경 500m 안의 사람들과 익명으로 실시간 대화하는 위치 기반 채팅 앱. 매일 스쳐 지나가는 사람들과 지금 이 순간, 같은 공간의 이야기를 나눕니다.',
    category: '위치기반 소셜',
    platform: 'Mobile (iOS · Android)',
    year: '2026',
    status: '개발 중',
    accent: { from: '#06B6D4', to: '#22D3EE', glow: 'rgba(6,182,212,0.35)' },
    tech: ['Flutter', 'Dart', 'Geolocation', 'Realtime Chat'],
    features: [
      {
        icon: 'pin',
        title: '역 반경 500m 채팅방',
        description:
          '지하철역을 중심으로 한 하이퍼로컬 채팅방. 지금 같은 역 근처에 있는 사람들과만 연결.'
      },
      {
        icon: 'message',
        title: '익명 실시간 대화',
        description:
          '부담 없는 익명 기반 실시간 채팅. 출퇴근길의 공감대를 가볍게 나누기.'
      },
      {
        icon: 'smartphone',
        title: 'Flutter 크로스플랫폼',
        description:
          '하나의 코드베이스로 iOS와 Android를 동시에. 네이티브급 성능.'
      }
    ],
    tags: ['Personal', 'Mobile'],
    // 저장소는 비공개 → 방문자용 링크는 라이브 서비스로 연결
    github: 'https://loca.vercel.app',
    image: og('loca'),
    span: 'md'
  },
  {
    slug: 'pepebear',
    name: 'PEPEBear',
    tagline: 'HODL, laugh, moon — 게임화된 Solana 밈코인 경험',
    description:
      'Solana 블록체인 위에 구축된 커뮤니티 드리븐 밈코인 프론트엔드. 지갑 연동, 포인트·업적·레벨 게임화, 실시간 홀더 트래킹, Launch → Growth → Moon 페이즈 타임라인을 부드러운 애니메이션으로 담았습니다.',
    category: 'Web3 · 크립토',
    platform: 'Web',
    year: '2025',
    status: '출시',
    accent: { from: '#10B981', to: '#84CC16', glow: 'rgba(16,185,129,0.35)' },
    tech: ['Next.js', 'React', 'Solana', 'Anchor', 'Web3.js', 'TypeScript'],
    features: [
      {
        icon: 'wallet',
        title: 'Solana 지갑 연동',
        description: 'Phantom, Solflare 등 주요 지갑을 원클릭으로 연결.'
      },
      {
        icon: 'gamepad',
        title: '게임화 경험',
        description:
          '참여로 포인트를 얻고 업적을 해금하고 레벨업하는 홀더 경험.'
      },
      {
        icon: 'trending',
        title: '실시간 홀더 트래킹',
        description:
          '토큰 홀더, 볼륨, 참여 지표를 라이브로. 순위 변동 애니메이션으로 생동감 있게.'
      },
      {
        icon: 'rocket',
        title: '페이즈 타임라인',
        description: 'Launch → Growth → Moon, 단계 기반 성장 로드맵 시각화.'
      }
    ],
    tags: ['Personal', 'Web3', 'Frontend'],
    github: gh('PEPEBear'),
    image: og('PEPEBear'),
    span: 'sm'
  },
  {
    slug: 'yeti',
    name: 'YETI',
    tagline: '전설의 2004 플래시 게임, Solana로 돌아오다',
    description:
      '펭귄을 날려버리던 그 예티가 밈코인으로 부활. Pump.fun에서 런칭한 Solana 밈코인 YETI의 공식 웹사이트. 추억을 가진 밀레니얼을 위한 노스탤지어 프로젝트, PENGUIN GO FLY.',
    category: 'Web3 · 크립토',
    platform: 'Web',
    year: '2025',
    status: '출시',
    accent: { from: '#0EA5E9', to: '#7DD3FC', glow: 'rgba(14,165,233,0.35)' },
    tech: ['Next.js', 'TypeScript', 'Solana', 'Pump.fun'],
    features: [
      {
        icon: 'rocket',
        title: '토큰 런칭 사이트',
        description:
          'Pump.fun 런칭과 함께한 공식 웹사이트. 홀더 온보딩의 시작점.'
      },
      {
        icon: 'list',
        title: '4단계 로드맵',
        description:
          '토큰 런칭 → 커뮤니티 확장 → 거래소 상장 → 생태계 확장(게임 리메이크·NFT).'
      },
      {
        icon: 'gamepad',
        title: '노스탤지어 브랜딩',
        description: '2004 플래시 게임 감성을 현대적 웹 경험으로 재해석.'
      }
    ],
    tags: ['Personal', 'Web3', 'Frontend'],
    github: gh('YETI_SITE'),
    image: og('YETI_SITE'),
    span: 'sm'
  },
  {
    slug: '21n-apps',
    name: '21n Apps',
    tagline: taglines['21n-apps'],
    description:
      '모델과 병원이 역할별 화면에서 계약 초안, 서명, 확인과 체결 상태를 이어가는 전자계약 운영 모노레포입니다.',
    category: '전자계약 · 운영 플랫폼',
    platform: 'Web · Monorepo',
    year: '2026',
    status: '개발 중',
    tags: ['Company', 'Fullstack'],
    accent: { from: '#2563EB', to: '#34D399', glow: 'rgba(37,99,235,0.32)' },
    tech: ['Next.js', 'NestJS', 'TypeScript', 'PostgreSQL'],
    features: [
      {
        icon: 'users',
        title: '역할별 계약 흐름',
        description:
          '모델과 병원이 각자의 단계에서 같은 계약 진행 상태를 확인합니다.'
      },
      {
        icon: 'activity',
        title: '계약 상태 타임라인',
        description: '초안, 서명, 확인과 체결 완료를 순서와 상태로 추적합니다.'
      },
      {
        icon: 'layers',
        title: '모노레포 운영 경계',
        description:
          '프론트엔드와 API의 책임을 나누면서 하나의 제품 흐름으로 관리합니다.'
      }
    ],
    github: 'https://github.com/toris-dev',
    image: '/images/projects/21n-apps/cover.svg',
    imageAlt: '21n Apps 전자계약 상태 흐름 그래픽',
    ctaLabel: 'GitHub 프로필 보기',
    span: 'lg'
  },
  {
    slug: 'snapmate',
    name: 'SnapMate',
    tagline: taglines.snapmate,
    description:
      '카메라로 남긴 순간을 친구와 가족의 그룹별 갤러리에 바로 모아 보는 따뜻한 모바일 사진 공유 앱입니다.',
    category: '사진 · 그룹 공유',
    platform: 'Mobile (iOS · Android)',
    year: '2026',
    status: '개발 중',
    tags: ['Personal', 'Mobile', 'Fullstack'],
    accent: { from: '#FB923C', to: '#FB7185', glow: 'rgba(251,146,60,0.32)' },
    tech: ['Expo', 'React Native', 'TypeScript', 'Firebase'],
    features: [
      {
        icon: 'camera',
        title: '카메라에서 바로 공유',
        description:
          '앱 안에서 촬영한 사진을 선택한 그룹의 흐름으로 바로 연결합니다.'
      },
      {
        icon: 'users',
        title: '그룹별 순간 보관',
        description:
          '커플, 가족과 친구의 사진을 그룹 단위 갤러리로 구분해 봅니다.'
      },
      {
        icon: 'heart',
        title: '따뜻한 스토어 경험',
        description:
          '크림과 피치 톤의 브랜드 자산으로 촬영과 공유의 감정을 일관되게 전합니다.'
      }
    ],
    github: 'https://github.com/toris-dev',
    image: '/images/projects/snapmate/feature.png',
    imageAlt: 'SnapMate 그룹 사진 공유 기능 소개 이미지',
    ctaLabel: 'GitHub 프로필 보기',
    span: 'lg'
  },
  {
    slug: 'bubble-bible',
    name: 'Bubble Bible',
    tagline: taglines['bubble-bible'],
    description:
      '매일 성경을 읽고 묵상을 기록하며 교회와 소그룹에 나누는 흐름을 연결한 모바일 우선 커뮤니티 앱입니다.',
    category: '성경 · 커뮤니티',
    platform: 'Mobile · Web',
    year: '2026',
    status: '개발 중',
    tags: ['Personal', 'Mobile', 'Fullstack'],
    accent: { from: '#C99A36', to: '#7393B3', glow: 'rgba(201,154,54,0.30)' },
    tech: ['Expo', 'React Native', 'TypeScript', 'Supabase'],
    features: [
      {
        icon: 'book',
        title: '오늘의 말씀 읽기',
        description:
          '오늘 읽을 말씀과 읽기 흐름을 모바일 화면에서 차분하게 이어갑니다.'
      },
      {
        icon: 'activity',
        title: '묵상과 연속 기록',
        description: '읽기 완료와 개인 묵상을 기록해 매일의 습관을 확인합니다.'
      },
      {
        icon: 'users',
        title: '교회·소그룹 나눔',
        description: '개인의 읽기 경험을 교회와 소그룹의 나눔으로 연결합니다.'
      }
    ],
    github: gh('bubbleBible-FE'),
    image: '/images/projects/bubble-bible/feature.png',
    imageAlt: 'Bubble Bible 말씀 읽기와 나눔 기능 소개 이미지',
    span: 'md'
  },
  {
    slug: 'dongne-paint',
    name: '동네 칠하기 대작전',
    tagline: taglines['dongne-paint'],
    description:
      '골목 타일 위에 경로를 그리고 출발 영역으로 돌아와 내부를 점령하며 AI 봇과 경쟁하는 모바일 캐주얼 게임입니다.',
    category: '게임 · 영역 점령',
    platform: 'Mobile',
    year: '2026',
    status: '개발 중',
    tags: ['Personal', 'Mobile'],
    accent: { from: '#18B87A', to: '#FF6B4A', glow: 'rgba(24,184,122,0.32)' },
    tech: ['Flutter', 'Flame', 'Dart', 'Local Save'],
    features: [
      {
        icon: 'map',
        title: '닫힌 경로로 점령',
        description:
          '드래그한 경로가 출발 영역에 닿으면 닫힌 내부 타일을 내 색으로 바꿉니다.'
      },
      {
        icon: 'gamepad',
        title: 'AI 봇 경쟁',
        description:
          '서버 멀티플레이가 아닌 AI 봇과 같은 보드의 영역을 두고 경쟁합니다.'
      },
      {
        icon: 'save',
        title: '로컬 진행 저장',
        description: '게임 진행 상태를 기기에 보관해 다음 플레이에 이어갑니다.'
      }
    ],
    github: 'https://github.com/toris-dev',
    image: '/images/projects/dongne-paint/cover.svg',
    imageAlt: '동네 칠하기 대작전 영역 점령 게임 커버',
    ctaLabel: 'GitHub 프로필 보기',
    span: 'md'
  },
  {
    slug: 'youth-money-guide',
    name: '청년머니가이드',
    tagline: taglines['youth-money-guide'],
    description:
      '청년 정책과 생활 금융 정보를 조건으로 좁히고 공식 출처와 검토 기준을 함께 확인하는 콘텐츠 서비스입니다.',
    category: '정책 · 생활 금융',
    platform: 'Web',
    year: '2026',
    status: '운영 중',
    tags: ['Personal', 'Frontend', 'Fullstack'],
    accent: { from: '#1D4ED8', to: '#10B981', glow: 'rgba(29,78,216,0.30)' },
    tech: ['Next.js', 'TypeScript', 'Content Curation'],
    features: [
      {
        icon: 'filter',
        title: '조건별 정책 탐색',
        description:
          '나이, 지역과 관심사를 기준으로 필요한 정책 정보를 좁혀 봅니다.'
      },
      {
        icon: 'shield',
        title: '공식 출처와 검토일',
        description:
          '정보의 원문 출처와 검토 기준을 함께 표시해 재확인 경로를 제공합니다.'
      },
      {
        icon: 'check',
        title: '정책·제휴 경계 표시',
        description: '공식 정책 정보와 제휴 콘텐츠의 성격을 구분해 보여줍니다.'
      }
    ],
    github: 'https://github.com/toris-dev',
    image: '/images/projects/youth-money-guide/cover.png',
    imageAlt: '청년머니가이드 정책 정보 탐색 대표 이미지',
    ctaLabel: 'GitHub 프로필 보기',
    span: 'md'
  },
  {
    slug: 'starlight-greenhouse',
    name: '별빛 온실',
    tagline: taglines['starlight-greenhouse'],
    description:
      '별씨앗에서 별가루를 모으고 설비를 열어 생산을 키우며 오프라인 보상으로 돌아오는 모바일 방치형 게임입니다.',
    category: '게임 · 방치형 성장',
    platform: 'Mobile',
    year: '2026',
    status: '개발 중',
    tags: ['Personal', 'Mobile'],
    accent: { from: '#7C5CFC', to: '#74D9E8', glow: 'rgba(124,92,252,0.34)' },
    tech: ['Flutter', 'Dart', 'Local Save'],
    features: [
      {
        icon: 'star',
        title: '별씨앗 수확',
        description: '별씨앗을 돌보며 첫 자원인 별가루를 모읍니다.'
      },
      {
        icon: 'activity',
        title: '설비 생산 루프',
        description: '모은 자원으로 설비를 열어 초당 생산 흐름을 확장합니다.'
      },
      {
        icon: 'clock',
        title: '최대 8시간 오프라인 보상',
        description:
          '앱을 떠난 시간 중 최대 8시간의 생산분을 돌아왔을 때 정산합니다.'
      }
    ],
    github: 'https://github.com/toris-dev',
    image: '/images/projects/starlight-greenhouse/cover.svg',
    imageAlt: '별빛 온실 방치형 성장 게임 커버',
    ctaLabel: 'GitHub 프로필 보기',
    span: 'md'
  },
  {
    slug: 'volley-king-30',
    name: '30초 배구왕',
    tagline: taglines['volley-king-30'],
    description:
      '리시브, 토스와 스파이크의 타이밍을 맞춰 30초 동안 콤보를 이어가는 모바일 스포츠 아케이드 게임입니다.',
    category: '게임 · 스포츠 아케이드',
    platform: 'Mobile',
    year: '2026',
    status: '개발 중',
    tags: ['Personal', 'Mobile'],
    accent: { from: '#EF4444', to: '#FACC15', glow: 'rgba(239,68,68,0.32)' },
    tech: ['Flutter', 'Flame', 'Dart', 'Blender'],
    features: [
      {
        icon: 'clock',
        title: '30초 랠리',
        description: '짧은 제한 시간 안에서 타이밍과 콤보에 집중합니다.'
      },
      {
        icon: 'gamepad',
        title: '리시브·토스·스파이크',
        description:
          '세 단계의 입력을 순서대로 연결해 한 번의 공격을 완성합니다.'
      },
      {
        icon: 'zap',
        title: '콤보와 타이밍 판정',
        description: '연속으로 맞춘 타이밍을 콤보와 판정 피드백으로 보여줍니다.'
      }
    ],
    github: 'https://github.com/toris-dev',
    image: '/images/projects/volley-king-30/gameplay.png',
    imageAlt: '30초 배구왕 리시브·토스·스파이크 경기 화면',
    ctaLabel: 'GitHub 프로필 보기',
    span: 'md'
  },
  {
    slug: 'toris-docs',
    name: 'toris-docs',
    tagline: taglines['toris-docs'],
    description:
      '프로젝트 문맥, 개발 지식과 산출물을 연결해 기록이 다음 작업으로 이어지도록 구성한 개인 문서 워크플로입니다.',
    category: '지식 시스템 · 문서',
    platform: 'Markdown · Obsidian',
    year: '2026',
    status: '운영 중',
    tags: ['Personal', 'Fullstack'],
    accent: { from: '#22B8CF', to: '#7C6EE6', glow: 'rgba(34,184,207,0.30)' },
    tech: ['Markdown', 'Obsidian', 'Agent Workflow'],
    features: [
      {
        icon: 'layers',
        title: '프로젝트별 지식 연결',
        description: '프로젝트 단위로 기획, 설계와 개발 문맥을 연결합니다.'
      },
      {
        icon: 'arrow',
        title: '기록에서 산출물까지',
        description:
          '인박스에서 정리한 기록이 위키와 공개 산출물로 이어지는 흐름을 둡니다.'
      },
      {
        icon: 'cpu',
        title: '에이전트 친화적 구조',
        description:
          '사람과 개발 에이전트가 같은 프로젝트 문맥을 찾을 수 있는 폴더 경계를 사용합니다.'
      }
    ],
    github: 'https://github.com/toris-dev',
    image: '/images/projects/toris-docs/cover.svg',
    imageAlt: 'toris-docs 지식 그래프 흐름 그래픽',
    ctaLabel: 'GitHub 프로필 보기',
    span: 'md'
  },
  {
    slug: 'product-growth-skills',
    name: 'Product Growth Skills',
    tagline: taglines['product-growth-skills'],
    description:
      'SEO, 앱 스토어 등록, 모바일 인터랙션과 Android 성능 작업을 증거 기반으로 실행하고 검증하는 6개 오픈소스 에이전트 스킬 모음입니다.',
    category: 'Agent Skills · 오픈소스',
    platform: 'Codex · Claude',
    year: '2026',
    status: '운영 중',
    tags: ['Personal', 'Fullstack'],
    accent: { from: '#8B5CF6', to: '#38BDF8', glow: 'rgba(139,92,246,0.34)' },
    tech: ['Agent Skills', 'Markdown', 'Python'],
    features: [
      {
        icon: 'layers',
        title: '6개 전문 워크플로',
        description:
          'SEO, 스토어, Expo·Flutter 인터랙션과 Android 성능 영역을 각각의 스킬로 나눕니다.'
      },
      {
        icon: 'search',
        title: '증거 기반 실행',
        description:
          '추측보다 측정과 현재 상태의 증거를 먼저 수집하도록 작업 순서를 안내합니다.'
      },
      {
        icon: 'check',
        title: '내장 검증 스크립트',
        description:
          '저장소의 검증 스크립트로 스킬 구조와 필수 파일을 확인합니다.'
      }
    ],
    github: gh('product-growth-skills'),
    image: '/images/projects/product-growth-skills/cover.svg',
    imageAlt: 'Product Growth Skills 워크플로 라우터 그래픽',
    span: 'lg'
  }
];

/** 벤토 그리드에는 없지만 함께 보여줄 보조 프로젝트 (공개 접근 가능한 것만) */
export const moreProjects: Array<{
  name: string;
  description: string;
  tech: string;
  github: string;
}> = [];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getAdjacentProjects(slug: string): {
  prev: Project;
  next: Project;
} {
  const idx = projects.findIndex((p) => p.slug === slug);
  const prev = projects[(idx - 1 + projects.length) % projects.length];
  const next = projects[(idx + 1) % projects.length];
  return { prev, next };
}
