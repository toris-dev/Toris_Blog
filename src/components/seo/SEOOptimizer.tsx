'use client';

import { useEffect } from 'react';

const SEOOptimizer = () => {
  useEffect(() => {
    // Next.js의 next/font/google이 폰트를 자동으로 최적화하고 preload하므로
    // 수동으로 폰트 preload할 필요 없음

    // Add DNS prefetch for external domains
    const dnsPrefetchLinks = [
      'https://www.googletagmanager.com',
      'https://github.com'
    ];

    dnsPrefetchLinks.forEach((href) => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = href;
      document.head.appendChild(link);
    });
  }, []);

  return null;
};

export default SEOOptimizer;
