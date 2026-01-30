import Footer from '@/components/common/Footer';
import Header from '@/components/common/Header';
import Providers from '@/components/common/Providers';
import ServiceWorkerRegistration from '@/components/common/ServiceWorkerRegistration';
import Sidebar from '@/components/common/Sidebar';
import SEOOptimizer from '@/components/seo/SEOOptimizer';
import StructuredData from '@/components/seo/StructuredData';
import CookieConsent from '@/components/common/CookieConsent';
import { AdSense } from '@/components/ads/AdSense';
import '@/styles/globals.css';
import { getPostData } from '@/utils/markdown';
import { cn } from '@/utils/style';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import { ReactNode } from 'react';

// 웹 폰트 설정
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans'
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk'
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app'
  ),
  title: {
    default: 'Toris Blog - 웹 개발자의 기술 블로그',
    template: '%s | Toris Blog'
  },
  description:
    '풀스택 웹 개발자 토리스의 기술 블로그입니다. React, Next.js, TypeScript, Node.js 등 웹 개발 기술과 프로젝트 경험을 공유합니다.',
  keywords: [
    '토리스',
    'Toris Blog',
    '웹 개발',
    '프론트엔드',
    '백엔드',
    '풀스택',
    'React',
    'Next.js',
    'TypeScript',
    'JavaScript',
    'Node.js',
    '개발 블로그',
    '기술 블로그',
    '프로그래밍',
    '코딩',
    '개발자',
    'toris-dev'
  ],
  authors: [{ name: '토리스', url: 'https://github.com/toris-dev' }],
  creator: '토리스',
  publisher: '토리스',
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  category: 'technology',
  classification: 'Technology Blog',
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app',
    siteName: 'Toris Blog',
    title: 'Toris Blog - 웹 개발자의 기술 블로그',
    description:
      '풀스택 웹 개발자 토리스의 기술 블로그입니다. React, Next.js, TypeScript, Node.js 등 웹 개발 기술과 프로젝트 경험을 공유합니다.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Toris Blog - 웹 개발자의 기술 블로그'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Toris Blog - 웹 개발자의 기술 블로그',
    description:
      '풀스택 웹 개발자 토리스의 기술 블로그입니다. React, Next.js, TypeScript, Node.js 등 웹 개발 기술과 프로젝트 경험을 공유합니다.',
    creator: '@toris_dev',
    images: ['/images/twitter-image.png']
  },
  verification: {
    google: 'your-google-verification-code',
    other: {
      'naver-site-verification': 'your-naver-verification-code'
    }
  },
  alternates: {
    canonical:
      process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app',
    languages: {
      'ko-KR':
        process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app'
    },
    types: {
      'application/rss+xml': [
        {
          url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app'}/feed.xml`,
          title: 'Toris Blog RSS Feed'
        }
      ]
    }
  },
  other: {
    'google-adsense-account': 'ca-pub-your-adsense-id'
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // 서버에서 posts 데이터 가져오기 (SEO를 위해)
  let posts: any[] = [];
  try {
    posts = getPostData();
  } catch (error) {
    console.error('Error fetching posts in layout:', error);
  }

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#0f172a"
          media="(prefers-color-scheme: dark)"
        />
        <link
          rel="icon"
          href="/images/favicon.svg"
          sizes="any"
          type="image/svg+xml"
        />
        <link
          rel="alternate icon"
          href="/images/favicon.svg"
          type="image/svg+xml"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Toris Blog RSS Feed"
          href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app'}/feed.xml`}
        />
        <link rel="manifest" href="/manifest.json" />

        <StructuredData type="website" />
        <StructuredData type="person" />
        <StructuredData type="organization" />

        {/* Google AdSense - 쿠키 동의 후에만 로드 */}
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <Script
            id="adsense-init"
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}

        {/* <Script id="ms-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "lqbjs84qx3");
          `}
        </Script> */}
      </head>
      <body
        className={cn(
          'min-h-screen font-sans antialiased',
          inter.variable,
          spaceGrotesk.variable
        )}
      >
        <SEOOptimizer />
        <GoogleAnalytics gaId="G-0KV4YD773C" />
        <Analytics />
        <SpeedInsights />
        <ServiceWorkerRegistration />
        <Providers>
          {/* 2D 아트 배경 - 패턴은 globals.css에서 처리 */}

          <div className="flex min-h-screen max-w-full flex-col overflow-x-hidden">
            <Header />

            <div className="relative flex max-w-full flex-1 overflow-x-hidden">
              {/* Sidebar */}
              <Sidebar posts={posts} />

              {/* Main Content */}
              <div className="flex min-w-0 max-w-full flex-1 flex-col overflow-x-hidden">
                <main className="w-full max-w-full flex-1 overflow-x-hidden px-4 py-8 pt-24 sm:px-6 lg:px-8">
                  <div className="mx-auto w-full max-w-7xl animate-blur-in overflow-x-hidden">
                    {children}
                  </div>
                </main>
              </div>
            </div>

            {/* 모바일 리본 광고 */}
            {process.env.NEXT_PUBLIC_ADSENSE_MOBILE_RIBBON_UNIT_ID && (
              <div className="lg:hidden">
                <div className="sticky bottom-0 z-50 w-full border-t border-border bg-background">
                  <AdSense
                    adSlot={
                      process.env.NEXT_PUBLIC_ADSENSE_MOBILE_RIBBON_UNIT_ID
                    }
                    adFormat="horizontal"
                    fullWidthResponsive={true}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            <Footer />
          </div>

          {/* 쿠키 동의 배너 */}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
