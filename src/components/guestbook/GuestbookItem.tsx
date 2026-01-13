'use client';

import { GuestbookEntry } from '@/types/guestbook';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import { motion } from 'framer-motion';

dayjs.extend(relativeTime);
dayjs.locale('ko');

interface GuestbookItemProps {
  guestbook: GuestbookEntry;
  index: number;
}

export function GuestbookItem({ guestbook, index }: GuestbookItemProps) {
  const relativeTimeStr = dayjs(guestbook.createdAt).fromNow();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {guestbook.nickname.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-foreground">{guestbook.nickname}</div>
            <div className="text-xs text-muted-foreground">{relativeTimeStr}</div>
          </div>
        </div>
      </div>

      <div className="text-foreground whitespace-pre-wrap break-words pl-13">
        {guestbook.message}
      </div>
    </motion.div>
  );
}
