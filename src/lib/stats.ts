import type { Project } from '../data/projects';

/**
 * 신뢰 지표 단일 출처 — 페이지마다 숫자를 하드코딩하지 않는다.
 * 프로젝트·글 데이터에서 계산 가능한 값만 계산하고,
 * 정책 값(첫 회신 시간)은 여기 한 곳에만 둔다.
 */
export function computeStats(projects: readonly Project[], postCount: number) {
  const live = projects.filter((p) => p.status === '운영 중');
  // 플랫폼은 데이터의 platform/category 문자열에서 거친 버킷으로 정규화해 센다.
  const buckets = new Set<string>();
  for (const p of projects) {
    const s = `${p.platform} ${p.category}`.toLowerCase();
    if (/web|웹/.test(s)) buckets.add('web');
    if (/mobile|ios|android|모바일/.test(s)) buckets.add('mobile');
    if (/npm|패키지|라이브러리|library/.test(s)) buckets.add('npm');
    if (/자동화|파이프라인|automation|pipeline/.test(s)) buckets.add('automation');
  }
  const platforms = buckets.size;
  return {
    /** 운영 중 제품 수 */
    live: live.length,
    /** 출시·운영 포함 누적 제품 수 */
    total: projects.length,
    /** 다뤄 온 플랫폼 수(웹·모바일·npm 등, 데이터 기준) */
    platforms,
    /** 기술 기록(블로그 글) 수 */
    posts: postCount,
    /** 첫 회신 정책 — 데이터가 아니라 약속 */
    firstReply: '24h'
  };
}
