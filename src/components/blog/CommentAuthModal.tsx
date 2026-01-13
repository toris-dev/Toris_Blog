'use client';

import { useState, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/style';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface CommentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (authorId: string, password: string) => Promise<void>;
  commentAuthorId: string;
}

export function CommentAuthModal({
  isOpen,
  onClose,
  onSubmit,
  commentAuthorId
}: CommentAuthModalProps) {
  const [authorId, setAuthorId] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!authorId.trim() || !password.trim()) {
      setError('작성자 ID와 비밀번호를 입력해주세요.');
      return;
    }

    if (authorId.trim() !== commentAuthorId) {
      setError('작성자 ID가 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(authorId.trim(), password);
      // 성공 시 폼 초기화 및 모달 닫기
      setAuthorId('');
      setPassword('');
      setError('');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '인증에 실패했습니다.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAuthorId('');
      setPassword('');
      setError('');
      onClose();
    }
  };

  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
            >
              <h2 className="mb-4 text-xl font-semibold text-foreground">댓글 인증</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="auth-authorId"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    작성자 ID
                  </label>
                  <Input
                    id="auth-authorId"
                    type="text"
                    value={authorId}
                    onChange={(e) => setAuthorId(e.target.value)}
                    placeholder="작성자 ID를 입력하세요"
                    required
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>

                <div>
                  <label
                    htmlFor="auth-password"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    비밀번호
                  </label>
                  <Input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    required
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    취소
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? '확인 중...' : '확인'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
