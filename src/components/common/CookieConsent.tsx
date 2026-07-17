'use client';

import { useEffect, useState } from 'react';
import { FaCookieBite } from '@react-icons/all-files/fa/FaCookieBite';
import { Button } from '@/components/ui/Button';
import CookieSettingModal from './CookieSettingModal';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSettingModal, setShowSettingModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem(
      'cookie-settings',
      JSON.stringify({
        essential: true,
        analytics: true,
        marketing: true
      })
    );
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    localStorage.setItem(
      'cookie-settings',
      JSON.stringify({
        essential: true,
        analytics: false,
        marketing: false
      })
    );
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);
  };

  const handleManage = () => {
    setShowSettingModal(true);
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      {showBanner && (
        <div
          role="region"
          aria-label="쿠키 사용 안내"
          className="fixed inset-x-4 bottom-20 z-[60] animate-slide-up md:inset-x-auto md:bottom-4 md:right-4 md:w-[min(28rem,calc(100vw-2rem))]"
        >
          <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 rounded-2xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <FaCookieBite className="size-3.5 text-primary" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-xs font-bold text-card-foreground">
                쿠키 사용 안내
              </h3>
              <button
                onClick={handleManage}
                className="mt-0.5 text-[11px] font-medium text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
              >
                설정 관리
              </button>
            </div>
            <Button onClick={handleReject} size="sm" variant="outline">
              거부
            </Button>
            <Button onClick={handleAccept} size="sm" variant="default">
              동의
            </Button>
          </div>
        </div>
      )}
      <CookieSettingModal
        isOpen={showSettingModal}
        onClose={() => setShowSettingModal(false)}
      />
    </>
  );
}
