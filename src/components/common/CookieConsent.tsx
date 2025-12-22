'use client';

import { useEffect, useState } from 'react';
import { FaCookieBite } from '@react-icons/all-files/fa/FaCookieBite';
import { Button } from '@/components/ui/Button';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 쿠키 동의 상태 확인
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // 약간의 딜레이 후 배너 표시 (사용자 경험 개선)
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);
    // 페이지 리로드하여 광고 스크립트 활성화
    window.location.reload();
  };

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);
  };

  const handleManage = () => {
    // 쿠키 설정 모달 열기 (추후 구현 가능)
    const consent = localStorage.getItem('cookie-consent');
    if (consent === 'accepted') {
      // 이미 동의한 경우 설정 변경 가능
      localStorage.removeItem('cookie-consent');
      window.location.reload();
    }
  };

  if (!mounted || !showBanner) {
    return null;
  }

  return (
    <div className="animate-slide-up fixed bottom-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="mx-auto max-w-4xl rounded-lg border border-border bg-card p-6 shadow-lg backdrop-blur-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <FaCookieBite className="mt-1 size-6 shrink-0 text-primary" />
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                  쿠키 사용 동의
                </h3>
                <p className="text-sm text-muted-foreground">
                  이 웹사이트는 최적의 경험을 제공하기 위해 쿠키를 사용합니다.
                  광고 및 분석을 위한 쿠키 사용에 동의하시겠습니까?
                </p>
                <button
                  onClick={handleManage}
                  className="mt-2 text-xs text-primary underline hover:text-primary/80"
                >
                  쿠키 설정 관리
                </button>
              </div>
            </div>
            <div className="flex shrink-0 gap-2 sm:flex-col">
              <Button
                onClick={handleAccept}
                className="w-full sm:w-auto"
                variant="default"
              >
                동의
              </Button>
              <Button
                onClick={handleReject}
                className="w-full sm:w-auto"
                variant="outline"
              >
                거부
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
