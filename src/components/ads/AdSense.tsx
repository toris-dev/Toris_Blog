'use client';

import { useEffect, useRef, useState } from 'react';

interface AdSenseProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  fullWidthResponsive?: boolean;
  className?: string;
}

export function AdSense({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = ''
}: AdSenseProps) {
  const [mounted, setMounted] = useState(false);
  const [cookieConsent, setCookieConsent] = useState<string | null>(null);
  const adRef = useRef<HTMLDivElement>(null);
  const adSenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;

  useEffect(() => {
    setMounted(true);
    // 쿠키 동의 상태 확인
    const consent = localStorage.getItem('cookie-consent');
    setCookieConsent(consent);
  }, []);

  useEffect(() => {
    // 쿠키 동의가 없으면 광고를 표시하지 않음
    if (
      !mounted ||
      !adRef.current ||
      !adSenseId ||
      cookieConsent !== 'accepted'
    ) {
      return;
    }

    // 이미 광고가 로드되었는지 확인
    if (adRef.current.querySelector('ins')) {
      return;
    }

    const loadAd = () => {
      if (!adRef.current) return;

      try {
        // AdSense 스크립트가 로드되었는지 확인
        if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
          // 광고 삽입
          const ins = document.createElement('ins');
          ins.className = 'adsbygoogle';
          ins.style.display = 'block';
          ins.setAttribute('data-ad-client', adSenseId);
          ins.setAttribute('data-ad-slot', adSlot);
          ins.setAttribute('data-ad-format', adFormat);
          if (fullWidthResponsive) {
            ins.setAttribute('data-full-width-responsive', 'true');
          }

          adRef.current.appendChild(ins);

          // 광고 푸시
          try {
            ((window as any).adsbygoogle =
              (window as any).adsbygoogle || []).push({});
          } catch (error) {
            console.error('AdSense push error:', error);
          }
        } else {
          // 스크립트가 아직 로드되지 않았으면 잠시 후 다시 시도
          setTimeout(loadAd, 100);
        }
      } catch (error) {
        console.error('AdSense error:', error);
      }
    };

    // 초기 로드 시도
    loadAd();
  }, [
    mounted,
    adSlot,
    adFormat,
    fullWidthResponsive,
    adSenseId,
    cookieConsent
  ]);

  // 쿠키 동의가 없으면 광고를 표시하지 않음
  if (!mounted || !adSenseId || cookieConsent !== 'accepted') {
    return null;
  }

  return (
    <div
      ref={adRef}
      className={`adsense-container ${className}`}
      style={{ minHeight: '100px' }}
    >
      {/* 광고는 동적으로 삽입됩니다 */}
    </div>
  );
}
