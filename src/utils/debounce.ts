/**
 * Debounce: runs the function after `wait` ms of no further calls.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func.apply(this, args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  } as ((...args: Parameters<T>) => void) & { cancel: () => void };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

/**
 * Throttle: runs the function at most once every `limit` ms.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  let lastTimeout: ReturnType<typeof setTimeout> | null = null;

  const run = (args: Parameters<T>) => {
    func(...args);
    inThrottle = true;
    lastArgs = null;
    lastTimeout = setTimeout(() => {
      inThrottle = false;
      if (lastArgs) {
        run(lastArgs);
      }
      lastTimeout = null;
    }, limit);
  };

  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      run(args);
    } else {
      lastArgs = args;
    }
  };
}
