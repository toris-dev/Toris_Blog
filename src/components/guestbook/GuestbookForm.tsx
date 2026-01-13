'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/style';
import { validateGuestbookInput } from '@/utils/guestbook';
import toast from 'react-hot-toast';

interface GuestbookFormProps {
  onSubmit: (data: { nickname: string; message: string }) => Promise<void>;
  isSubmitting?: boolean;
}

export function GuestbookForm({ onSubmit, isSubmitting = false }: GuestbookFormProps) {
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors([]);

    // 클라이언트 측 검증
    const validation = validateGuestbookInput(nickname, message);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      await onSubmit({
        nickname,
        message
      });

      // 성공 시 폼 초기화
      setNickname('');
      setMessage('');
      setErrors([]);
      toast.success('방명록이 작성되었습니다.');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '방명록 작성 중 오류가 발생했습니다.';
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

      <div>
        <label htmlFor="nickname" className="mb-2 block text-sm font-medium text-foreground">
          닉네임
        </label>
        <Input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임을 입력하세요"
          maxLength={30}
          required
          disabled={isSubmitting}
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium text-foreground">
          메시지
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="방명록에 남길 메시지를 입력하세요"
          maxLength={500}
          required
          disabled={isSubmitting}
          rows={5}
          className={cn(
            'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            'resize-none'
          )}
        />
        <div className="mt-1 text-right text-xs text-muted-foreground">
          {message.length} / 500
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '작성 중...' : '작성'}
        </Button>
      </div>
    </form>
  );
}
