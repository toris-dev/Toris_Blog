import StructuredData from '@/components/seo/StructuredData';
import { getDefaultOGImageUrl } from '@/utils/og-image';
import { Metadata } from 'next';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';

export const metadata: Metadata = {
  title: '프로젝트 상담 - TORIS',
  description:
    '웹·앱·데스크톱·MVP 개발 유형, 예산과 일정, 필요한 기능을 남기고 프로젝트 범위를 상담하세요.',
  openGraph: {
    title: '프로젝트 상담 - TORIS',
    description:
      '웹·앱·데스크톱·MVP 개발 유형, 예산과 일정, 필요한 기능을 남기고 프로젝트 범위를 상담하세요.',
    type: 'website',
    url: `${baseUrl}/contact`,
    images: [
      {
        url: getDefaultOGImageUrl('프로젝트 상담', 'TORIS 제품 개발 스튜디오'),
        width: 1200,
        height: 630,
        alt: 'TORIS 프로젝트 상담'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: '프로젝트 상담 - TORIS',
    description:
      '웹·앱·데스크톱·MVP 개발 유형, 예산과 일정, 필요한 기능을 남기고 프로젝트 범위를 상담하세요.',
    images: [getDefaultOGImageUrl('프로젝트 상담', 'TORIS 제품 개발 스튜디오')]
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
  return (
    <>
      <StructuredData
        page="contact"
        data={{
          url: `${baseUrl}/contact`,
          name: '프로젝트 상담 - TORIS',
          description:
            '웹·앱·데스크톱·MVP 개발 유형, 예산과 일정, 필요한 기능을 남기고 프로젝트 범위를 상담하세요.'
        }}
        breadcrumb={[
          { name: '홈', url: '/' },
          { name: '프로젝트 상담', url: '/contact' }
        ]}
      />
      {children}
    </>
  );
}
