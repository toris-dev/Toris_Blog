import { getDefaultOGImageUrl } from '@/utils/og-image';
import { Metadata } from 'next';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';

export const metadata: Metadata = {
  title: '문의하기 - Toris Dev Blog',
  description:
    '블로그에 관한 피드백이나 협업 제안은 언제든지 환영합니다. 문의사항을 남겨주세요.',
  openGraph: {
    title: '문의하기 - Toris Dev Blog',
    description:
      '블로그에 관한 피드백이나 협업 제안은 언제든지 환영합니다. 문의사항을 남겨주세요.',
    type: 'website',
    url: `${baseUrl}/contact`,
    images: [
      {
        url: getDefaultOGImageUrl('문의하기', 'Toris Dev Blog'),
        width: 1200,
        height: 630,
        alt: 'Toris Dev Blog 문의하기'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: '문의하기 - Toris Dev Blog',
    description:
      '블로그에 관한 피드백이나 협업 제안은 언제든지 환영합니다. 문의사항을 남겨주세요.',
    images: [getDefaultOGImageUrl('문의하기', 'Toris Dev Blog')]
  },
  alternates: {
    canonical: `${baseUrl}/contact`
  }
};

export default function ContactLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
