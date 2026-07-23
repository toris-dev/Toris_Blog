// 도메인 타입. Flutter 원본(lib/models)을 그대로 이식한다.

/** 카드 에너지가 나타나는 방식. 타로의 정/역방향 대신 빛/그림자. */
export type CardFlow = 'light' | 'shadow';

export const flowLabel = (flow: CardFlow): string =>
  flow === 'light' ? '빛의 흐름' : '그림자의 흐름';

/** 스프레드. MVP 는 오늘의 한 장 / 운명의 세 장. */
export type SpreadKey = 'daily' | 'fate-three';

export interface SpreadPosition {
  key: string;
  title: string;
  description: string;
}

export interface Spread {
  key: SpreadKey;
  label: string;
  cardCount: number;
  positions: SpreadPosition[];
}

export const SPREADS: Record<SpreadKey, Spread> = {
  daily: {
    key: 'daily',
    label: '오늘의 한 장',
    cardCount: 1,
    positions: [
      { key: 'today', title: '오늘', description: '오늘 가장 강하게 작용하는 흐름' },
    ],
  },
  'fate-three': {
    key: 'fate-three',
    label: '운명의 세 장',
    cardCount: 3,
    positions: [
      { key: 'seed', title: '씨앗', description: '지금의 상황을 만든 배경' },
      { key: 'stream', title: '흐름', description: '현재 가장 강하게 작용하는 에너지' },
      { key: 'gate', title: '문', description: '가까운 미래에 열릴 가능성' },
    ],
  },
};

export const spreadFromKey = (key: string | null | undefined): Spread =>
  SPREADS[(key as SpreadKey) in SPREADS ? (key as SpreadKey) : 'daily'];

/** 질문 카테고리. 카드 해석 중 어떤 조각을 쓸지 결정한다. */
export type CategoryKey = 'general' | 'relationship' | 'work' | 'money' | 'choice';

export interface Category {
  key: CategoryKey;
  label: string;
  hint: string;
}

export const CATEGORIES: Record<CategoryKey, Category> = {
  general: { key: 'general', label: '전체', hint: '지금의 흐름 전반' },
  relationship: { key: 'relationship', label: '사랑과 관계', hint: '연애, 가족, 사람 사이의 거리' },
  work: { key: 'work', label: '일과 성장', hint: '진로, 이직, 배움' },
  money: { key: 'money', label: '돈과 기회', hint: '지출, 수입, 기회 판단' },
  choice: { key: 'choice', label: '선택과 결정', hint: '갈등하는 두 가지 사이' },
};

export const CATEGORY_ORDER: CategoryKey[] = ['general', 'relationship', 'work', 'money', 'choice'];

export const categoryFromKey = (key: string | null | undefined): Category =>
  CATEGORIES[(key as CategoryKey) in CATEGORIES ? (key as CategoryKey) : 'general'];

export interface FateCard {
  id: string;
  slug: string;
  name: string;
  domain: string;
  number: number;
  symbol: string;
  keywords: string[];
  summary: string;
  lightMeaning: string;
  shadowMeaning: string;
  relationshipMeaning: string;
  workMeaning: string;
  moneyMeaning: string;
  choiceMeaning: string;
  actionPrompt: string;
  reflectionQuestion: string;
  caution: string;
  imageAlt: string;
}

export interface DrawnCard {
  card: FateCard;
  position: SpreadPosition;
  flow: CardFlow;
  orderIndex: number;
}

export interface CardSection {
  positionTitle: string;
  positionDescription: string;
  cardId: string;
  cardName: string;
  domain: string;
  symbol: string;
  flow: CardFlow;
  keywords: string[];
  meaning: string;
  categoryMeaning: string;
  imageAlt: string;
}

export interface ReadingInterpretation {
  headline: string;
  overview: string;
  cardSections: CardSection[];
  caution: string;
  action: string;
  reflectionQuestion: string;
  disclaimer: string;
}

export interface Reading {
  id: string;
  spread: SpreadKey;
  category: CategoryKey;
  questionPreview: string;
  savedQuestion: string | null;
  interpretation: ReadingInterpretation;
  createdAt: string; // ISO
  contentVersion: number;
  actionCommitted: boolean;
  actionCompletedAt: string | null;
  note: string | null;
  outcomeRating: number | null;
}

/** 카드 해석 조각 선택 헬퍼. */
export const flowMeaning = (card: FateCard, flow: CardFlow): string =>
  flow === 'light' ? card.lightMeaning : card.shadowMeaning;

export const categoryMeaning = (card: FateCard, category: CategoryKey): string => {
  switch (category) {
    case 'relationship':
      return card.relationshipMeaning;
    case 'work':
      return card.workMeaning;
    case 'money':
      return card.moneyMeaning;
    case 'choice':
      return card.choiceMeaning;
    case 'general':
    default:
      return card.summary;
  }
};

export const cardImage = (card: FateCard): string => `/cards/${card.id}.webp`;

/** 도메인 한글 라벨·설명·색 (theme/tokens.dart Domains + domainColors). */
export const DOMAIN_LABELS: Record<string, string> = {
  seed: '씨앗',
  path: '길',
  bond: '인연',
  flame: '불꽃',
  shadow: '그림자',
  gate: '문',
};

export const DOMAIN_DESCRIPTIONS: Record<string, string> = {
  seed: '시작, 가능성, 준비',
  path: '선택, 이동, 방향',
  bond: '관계, 연결, 거리',
  flame: '의지, 성취, 표현',
  shadow: '두려움, 착각, 집착',
  gate: '전환, 종료, 새로운 단계',
};

export const DOMAIN_COLORS: Record<string, string> = {
  seed: '#7FA88C',
  path: '#7C9CC3',
  bond: '#C38FA6',
  flame: '#D79A6A',
  shadow: '#8E7CC3',
  gate: '#D7B46A',
};

export const domainLabel = (key: string): string => DOMAIN_LABELS[key] ?? key;
export const domainColor = (key: string): string => DOMAIN_COLORS[key] ?? '#8E7CC3';
