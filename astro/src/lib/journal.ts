/**
 * 빌딩 로그 — 글(slug) ↔ 제품 매핑 단일 출처.
 * 블로그를 '프로젝트별 저널'로 묶을 때 사용한다.
 * slug는 createSlug(파일명) 결과와 정확히 일치해야 한다.
 */
export const PROJECT_JOURNALS: Record<string, string[]> = {
  'Toris Blog': [
    'Toris-Blog-프로젝트-리뷰',
    '프로젝트-개인-블로그-챗봇-Open-API'
  ],
  '21n Apps': [
    '21n-econtract-platform',
    '회사-프로젝트-개발-후기',
    '21n-fullstack-year-one-reflection'
  ],
  'CryptoTrade.gg': ['CryptoTrade-gg-프로젝트-리뷰'],
  LOVETRIP: ['love-trip-프로젝트-리뷰'],
  PEPEBear: ['PEPEBear-프로젝트-리뷰'],
  'YM Guide': ['ym_guide-프로젝트-리뷰'],
  'Bubble Bible': ['bubbleBible-FE-프로젝트-리뷰']
};

/** 특정 제품이 아니라 스튜디오 운영 방식에 대한 기록 */
export const STUDIO_JOURNALS: string[] = ['fullstack-workflow'];
