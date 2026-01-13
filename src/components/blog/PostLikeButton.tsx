'use client';

import { usePostLike } from '@/hooks/usePostLike';
import { Button } from '@/components/ui/Button';
import { FaHeart } from '@/components/icons';
import { cn } from '@/utils/style';
import { motion } from 'framer-motion';

interface PostLikeButtonProps {
  postId: string;
  className?: string;
}

export function PostLikeButton({ postId, className }: PostLikeButtonProps) {
  const { liked, likeCount, isLoading, toggle } = usePostLike(postId);

  const formattedCount = likeCount.toLocaleString();

  return (
    <Button
      variant={liked ? 'default' : 'outline'}
      size="sm"
      onClick={toggle}
      disabled={isLoading}
      className={cn('gap-2', className)}
    >
      <motion.div
        animate={liked ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <FaHeart className={cn('size-4', liked && 'fill-current')} />
      </motion.div>
      <span>{formattedCount}</span>
    </Button>
  );
}
