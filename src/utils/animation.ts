export const animationClasses = {
  entrance: {
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    slideDown: 'animate-slide-down',
    slideLeft: 'animate-slide-left',
    slideRight: 'animate-slide-right',
    scaleIn: 'animate-scale-in',
  },
  interactive: {
    hover: 'hover:shadow-lg hover:scale-105 transition-all duration-200',
    tap: 'active:scale-98 transition-transform duration-150',
    focus: 'focus:outline-2 focus:outline-offset-2 focus:outline-current',
  },
  scroll: {
    stagger: 'stagger-item',
    fadeIn: 'scroll-fade-in',
  },
  page: {
    fadeIn: 'page-fade-in',
    fadeOut: 'page-fade-out',
    slideIn: 'page-slide-in',
  },
};

export const transitionPresets = {
  fast: 'transition-all duration-150 ease-out',
  base: 'transition-all duration-200 ease-out',
  slow: 'transition-all duration-300 ease-out',
  slower: 'transition-all duration-400 ease-out',
};

export const shadowPresets = {
  soft: 'shadow-soft',
  medium: 'shadow-medium',
  large: 'shadow-large',
};

export function getStaggerDelay(index: number): string {
  return `${index * 50}ms`;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function shouldAnimate(): boolean {
  return !prefersReducedMotion();
}
