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
  span: 'lg' | 'md' | 'sm';
}

const og = (repo: string) =>
  `https://opengraph.githubassets.com/1/toris-dev/${repo}`;

const gh = (repo: string) => `https://github.com/toris-dev/${repo}`;

export const projects: Project[] = [
  {
    slug: 'toris-blog',
    name: 'Toris Blog',
    tagline: '개발 지식을 아카이브하고 공유하는 기술 블로그',
    description:
      'Next.js 16 App Router 기반 개인 기술 블로그. MDX 콘텐츠, 카테고리·태그 필터, GitHub 기반 조회수·좋아요, 목차·다크모드, GEO/SEO 최적화까지 — 개발자의 지식 아카이브이자 생산성 기록입니다.',
    category: '기술 블로그',
    platform: 'Web',
    year: '2026',
    status: '운영 중',
    tags: ['Personal', 'Frontend', 'Fullstack'],
    accent: { from: '#0EA5E9', to: '#22D3EE', glow: 'rgba(14,165,233,0.35)' },
    tech: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS', 'MDX', 'Vercel'],
    features: [
      {
        icon: 'book',
        title: 'MDX 콘텐츠 렌더링',
        description:
          '마크다운/MDX 기반 글 작성, 코드 하이라이트, 목차 자동 생성으로 읽기 좋은 글.'
      },
      {
        icon: 'list',
        title: '카테고리 · 태그 필터',
        description: '카테고리 칩과 태그로 원하는 글을 빠르게 탐색하는 아카이브.'
      },
      {
        icon: 'activity',
        title: '조회수 · 좋아요 (외부 DB 없이)',
        description:
          'GitHub Issue를 저장소로 활용해 서버리스로 조회수·좋아요를 집계.'
      },
      {
        icon: 'shield',
        title: 'GEO · SEO 최적화',
        description:
          'JSON-LD, sitemap, robots, llms.txt, 정제된 메타 설명으로 AI·검색 노출 강화.'
      }
    ],
    github: gh('Toris_Blog'),
    image: '/images/projects/toris-blog.png',
    span: 'lg'
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
        description: '승률·총 수익률·거래 횟수 등 핵심 지표를 카운트업으로 강조.'
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
    tech: ['Next.js 16', 'React 19', 'TypeScript', 'Supabase', 'Naver Maps', 'Tour API'],
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
    github: gh('love-trip'),
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
        description: 'CPU · 메모리 · 포트 모니터 내장. 한국어/English, 라이트/다크 테마.'
      }
    ],
    tags: ['Personal', 'Fullstack'],
    github: gh('TraceDesk'),
    image: og('TraceDesk'),
    span: 'sm'
  },
  {
    slug: 'snapmate',
    name: 'SnapMate',
    tagline: '찍는 순간, 함께 보는 실시간 공유 갤러리',
    description:
      '커플, 가족, 친구, 소규모 그룹이 앱 내 카메라로 촬영한 순간을 즉시 공유하고 함께 추억을 쌓는 실시간 공유 갤러리 서비스. Cloudflare R2 기반의 가벼운 미디어 파이프라인으로 빠르게 업로드하고 즉시 확인합니다.',
    category: '소셜 · 사진',
    platform: 'Mobile (iOS · Android)',
    year: '2026',
    status: '개발 중',
    accent: { from: '#F59E0B', to: '#FB923C', glow: 'rgba(245,158,11,0.35)' },
    tech: ['React Native', 'Expo', 'Firebase Functions', 'Cloudflare R2', 'TypeScript'],
    features: [
      {
        icon: 'camera',
        title: '인앱 카메라 즉시 공유',
        description:
          '앱 안에서 찍으면 그룹 갤러리에 바로. 찍고 보내는 과정이 하나의 흐름으로.'
      },
      {
        icon: 'users',
        title: '그룹 실시간 갤러리',
        description:
          '커플·가족·친구 그룹별 갤러리에서 서로의 순간을 실시간으로 함께 감상.'
      },
      {
        icon: 'zap',
        title: 'R2 미디어 스토리지',
        description:
          'Cloudflare R2 + UUID 경로 설계로 빠르고 경제적인 미디어 저장. signed URL 강화 로드맵.'
      },
      {
        icon: 'cloud',
        title: '서버리스 백엔드',
        description:
          'Firebase Functions 시크릿 기반 안전한 업로드 파이프라인. 인프라 관리 부담 최소화.'
      }
    ],
    tags: ['Personal', 'Mobile'],
    github: gh('SnapMate'),
    image: og('SnapMate'),
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
        description: '주요 개발 뉴스 소스를 주기적으로 수집하는 크롤러 파이프라인.'
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
        description: '카드뉴스를 이어붙여 숏폼 비디오까지 생성하는 엔드투엔드 파이프라인.'
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
        description: '하나의 코드베이스로 iOS와 Android를 동시에. 네이티브급 성능.'
      }
    ],
    tags: ['Personal', 'Mobile'],
    github: gh('loca'),
    image: og('loca'),
    span: 'md'
  },
  {
    slug: 'bubble-bible',
    name: 'Bubble Bible',
    tagline: '읽고, 나누고, 함께 자라는 성경 앱',
    description:
      '성경 읽기 습관과 교회·그룹 단위의 교제를 하나의 흐름으로 제공하는 React Native 앱. 개역한글 본문, 포인트·레벨 시스템, 커뮤니티, 읽기 계획, 그룹 랭킹까지 — 말씀과 함께하는 일상을 만듭니다.',
    category: '종교 · 커뮤니티',
    platform: 'Mobile (iOS · Android)',
    year: '2026',
    status: '개발 중',
    accent: { from: '#D97706', to: '#FBBF24', glow: 'rgba(217,119,6,0.35)' },
    tech: ['React Native', 'Expo', 'TypeScript'],
    features: [
      {
        icon: 'book',
        title: '성경 본문 리더',
        description:
          '개역한글 성경, 폰트 크기·종류·색상 조절, 구절 하이라이트와 북마크.'
      },
      {
        icon: 'award',
        title: '포인트 & 레벨 시스템',
        description:
          '읽기 +200, 좋아요 +100, 댓글 +300. Believer에서 Saint(Lv.99)까지 성장하는 재미.'
      },
      {
        icon: 'message',
        title: '커뮤니티',
        description: 'QT 나눔, 찬양 추천, 성경 질문 게시판과 레벨 뱃지 프로필.'
      },
      {
        icon: 'check',
        title: '읽기 계획 체크리스트',
        description: '성경 읽기 계획을 등록하고 체크하며 달성 포인트 획득.'
      },
      {
        icon: 'users',
        title: '교회 그룹 & 랭킹',
        description:
          '교회 등록·그룹 생성·그룹 게시판, 멤버 간 레벨·연속일·영향력 랭킹과 그룹 통계.'
      }
    ],
    tags: ['Personal', 'Mobile', 'Frontend'],
    github: gh('bubble-bible'),
    image: og('bubble-bible'),
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
        description: '참여로 포인트를 얻고 업적을 해금하고 레벨업하는 홀더 경험.'
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
        description: 'Pump.fun 런칭과 함께한 공식 웹사이트. 홀더 온보딩의 시작점.'
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
  }
];

/** 벤토 그리드에는 없지만 함께 보여줄 보조 프로젝트 */
export const moreProjects = [
  {
    name: 'volley-king-30',
    description: '30초 안에 승부를 가르는 하이퍼캐주얼 배구 게임',
    tech: 'Game',
    github: gh('volley-king-30')
  },
  {
    name: 'toris-docs',
    description: '나만의 제 2의 뇌 — 지식 베이스 & 문서 시스템',
    tech: 'Python',
    github: gh('toris-docs')
  }
];

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
