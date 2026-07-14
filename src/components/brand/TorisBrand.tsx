import { cn } from '@/utils/style';
import Image from 'next/image';

export type TorisBrandProps = {
  variant?: 'mark' | 'lockup';
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  priority?: boolean;
};

const TORIS_MARK_SRC = '/brand/toris-mark-v2.svg';

export function TorisBrand({
  variant = 'lockup',
  className,
  markClassName,
  wordmarkClassName,
  priority = false
}: TorisBrandProps) {
  const isMarkOnly = variant === 'mark';

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center',
        !isMarkOnly && 'gap-2.5',
        className
      )}
      data-brand-variant={variant}
    >
      <Image
        src={TORIS_MARK_SRC}
        alt={isMarkOnly ? 'TORIS 로고' : ''}
        width={40}
        height={40}
        sizes="40px"
        fetchPriority={priority ? 'high' : undefined}
        className={cn('size-9 shrink-0 object-contain', markClassName)}
      />
      {!isMarkOnly ? (
        <span
          className={cn(
            'text-lg font-black tracking-[0.1em] text-current [font-family:var(--font-space-grotesk)]',
            wordmarkClassName
          )}
        >
          TORIS
        </span>
      ) : null}
    </span>
  );
}
