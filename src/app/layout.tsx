import CategorySidebar from '@/components/blog/CategorySidebar';
import Footer from '@/components/common/Footer';
import Header from '@/components/common/Header';
import Providers from '@/components/common/Providers';
import SEOOptimizer from '@/components/seo/SEOOptimizer';
import StructuredData from '@/components/seo/StructuredData';
import '@/styles/globals.css';
import { getPostData } from '@/utils/markdown';
import { cn } from '@/utils/style';
import { GoogleTagManager } from '@next/third-parties/google';
import { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { ReactNode, Suspense } from 'react';

// 웹 폰트 설정
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans'
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk'
});

// 6시간마다 재생성
export const revalidate = 21600;

// CategorySidebar 로딩 컴포넌트
function CategorySidebarSkeleton() {
  return (
    <div className="w-full rounded-xl border border-border bg-card/50 shadow-lg backdrop-blur-lg">
      <div className="p-6">
        <div className="flex animate-pulse flex-col items-center space-y-4">
          <div className="size-20 rounded-full bg-background/50"></div>
          <div className="h-4 w-24 rounded bg-background/50"></div>
          <div className="h-3 w-32 rounded bg-background/50"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-8 w-full rounded bg-background/50"
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 클라이언트 컴포넌트 래퍼 - useSearchParams 사용
function CategorySidebarWrapper({ posts }: { posts: any[] }) {
  return (
    <Suspense fallback={<CategorySidebarSkeleton />}>
      <CategorySidebar posts={posts} />
    </Suspense>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app'
  ),
  title: {
    default: '토리스 블로그 - 웹 개발자의 기술 블로그',
    template: '%s | 토리스 블로그'
  },
  description:
    '풀스택 웹 개발자 토리스의 기술 블로그입니다. React, Next.js, TypeScript, Node.js 등 웹 개발 기술과 프로젝트 경험을 공유합니다.',
  keywords: [
    '토리스',
    '토리스 블로그',
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
    siteName: '토리스 블로그',
    title: '토리스 블로그 - 웹 개발자의 기술 블로그',
    description:
      '풀스택 웹 개발자 토리스의 기술 블로그입니다. React, Next.js, TypeScript, Node.js 등 웹 개발 기술과 프로젝트 경험을 공유합니다.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: '토리스 블로그 - 웹 개발자의 기술 블로그'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: '토리스 블로그 - 웹 개발자의 기술 블로그',
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
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light dark" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        <StructuredData type="website" />
        <StructuredData type="person" />
        <StructuredData type="organization" />

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
          'min-h-screen bg-slate-50 font-sans antialiased dark:bg-slate-900',
          inter.variable,
          spaceGrotesk.variable
        )}
      >
        <SEOOptimizer />
        <GoogleTagManager gtmId="G-0KV4YD773C" />
        <Providers>
          {/* 배경 그라디언트 효과 - 다크모드에서만 표시 */}
          <div className="fixed -z-10 hidden h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-900 dark:block"></div>

          {/* 라이트모드 배경 */}
          <div className="fixed -z-10 block h-screen w-full bg-gradient-to-b from-white to-slate-50 dark:hidden"></div>

          <div className="flex min-h-screen flex-col">
            <Header />

            <div className="relative flex flex-1">
              {/* Sidebar */}
              <aside className="hidden lg:block lg:w-80 lg:shrink-0">
                <div className="sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto px-4">
                  <CategorySidebarWrapper posts={posts} />
                </div>
              </aside>

              {/* Main Content */}
              <div className="flex flex-1 flex-col overflow-x-hidden">
                <main className="container mx-auto flex-1 px-4 py-8 pt-24 sm:px-6 lg:px-8">
                  <div className="mx-auto w-full max-w-4xl animate-blur-in">
                    {children}
                  </div>
                </main>
                <Footer />
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
