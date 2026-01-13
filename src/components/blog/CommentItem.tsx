'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Comment } from '@/types/comment';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import toast from 'react-hot-toast';
import { CommentAuthModal } from './CommentAuthModal';

dayjs.extend(relativeTime);
dayjs.locale('ko');

interface CommentItemProps {
  comment: Comment;
  onUpdate: () => void; // 댓글 목록 새로고침 콜백
}

export function CommentItem({ comment, onUpdate }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState<'edit' | 'delete' | null>(null);
  const [authData, setAuthData] = useState<{ authorId: string; password: string } | null>(null);

  const handleEditClick = () => {
    setAuthAction('edit');
    setShowAuthModal(true);
  };

  const handleDeleteClick = () => {
    setAuthAction('delete');
    setShowAuthModal(true);
  };

  const handleAuthSuccess = async (authorId: string, password: string) => {
    if (authAction === 'edit') {
      setAuthData({ authorId, password });
      setIsEditing(true);
      setShowAuthModal(false);
    } else if (authAction === 'delete') {
      setIsDeleting(true);
      setShowAuthModal(false);
      try {
        const response = await fetch(`/api/comments/${comment.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ authorId, password })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || '댓글 삭제에 실패했습니다.');
        }

        toast.success('댓글이 삭제되었습니다.');
        onUpdate(); // 댓글 목록 새로고침
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '댓글 삭제 중 오류가 발생했습니다.';
        toast.error(errorMessage);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEditSubmit = async (content: string) => {
    if (!authData) {
      toast.error('인증 정보가 없습니다.');
      return;
    }

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          authorId: authData.authorId,
          password: authData.password,
          content
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '댓글 수정에 실패했습니다.');
      }

      setIsEditing(false);
      setAuthData(null);
      toast.success('댓글이 수정되었습니다.');
      onUpdate(); // 댓글 목록 새로고침
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '댓글 수정 중 오류가 발생했습니다.';
      toast.error(errorMessage);
    }
  };

  const relativeTimeStr = dayjs(comment.createdAt).fromNow();

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <div className="font-semibold text-foreground">{comment.authorId}</div>
            <div className="text-xs text-muted-foreground">{relativeTimeStr}</div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditClick}
              disabled={isEditing || isDeleting}
            >
              수정
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              disabled={isEditing || isDeleting}
            >
              삭제
            </Button>
          </div>
        </div>

        {isEditing ? (
          <CommentEditForm
            initialContent={comment.content}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="text-foreground whitespace-pre-wrap break-words">
            {comment.content}
          </div>
        )}
      </div>

      {showAuthModal && (
        <CommentAuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setAuthAction(null);
          }}
          onSubmit={handleAuthSuccess}
          commentAuthorId={comment.authorId}
        />
      )}
    </>
  );
}

// 댓글 수정 폼 컴포넌트
interface CommentEditFormProps {
  initialContent: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel: () => void;
}

function CommentEditForm({ initialContent, onSubmit, onCancel }: CommentEditFormProps) {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(content);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={1000}
        required
        disabled={isSubmitting}
        rows={3}
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting || content.trim().length === 0}>
          {isSubmitting ? '수정 중...' : '수정'}
        </Button>
      </div>
    </form>
  );
}
