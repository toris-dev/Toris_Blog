import { Metadata } from 'next';
import { ReactNode } from 'react';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';

export const metadata: Metadata = {
  title: '방명록',
  description:
    'Toris Blog 방명록입니다. 방문 소감이나 인사를 남겨주세요.',
  openGraph: {
    title: '방명록 | Toris Blog',
    description: 'Toris Blog 방명록입니다. 방문 소감이나 인사를 남겨주세요.',
    type: 'website',
    url: `${baseUrl}/guestbook`
  },
  twitter: {
    card: 'summary',
    title: '방명록 | Toris Blog',
    description: 'Toris Blog 방명록입니다. 방문 소감이나 인사를 남겨주세요.'
  },
  alternates: {
    canonical: `${baseUrl}/guestbook`
  }
};

export default function GuestbookLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
