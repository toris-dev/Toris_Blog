import StructuredData from '@/components/seo/StructuredData';
import { getDefaultOGImageUrl } from '@/utils/og-image';
import { Metadata } from 'next';
import { TodosPageClient } from './_components/TodosPageClient';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';

const PAGE_TITLE = '할일 관리 - Toris Blog';
const PAGE_DESCRIPTION =
  'toris-dev의 개인 할일 관리 시스템입니다. 리스트, 보드, 캘린더 뷰로 할일을 관리하고 추적하세요.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    '할일 관리',
    'todo',
    'task',
    'toris-dev',
    '개인 생산성',
    '태스크 관리'
  ],
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: 'website',
    url: `${baseUrl}/todos`,
    images: [
      {
        url: getDefaultOGImageUrl('할일 관리', PAGE_DESCRIPTION),
        width: 1200,
        height: 630,
        alt: PAGE_TITLE
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [getDefaultOGImageUrl('할일 관리', PAGE_DESCRIPTION)]
  },
  alternates: {
    canonical: `${baseUrl}/todos`
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function TodosPage() {
  return (
    <>
      <StructuredData type="website" />
      <TodosPageClient />
    </>
  );
}
