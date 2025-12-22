'use client';

import { FaLink, FaShare, FaTwitter } from '@/components/icons';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface ShareButtonsProps {
  title: string;
  description?: string;
  image?: string;
  url: string;
}

declare global {
  interface Window {
    Kakao: any;
  }
}

export function ShareButtons({
  title,
  description,
  image,
  url
}: ShareButtonsProps) {
  const [mounted, setMounted] = useState(false);
  const [kakaoInitialized, setKakaoInitialized] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 카카오 SDK 초기화
  useEffect(() => {
    if (!mounted) return;

    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_KEY;
    if (!kakaoKey) {
      console.warn('Kakao API key is not set');
      return;
    }

    // 카카오 SDK가 이미 로드되어 있는지 확인
    if (window.Kakao && window.Kakao.isInitialized()) {
      setKakaoInitialized(true);
      return;
    }

    // 카카오 SDK 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
    script.async = true;
    script.onload = () => {
      if (window.Kakao) {
        window.Kakao.init(kakaoKey);
        setKakaoInitialized(true);
      }
    };
    document.head.appendChild(script);

    return () => {
      // cleanup은 하지 않음 (SDK는 전역적으로 사용)
    };
  }, [mounted]);

  const handleKakaoShare = () => {
    if (!kakaoInitialized || !window.Kakao) {
      toast.error(
        '카카오톡 공유를 준비하는 중입니다. 잠시 후 다시 시도해주세요.'
      );
      return;
    }

    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: title,
          description: description || title,
          imageUrl:
            image ||
            `${process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app'}/images/og-image.png`,
          link: {
            mobileWebUrl: url,
            webUrl: url
          }
        }
      });
      toast.success('카카오톡으로 공유했습니다!');
    } catch (error) {
      console.error('Kakao share error:', error);
      toast.error('공유에 실패했습니다.');
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    toast.success('트위터 공유 창을 열었습니다.');
  };

  const handleCopyLink = async () => {
    try {
      // 클립보드 API 사용 시도
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('링크가 클립보드에 복사되었습니다!');
      } else {
        // Fallback: 구식 방법 사용
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand('copy');
          if (successful) {
            toast.success('링크가 클립보드에 복사되었습니다!');
          } else {
            throw new Error('execCommand failed');
          }
        } catch (err) {
          throw err;
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Copy error:', error);
      // 최종 fallback: URL을 사용자에게 표시
      toast.error(`링크 복사에 실패했습니다. 링크: ${url}`, {
        duration: 5000
      });
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="my-8 flex flex-wrap items-center justify-center gap-3 border-y border-border py-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FaShare className="text-base" />
        <span>공유하기</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleKakaoShare}
          className="flex items-center justify-center rounded-lg bg-[#FEE500] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#FEE500]/90"
          aria-label="카카오톡 공유"
          title="카카오톡 공유"
        >
          <svg
            className="mr-2 size-4"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3Z" />
          </svg>
          <span className="hidden sm:inline">카카오톡</span>
        </button>
        <button
          onClick={handleTwitterShare}
          className="flex items-center justify-center rounded-lg bg-[#1DA1F2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1DA1F2]/90"
          aria-label="트위터 공유"
          title="트위터 공유"
        >
          <FaTwitter className="mr-2" />
          <span className="hidden sm:inline">트위터</span>
        </button>
        <button
          onClick={handleCopyLink}
          className="flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          aria-label="링크 복사"
          title="링크 복사"
        >
          <FaLink className="mr-2" />
          <span className="hidden sm:inline">링크 복사</span>
        </button>
      </div>
    </div>
  );
}
