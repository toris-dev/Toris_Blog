'use client';
import { CommentType } from '@/types';
import { useComments as useComment } from '@/utils/hooks';
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';
interface CommentsContextType {
  organizedComments: (CommentType & { replies: CommentType[] })[];
  setOrganizedComments: React.Dispatch<
    React.SetStateAction<(CommentType & { replies: CommentType[] })[]>
  >;
}

const CommentsContext = createContext<CommentsContextType | undefined>(
  undefined
);

const organizeComments = (comments: CommentType[]) => {
  // 댓글을 id를 키로 하여 맵에 저장합니다. 이를 통해 나중에 특정 댓글을 찾을 때 용이합니다.
  const commentMap: {
    [key: number]: CommentType & { replies: CommentType[] };
  } = {};

  // 먼저 모든 댓글을 맵에 추가하고, replies 배열을 초기화합니다.
  comments?.forEach((comment) => {
    commentMap[comment.id] = { ...comment, replies: [] };
  });

  // 최상위 댓글들을 담을 배열입니다.
  const topLevelComments: (CommentType & { replies: CommentType[] })[] = [];

  // 댓글을 순회하면서 대댓글을 해당하는 위치에 넣습니다.
  comments?.forEach((comment) => {
    if (comment.parent_comment_id === null) {
      topLevelComments.push(commentMap[comment.id]);
    } else {
      if (commentMap[comment.parent_comment_id]) {
        commentMap[comment.parent_comment_id].replies.push(
          commentMap[comment.id]
        );
      }
    }
  });

  // 최상위 댓글만 반환합니다. 대댓글은 각 댓글의 replies 배열 안에 재귀적으로 위치합니다.
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
  postId: number;
}> = ({ children, postId }) => {
  const [organizedComments, setOrganizedComments] = useState<
    (CommentType & { replies: CommentType[] })[]
  >([]);
  const { data: comments } = useComment(postId); // useComments 훅을 사용하여 댓글 데이터를 가져옵니다.

  useEffect(() => {
    // 댓글 데이터가 변경될 때마다 댓글을 재구성합니다.
    const newOrganizedComments = organizeComments(comments as CommentType[]);
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
