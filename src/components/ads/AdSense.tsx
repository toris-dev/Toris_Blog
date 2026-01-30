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
          const container = adRef.current;
          // availableWidth=0 오류 방지: 컨테이너가 실제 너비를 가질 때만 푸시
          const pushWhenVisible = () => {
            const width = container.getBoundingClientRect().width;
            if (width > 0) {
              try {
                ((window as any).adsbygoogle =
                  (window as any).adsbygoogle || []).push({});
              } catch (error) {
                console.error('AdSense push error:', error);
              }
              return true;
            }
            return false;
          };

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

          container.appendChild(ins);

          // 이미 너비가 있으면 즉시 푸시, 없으면 ResizeObserver로 대기
          if (!pushWhenVisible()) {
            const observer = new ResizeObserver(() => {
              if (pushWhenVisible()) {
                observer.disconnect();
              }
            });
            observer.observe(container);
            // 일정 시간 후에도 너비가 0이면 observer 해제 (메모리 누수 방지)
            setTimeout(() => observer.disconnect(), 10000);
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
    <div ref={adRef} className={`min-h-[100px] ${className}`}>
      {/* 광고는 동적으로 삽입됩니다 */}
    </div>
  );
}
