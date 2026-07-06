/**
 * 조회수 - 서버(MongoDB) 기반 전역 카운터.
 * 조회수 값 자체는 /api/post-views 를 통해 모든 방문자에 걸쳐 누적된다.
 * 24시간 내 같은 브라우저의 중복 증가만 localStorage로 막는다
 * (서버에 개인 식별 정보를 저장하지 않기 위함).
 */

const VIEW_TIME_KEY = (postId: string) => `post_view_${postId}`;

// 로컬 스토리지 키 생성 (하위 호환)
export function getViewStorageKey(postId: string): string {
  return VIEW_TIME_KEY(postId);
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

// 조회수 증가 (서버) — 성공 시 갱신된 전역 조회수 반환
export async function incrementViewCount(
  postId: string
): Promise<number | null> {
  try {
    const res = await fetch('/api/post-views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId })
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return typeof data?.count === 'number' ? data.count : null;
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return null;
  }
}

// 조회수 조회 (서버)
export async function getViewCount(postId: string): Promise<number | null> {
  try {
    const res = await fetch(
      `/api/post-views?postId=${encodeURIComponent(postId)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return typeof data?.count === 'number' ? data.count : null;
  } catch (error) {
    console.error('Error fetching view count:', error);
    return null;
  }
}
