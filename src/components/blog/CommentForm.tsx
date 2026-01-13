'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/style';
import { validateCommentInput } from '@/utils/comment';
import toast from 'react-hot-toast';

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSubmit: (data: {
    authorId: string;
    password: string;
    content: string;
    parentId?: string;
  }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function CommentForm({
  postId,
  parentId,
  onSubmit,
  onCancel,
  isSubmitting = false
}: CommentFormProps) {
  const [authorId, setAuthorId] = useState('');
  const [password, setPassword] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors([]);

    // 클라이언트 측 검증
    const validation = validateCommentInput(authorId, password, content);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      await onSubmit({
        authorId,
        password,
        content,
        parentId
      });

      // 성공 시 폼 초기화
      setAuthorId('');
      setPassword('');
      setContent('');
      setErrors([]);
      toast.success('댓글이 작성되었습니다.');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '댓글 작성 중 오류가 발생했습니다.';
      setErrors([errorMessage]);
      toast.error(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="authorId" className="mb-2 block text-sm font-medium text-foreground">
            작성자 ID
          </label>
          <Input
            id="authorId"
            type="text"
            value={authorId}
            onChange={(e) => setAuthorId(e.target.value)}
            placeholder="작성자 ID를 입력하세요"
            maxLength={50}
            required
            disabled={isSubmitting}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
            비밀번호
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            maxLength={50}
            required
            disabled={isSubmitting}
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label htmlFor="content" className="mb-2 block text-sm font-medium text-foreground">
          댓글 내용
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력하세요"
          maxLength={1000}
          required
          disabled={isSubmitting}
          rows={4}
          className={cn(
            'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            'resize-none'
          )}
        />
        <div className="mt-1 text-right text-xs text-muted-foreground">
          {content.length} / 1000
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '작성 중...' : '작성'}
        </Button>
      </div>
    </form>
  );
}
