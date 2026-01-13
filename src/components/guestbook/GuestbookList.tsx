'use client';

import { GuestbookEntry } from '@/types/guestbook';
import { GuestbookItem } from './GuestbookItem';

interface GuestbookListProps {
  guestbooks: GuestbookEntry[];
}

export function GuestbookList({ guestbooks }: GuestbookListProps) {
  if (guestbooks.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-lg">아직 방명록이 없습니다.</p>
        <p className="mt-2 text-sm">첫 번째 방명록을 남겨보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {guestbooks.map((guestbook, index) => (
        <GuestbookItem key={guestbook.id} guestbook={guestbook} index={index} />
      ))}
    </div>
  );
}
