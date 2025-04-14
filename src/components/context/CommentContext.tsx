'use client';
import { CommentType } from '@/types';
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

// CommentContext 타입 정의
interface CommentsContextType {
  organizedComments: CommentType[];
  setOrganizedComments: React.Dispatch<React.SetStateAction<CommentType[]>>;
}

const CommentsContext = createContext<CommentsContextType | undefined>(
  undefined
);

// API에서 가져온 댓글을 계층 구조로 정리하는 함수
const organizeComments = (apiComments: any[]): CommentType[] => {
  // 댓글을 id를 키로 하여 맵에 저장합니다.
  const commentMap: Record<number, CommentType> = {};

  // 먼저 모든 댓글을 맵에 추가하고, replies 배열을 초기화합니다.
  apiComments?.forEach((comment) => {
    if (comment && comment.id) {
      commentMap[comment.id] = {
        ...comment,
        parent_comment_id: comment.parent_comment_id || null,
        replies: []
      };
    }
  });

  // 최상위 댓글들을 담을 배열입니다.
  const topLevelComments: CommentType[] = [];

  // 댓글을 순회하면서 대댓글을 해당하는 위치에 넣습니다.
  apiComments?.forEach((comment) => {
    if (!comment || !comment.id) return;

    if (comment.parent_comment_id === null) {
      topLevelComments.push(commentMap[comment.id]);
    } else if (
      comment.parent_comment_id &&
      commentMap[comment.parent_comment_id]
    ) {
      commentMap[comment.parent_comment_id].replies.push(
        commentMap[comment.id]
      );
    }
  });

  // 최상위 댓글만 반환합니다.
  return topLevelComments;
};

export const useComments = () => {
  const context = useContext(CommentsContext);
  if (!context)
    throw new Error('useComments must be used within a CommentsProvider');
  return context;
};

export const CommentsProvider: React.FC<{
  children: ReactNode;
  postId: number | string;
}> = ({ children, postId }) => {
  const [organizedComments, setOrganizedComments] = useState<CommentType[]>([]);
  const [comments, setComments] = useState<CommentType[]>([]);
  const numericPostId =
    typeof postId === 'string' ? parseInt(postId, 10) : postId;

  // 마크다운 페이지에 맞게 댓글 데이터를 가져오는 부분을 수정합니다
  useEffect(() => {
    const fetchComments = async () => {
      try {
        // 마크다운 페이지 ID로 댓글을 가져오는 API 호출
        const response = await fetch(`/api/comments?slug=${postId}`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
        }
      } catch (error) {
        console.error('댓글을 가져오는 중 오류가 발생했습니다:', error);
      }
    };

    fetchComments();
  }, [postId]);

  useEffect(() => {
    // 댓글 데이터가 변경될 때마다 댓글을 재구성합니다.
    const newOrganizedComments = organizeComments(comments);
    setOrganizedComments(newOrganizedComments);
  }, [comments]);

  return (
    <CommentsContext.Provider
      value={{ organizedComments, setOrganizedComments }}
    >
      {children}
    </CommentsContext.Provider>
  );
};
