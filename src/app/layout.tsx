import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Providers from '@/components/Providers';
import Sidebar from '@/components/Sidebar';
import ToasterContext from '@/components/context/ToasterContext';
import '@/styles/globals.css';
import { cn } from '@/utils/style';
import { GoogleTagManager } from '@next/third-parties/google';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'toris-dev의 블로그',
  description: '개발 프로젝트의 이야기를 공유하는 블로그입니다.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <title>Toris-Blog</title>
      </head>
      <body className="isolate grid place-items-center overflow-hidden bg-bkg text-content">
        <GoogleTagManager gtmId="G-0KV4YD773C" />
        <Providers>
          <div
            className={cn(
              'flex h-screen min-h-screen w-screen before:absolute before:-z-10 before:h-1/2 before:w-3/4 before:animate-spin-slower before:rounded-bl-full before:rounded-tr-full before:bg-accent-2 before:blur-3xl after:absolute after:-z-10 after:size-2/3 after:animate-spin-slow after:rounded-bl-full after:rounded-tr-full after:bg-accent-1/80 after:blur-3xl',
              inter.className
            )}
          >
            <title>Toris-Blog</title>
            <Sidebar />
            <ToasterContext />
            <div className="flex flex-1 flex-col">
              <Header />
              <div className="flex flex-1 flex-col overflow-y-auto">
                <main className="flex flex-1 flex-col">{children}</main>
                <Footer />
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
