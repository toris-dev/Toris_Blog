/**
 * 조회수 - 순수 클라이언트(localStorage) 기반 구현.
 * 서버리스(Vercel) 파일시스템 제약과 무관하게 브라우저에 누적 저장됩니다.
 * 외부 DB 없이 동작하며, 포스트별 안정적인 기준값에서 시작합니다.
 */

const VIEW_TIME_KEY = (postId: string) => `post_view_${postId}`;
const VIEW_COUNT_KEY = (postId: string) => `post_view_count_${postId}`;

// 로컬 스토리지 키 생성 (하위 호환)
export function getViewStorageKey(postId: string): string {
  return VIEW_TIME_KEY(postId);
}

/** postId로부터 안정적인 해시값 생성 (기준 조회수 산출용) */
function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0; // 32bit 정수로 변환
  }
  return Math.abs(h);
}

/** 포스트별 기준 조회수 (100~999 범위, 항상 동일) */
function getBaseViewCount(postId: string): number {
  return 100 + (hashString(postId) % 900);
}

function readCount(postId: string): number {
  if (typeof window === 'undefined') {
    return getBaseViewCount(postId);
  }
  try {
    const stored = localStorage.getItem(VIEW_COUNT_KEY(postId));
    if (stored !== null) {
      const n = parseInt(stored, 10);
      return Number.isNaN(n) ? getBaseViewCount(postId) : n;
    }
    // 최초 접근 시 기준값으로 초기화
    const base = getBaseViewCount(postId);
    localStorage.setItem(VIEW_COUNT_KEY(postId), base.toString());
    return base;
  } catch (error) {
    console.error('Error reading view count:', error);
    return getBaseViewCount(postId);
  }
}

function writeCount(postId: string, count: number): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(VIEW_COUNT_KEY(postId), Math.max(0, count).toString());
  } catch (error) {
    console.error('Error writing view count:', error);
  }
}

// 조회 기록 확인 (24시간 내 중복 방지)
export function hasViewedRecently(postId: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const lastViewed = localStorage.getItem(VIEW_TIME_KEY(postId));
    if (!lastViewed) {
      return false;
    }
    const lastViewedTime = parseInt(lastViewed, 10);
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return Date.now() - lastViewedTime < twentyFourHours;
  } catch (error) {
    console.error('Error checking view history:', error);
    return false;
  }
}

// 조회 기록 저장
export function markAsViewed(postId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(VIEW_TIME_KEY(postId), Date.now().toString());
  } catch (error) {
    console.error('Error saving view history:', error);
  }
}

// 조회수 증가 (로컬)
export async function incrementViewCount(postId: string): Promise<number | null> {
  const next = readCount(postId) + 1;
  writeCount(postId, next);
  return next;
}

// 조회수 조회 (로컬)
export async function getViewCount(postId: string): Promise<number | null> {
  return readCount(postId);
}
