'use client';

import { useState, useEffect, useCallback } from 'react';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { Comment, CommentFormData } from '@/types/comment';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/style';

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // 댓글 조회
  const fetchComments = useCallback(async (pageNum: number = 1) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/comments?postId=${encodeURIComponent(postId)}&page=${pageNum}&limit=20`
      );

      if (!response.ok) {
        throw new Error('댓글을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setComments(data.comments || []);
      setHasMore(data.pagination.page < data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments(page);
  }, [fetchComments, page]);

  // 댓글 작성
  const handleSubmit = async (formData: CommentFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postId,
          ...formData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '댓글 작성에 실패했습니다.');
      }

      // 댓글 목록 새로고침
      await fetchComments(page);
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 댓글 목록 새로고침
  const handleUpdate = useCallback(() => {
    fetchComments(page);
  }, [fetchComments, page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          댓글 {total > 0 && <span className="text-muted-foreground">({total})</span>}
        </h2>
      </div>

      {/* 댓글 작성 폼 */}
      <div className="rounded-lg border border-border bg-card p-6">
        <CommentForm postId={postId} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>

      {/* 댓글 목록 */}
      {isLoading ? (
        <div className="text-center text-muted-foreground">댓글을 불러오는 중...</div>
      ) : comments.length === 0 ? (
        <div className="text-center text-muted-foreground">아직 댓글이 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} onUpdate={handleUpdate} />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={isLoading}
          >
            더 보기
          </Button>
        </div>
      )}
    </div>
  );
}
