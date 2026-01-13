import { useState, useEffect, useCallback } from 'react';
import {
  isLiked as checkIsLiked,
  setLiked as saveLiked,
  toggleLike,
  getLikeCount
} from '@/utils/postLikes';
import toast from 'react-hot-toast';

interface UsePostLikeReturn {
  liked: boolean;
  likeCount: number;
  isLoading: boolean;
  toggle: () => Promise<void>;
}

export function usePostLike(postId: string): UsePostLikeReturn {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // 초기 상태 로드
  useEffect(() => {
    const loadLikeStatus = async () => {
      try {
        // 로컬 스토리지에서 좋아요 상태 확인
        const localLiked = checkIsLiked(postId);
        setLiked(localLiked);

        // 서버에서 좋아요 수 조회
        const count = await getLikeCount(postId);
        if (count !== null) {
          setLikeCount(count);
        }
      } catch (error) {
        console.error('Error loading like status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLikeStatus();
  }, [postId]);

  // 좋아요 토글
  const handleToggle = useCallback(async () => {
    if (isToggling) {
      return;
    }

    setIsToggling(true);

    // Optimistic Update
    const previousLiked = liked;
    const previousCount = likeCount;
    const newLiked = !previousLiked;
    const newCount = newLiked ? previousCount + 1 : Math.max(0, previousCount - 1);

    setLiked(newLiked);
    setLikeCount(newCount);
    saveLiked(postId, newLiked);

    try {
      const result = await toggleLike(postId);
      if (result) {
        setLiked(result.liked);
        setLikeCount(result.likeCount);
        saveLiked(postId, result.liked);
      } else {
        // 실패 시 롤백
        setLiked(previousLiked);
        setLikeCount(previousCount);
        saveLiked(postId, previousLiked);
        toast.error('좋아요 처리에 실패했습니다.');
      }
    } catch (error) {
      // 에러 시 롤백
      setLiked(previousLiked);
      setLikeCount(previousCount);
      saveLiked(postId, previousLiked);
      toast.error('좋아요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsToggling(false);
    }
  }, [postId, liked, likeCount, isToggling]);

  return {
    liked,
    likeCount,
    isLoading: isLoading || isToggling,
    toggle: handleToggle
  };
}
