import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/style';

const studioThemeBridge =
  '[--background:var(--toris-hsl-canvas)] [--foreground:var(--toris-hsl-ink)] [--card:var(--toris-hsl-surface)] [--card-foreground:var(--toris-hsl-ink)] [--muted:var(--toris-hsl-surface)] [--muted-foreground:var(--toris-hsl-ink-muted)] [--primary:var(--toris-hsl-signal)] [--primary-foreground:var(--toris-hsl-on-signal)] [--secondary:var(--toris-hsl-system)] [--secondary-foreground:var(--toris-hsl-on-system)] [--border:var(--toris-hsl-border)] [--ring:var(--toris-hsl-system)]';

type SurfaceProps = HTMLAttributes<HTMLElement> & { children: ReactNode };

export function StudioStage({ children, className, ...props }: SurfaceProps) {
  return (
    <section
      data-toris-theme="dark"
      data-toris-surface="stage"
      className={cn(
        studioThemeBridge,
        'relative bg-[var(--toris-canvas)] text-[var(--toris-ink)]',
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function StudioCanvas({ children, className, ...props }: SurfaceProps) {
  return (
    <section
      data-toris-theme="light"
      data-toris-surface="canvas"
      className={cn(
        studioThemeBridge,
        'relative bg-[var(--toris-canvas)] text-[var(--toris-ink)]',
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function StudioSection({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[86rem] px-4 sm:px-6 lg:px-8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function StudioEyebrow({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { children: ReactNode }) {
  return (
    <p
      className={cn(
        'flex items-center gap-3 break-keep text-sm font-semibold text-[var(--toris-system-text)] [font-family:var(--font-space-grotesk)]',
        className
      )}
      {...props}
    >
      <span
        className="h-px w-8 shrink-0 bg-[var(--toris-system)]"
        aria-hidden
      />
      {children}
    </p>
  );
}

export const studioActionStyles = cva(
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-[background-color,border-color,color,transform] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--toris-focus)] active:scale-[0.98]',
  {
    variants: {
      intent: {
        signal:
          'bg-[var(--toris-signal)] text-[var(--toris-on-signal)] hover:bg-[color-mix(in_srgb,var(--toris-signal)_88%,white)]',
        system:
          'bg-[var(--toris-system)] text-[var(--toris-on-system)] hover:bg-[color-mix(in_srgb,var(--toris-system)_88%,white)]',
        inverse:
          'bg-[var(--toris-ink)] text-[var(--toris-inverse)] hover:bg-[var(--toris-signal)] hover:text-[var(--toris-on-signal)]',
        outline:
          'border border-[var(--toris-control-border)] text-[var(--toris-ink)] hover:border-[var(--toris-system)] hover:text-[var(--toris-system-text)]'
      }
    },
    defaultVariants: { intent: 'signal' }
  }
);

export type StudioActionIntent = VariantProps<
  typeof studioActionStyles
>['intent'];
