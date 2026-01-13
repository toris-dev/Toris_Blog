// 로컬 스토리지 키 생성
export function getLikeStorageKey(postId: string): string {
  return `post_like_${postId}`;
}

// 좋아요 상태 확인
export function isLiked(postId: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const storageKey = getLikeStorageKey(postId);
    const liked = localStorage.getItem(storageKey);
    return liked === 'true';
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
    const storageKey = getLikeStorageKey(postId);
    if (liked) {
      localStorage.setItem(storageKey, 'true');
    } else {
      localStorage.removeItem(storageKey);
    }
  } catch (error) {
    console.error('Error saving like status:', error);
  }
}

// 좋아요 토글 API 호출
export async function toggleLike(postId: string): Promise<{
  liked: boolean;
  likeCount: number;
} | null> {
  try {
    const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('좋아요 처리에 실패했습니다.');
    }

    const data = await response.json();
    return {
      liked: data.liked,
      likeCount: data.likeCount
    };
  } catch (error) {
    console.error('Error toggling like:', error);
    return null;
  }
}

// 좋아요 수 조회 API 호출
export async function getLikeCount(postId: string): Promise<number | null> {
  try {
    const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/like`);

    if (!response.ok) {
      throw new Error('좋아요 수 조회에 실패했습니다.');
    }

    const data = await response.json();
    return data.likeCount || 0;
  } catch (error) {
    console.error('Error fetching like count:', error);
    return null;
  }
}
