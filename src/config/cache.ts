/**
 * ISR Writes 절감 설정
 * - 시간 기반 재생성: 7일 (604800초)
 * - App Router segment config(`export const revalidate`)는 숫자 리터럴만 허용 → 각 page/route에 604800 직접 기입
 * - 포스트·카테고리 변경 시 /api/revalidate 온디맨드 revalidate 우선
 */
export const REVALIDATE_SECONDS = 604800;
export const STALE_WHILE_REVALIDATE_SECONDS = 86400;

export const CACHE_CONTROL_HEADER = `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`;
