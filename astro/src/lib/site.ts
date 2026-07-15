/** Toris Inc. 사이트 전역 상수 — 브랜드/사업자 정보의 단일 출처 */

export const COMPANY = {
  nameKo: '토리스',
  nameEn: 'Toris Inc.',
  bizNumber: '424-04-03521',
  ceo: '유주환',
  // Cloudflare Email Routing — 개인 수신함으로 전달됨(개인 주소 비노출)
  email: 'korea@toris.kr',
  github: 'https://github.com/toris-dev',
  tagline: '꾸준함이 완성하는 소프트웨어',
  description:
    '토리스(Toris Inc.)는 웹·모바일·자동화 제품을 기획부터 출시, 운영까지 직접 만드는 1인 소프트웨어 스튜디오입니다.'
} as const;

export const SITE_URL =
  import.meta.env.PUBLIC_SITE_URL || 'https://toris.kr';

export const NAV = [
  { href: '/about', label: '회사 소개' },
  { href: '/projects', label: '프로젝트' },
  { href: '/process', label: '진행 방식' },
  { href: '/blog', label: '블로그' },
  { href: '/contact', label: '문의하기' }
] as const;

/** 절대 URL 생성 (canonical/OG용) */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).href;
}
