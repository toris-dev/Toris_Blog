/**
 * 좋아요 - 순수 클라이언트(localStorage) 기반 구현.
 * 서버리스(Vercel) 파일시스템 제약과 무관하게 브라우저에 저장됩니다.
 * 외부 DB 없이 동작하며, 포스트별 안정적인 기준 좋아요 수에서 시작합니다.
 */

const LIKE_STATE_KEY = (postId: string) => `post_like_${postId}`;
const LIKE_COUNT_KEY = (postId: string) => `post_like_count_${postId}`;

// 로컬 스토리지 키 생성 (하위 호환)
export function getLikeStorageKey(postId: string): string {
  return LIKE_STATE_KEY(postId);
}

/** postId로부터 안정적인 해시값 생성 */
function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** 포스트별 기준 좋아요 수 (5~54 범위, 항상 동일) */
function getBaseLikeCount(postId: string): number {
  return 5 + (hashString(postId) % 50);
}

function readCount(postId: string): number {
  if (typeof window === 'undefined') {
    return getBaseLikeCount(postId);
  }
  try {
    const stored = localStorage.getItem(LIKE_COUNT_KEY(postId));
    if (stored !== null) {
      const n = parseInt(stored, 10);
      return Number.isNaN(n) ? getBaseLikeCount(postId) : n;
    }
    const base = getBaseLikeCount(postId);
    localStorage.setItem(LIKE_COUNT_KEY(postId), base.toString());
    return base;
  } catch (error) {
    console.error('Error reading like count:', error);
    return getBaseLikeCount(postId);
  }
}

function writeCount(postId: string, count: number): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(LIKE_COUNT_KEY(postId), Math.max(0, count).toString());
  } catch (error) {
    console.error('Error writing like count:', error);
  }
}

// 좋아요 상태 확인
export function isLiked(postId: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return localStorage.getItem(LIKE_STATE_KEY(postId)) === 'true';
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
}

// 좋아요 상태 저장
export function setLiked(postId: string, liked: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (liked) {
      localStorage.setItem(LIKE_STATE_KEY(postId), 'true');
    } else {
      localStorage.removeItem(LIKE_STATE_KEY(postId));
    }
  } catch (error) {
    console.error('Error saving like status:', error);
  }
}

// 좋아요 토글 (로컬)
export async function toggleLike(postId: string): Promise<{
  liked: boolean;
  likeCount: number;
} | null> {
  try {
    const currentlyLiked = isLiked(postId);
    const currentCount = readCount(postId);
    const newLiked = !currentlyLiked;
    const newCount = newLiked
      ? currentCount + 1
      : Math.max(0, currentCount - 1);

    setLiked(postId, newLiked);
    writeCount(postId, newCount);

    return { liked: newLiked, likeCount: newCount };
  } catch (error) {
    console.error('Error toggling like:', error);
    return null;
  }
}

// 좋아요 수 조회 (로컬)
export async function getLikeCount(postId: string): Promise<number | null> {
  return readCount(postId);
}
