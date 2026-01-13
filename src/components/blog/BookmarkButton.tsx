'use client';

import { useBookmark } from '@/hooks/useBookmark';
import { Button } from '@/components/ui/Button';
import { FaBookmark } from '@/components/icons';
import { cn } from '@/utils/style';
import { motion } from 'framer-motion';

interface BookmarkButtonProps {
  postId: string;
  title: string;
  className?: string;
  variant?: 'button' | 'icon';
}

export function BookmarkButton({
  postId,
  title,
  className,
  variant = 'button'
}: BookmarkButtonProps) {
  const { isBookmarked, toggle } = useBookmark(postId);

  const handleClick = () => {
    toggle(postId, title);
  };

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className={cn('size-8', className)}
        aria-label={isBookmarked ? '북마크 제거' : '북마크 추가'}
      >
        <motion.div
          animate={isBookmarked ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <FaBookmark
            className={cn('size-4', isBookmarked && 'fill-current text-primary')}
          />
        </motion.div>
      </Button>
    );
  }

  return (
    <Button
      variant={isBookmarked ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
      className={cn('gap-2', className)}
    >
      <motion.div
        animate={isBookmarked ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <FaBookmark
          className={cn('size-4', isBookmarked && 'fill-current')}
        />
      </motion.div>
      <span>{isBookmarked ? '북마크됨' : '북마크'}</span>
    </Button>
  );
}
