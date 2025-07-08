import Footer from '@/components/common/Footer';
import Header from '@/components/common/Header';
import Providers from '@/components/common/Providers';
import Sidebar from '@/components/common/Sidebar';
import ToasterContext from '@/components/context/ToasterContext';
import '@/styles/globals.css';
import { cn } from '@/utils/style';
import { GoogleTagManager } from '@next/third-parties/google';
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

// 6시간마다 재생성
export const revalidate = 21600;

export const metadata: Metadata = {
  title: {
    default: '토리스 블로그',
    template: '%s | 토리스 블로그'
  },
  description:
    '토리스의 개발 블로그 - 웹 개발, 프로그래밍, 기술 트렌드에 관한 내용을 다룹니다.',
  keywords: [
    '블로그',
    '개발',
    '프로그래밍',
    'JavaScript',
    'TypeScript',
    'React',
    'Next.js'
  ],
  authors: [{ name: '토리스', url: 'https://github.com/toris-dev' }],
  creator: '토리스',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-dev.vercel.app',
    title: '토리스 블로그',
    description:
      '토리스의 개발 블로그 - 웹 개발, 프로그래밍, 기술 트렌드에 관한 내용을 다룹니다.',
    siteName: '토리스 블로그'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <Script id="ms-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "lqbjs84qx3");
          `}
        </Script>
      </head>
      <body
        className={cn(
          'min-h-screen bg-slate-50 font-sans antialiased dark:bg-slate-900',
          inter.variable,
          spaceGrotesk.variable
        )}
      >
        <GoogleTagManager gtmId="G-0KV4YD773C" />
        <Providers>
          {/* 배경 그라디언트 효과 - 다크모드에서만 표시 */}
          <div className="bg-gradient hidden dark:block">
            <div className="fixed -z-10 h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-slate-900"></div>
          </div>

          {/* 라이트모드 배경 */}
          <div className="bg-gradient block dark:hidden">
            <div className="fixed -z-10 h-screen w-full bg-gradient-to-b from-white to-slate-50"></div>
          </div>

          <div className="flex min-h-screen flex-col">
            <Header />

            <div className="relative flex flex-1">
              <Sidebar />

              <div className="flex flex-1 flex-col overflow-x-hidden">
                <ToasterContext />
                <main className="container mx-auto flex-1 px-4 py-8 pt-24 sm:px-6 lg:px-8 lg:pl-[300px]">
                  <div className="mx-auto w-full max-w-5xl animate-blur-in">
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
