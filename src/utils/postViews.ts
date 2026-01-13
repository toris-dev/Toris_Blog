// 로컬 스토리지 키 생성
export function getViewStorageKey(postId: string): string {
  return `post_view_${postId}`;
}

// 조회 기록 확인 (24시간 내 중복 방지)
export function hasViewedRecently(postId: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const storageKey = getViewStorageKey(postId);
    const lastViewed = localStorage.getItem(storageKey);

    if (!lastViewed) {
      return false;
    }

    const lastViewedTime = parseInt(lastViewed, 10);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    return now - lastViewedTime < twentyFourHours;
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
    const storageKey = getViewStorageKey(postId);
    localStorage.setItem(storageKey, Date.now().toString());
  } catch (error) {
    console.error('Error saving view history:', error);
  }
}

// 조회수 증가 API 호출
export async function incrementViewCount(postId: string): Promise<number | null> {
  try {
    const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('조회수 증가에 실패했습니다.');
    }

    const data = await response.json();
    return data.viewCount || null;
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return null;
  }
}

// 조회수 조회 API 호출
export async function getViewCount(postId: string): Promise<number | null> {
  try {
    const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/view`);

    if (!response.ok) {
      throw new Error('조회수 조회에 실패했습니다.');
    }

    const data = await response.json();
    return data.viewCount || null;
  } catch (error) {
    console.error('Error fetching view count:', error);
    return null;
  }
}
