'use client';

import { useState, useEffect, useCallback } from 'react';
import { GuestbookForm } from '@/components/guestbook/GuestbookForm';
import { GuestbookList } from '@/components/guestbook/GuestbookList';
import { GuestbookEntry, GuestbookFormData } from '@/types/guestbook';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/style';

export default function GuestbookPage() {
  const [guestbooks, setGuestbooks] = useState<GuestbookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // 방명록 조회
  const fetchGuestbooks = useCallback(async (pageNum: number = 1) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/guestbook?page=${pageNum}&limit=20`);

      if (!response.ok) {
        throw new Error('방명록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      if (pageNum === 1) {
        setGuestbooks(data.guestbooks || []);
      } else {
        setGuestbooks((prev) => [...prev, ...(data.guestbooks || [])]);
      }
      setHasMore(data.pagination.page < data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Error fetching guestbooks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuestbooks(page);
  }, [fetchGuestbooks, page]);

  // 방명록 작성
  const handleSubmit = async (formData: GuestbookFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/guestbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '방명록 작성에 실패했습니다.');
      }

      // 방명록 목록 새로고침
      setPage(1);
      await fetchGuestbooks(1);
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold text-foreground">방명록</h1>
        <p className="text-muted-foreground">
          방문해주셔서 감사합니다! 간단한 인사말이나 소감을 남겨주세요.
        </p>
      </div>

      <div className="space-y-8">
        {/* 방명록 작성 폼 */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-foreground">방명록 작성</h2>
          <GuestbookForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>

        {/* 방명록 목록 */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              방명록 {total > 0 && <span className="text-muted-foreground">({total})</span>}
            </h2>
          </div>

          {isLoading && page === 1 ? (
            <div className="py-12 text-center text-muted-foreground">방명록을 불러오는 중...</div>
          ) : (
            <>
              <GuestbookList guestbooks={guestbooks} />

              {/* 페이지네이션 */}
              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={isLoading}
                  >
                    {isLoading ? '불러오는 중...' : '더 보기'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
