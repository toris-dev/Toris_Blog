'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface CookieSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CookieSettingModal({
  isOpen,
  onClose
}: CookieSettingModalProps) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('cookie-settings');
    return saved
      ? JSON.parse(saved)
      : {
          essential: true,
          analytics: false,
          marketing: false
        };
  });

  const handleSave = () => {
    localStorage.setItem('cookie-settings', JSON.stringify(settings));
    localStorage.setItem('cookie-consent', 'customized');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    onClose();
  };

  const handleAcceptAll = () => {
    const newSettings = {
      essential: true,
      analytics: true,
      marketing: true
    };
    setSettings(newSettings);
    localStorage.setItem('cookie-settings', JSON.stringify(newSettings));
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold text-card-foreground">
          쿠키 설정
        </h2>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="essential"
              checked={settings.essential}
              disabled
              className="mt-1 cursor-not-allowed"
            />
            <div className="flex-1">
              <label htmlFor="essential" className="font-semibold text-sm">
                필수 쿠키
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                웹사이트 기능을 위해 필수적입니다. 항상 활성화됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="analytics"
              checked={settings.analytics}
              onChange={(e) =>
                setSettings({ ...settings, analytics: e.target.checked })
              }
              className="mt-1 cursor-pointer"
            />
            <div className="flex-1">
              <label htmlFor="analytics" className="font-semibold text-sm">
                분석 쿠키
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                방문자 분석 및 사이트 성능 개선에 사용됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="marketing"
              checked={settings.marketing}
              onChange={(e) =>
                setSettings({ ...settings, marketing: e.target.checked })
              }
              className="mt-1 cursor-pointer"
            />
            <div className="flex-1">
              <label htmlFor="marketing" className="font-semibold text-sm">
                마케팅 쿠키
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                맞춤형 광고 및 마케팅 활동에 사용됩니다.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            variant="default"
            className="flex-1"
          >
            저장
          </Button>
          <Button
            onClick={handleAcceptAll}
            variant="default"
            className="flex-1"
          >
            모두 허용
          </Button>
        </div>
      </div>
    </div>
  );
}
