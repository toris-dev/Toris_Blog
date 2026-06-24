import StructuredData from '@/components/seo/StructuredData';
import { Metadata } from 'next';
import { ReactNode } from 'react';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';

export const metadata: Metadata = {
  title: '북마크',
  description:
    '북마크한 블로그 포스트를 모아서 볼 수 있습니다. Toris Blog.',
  openGraph: {
    title: '북마크 | Toris Blog',
    description:
      '북마크한 블로그 포스트를 모아서 볼 수 있습니다. Toris Blog.',
    type: 'website',
    url: `${baseUrl}/bookmarks`
  },
  twitter: {
    card: 'summary',
    title: '북마크 | Toris Blog',
    description: '북마크한 블로그 포스트를 모아서 볼 수 있습니다.'
  },
  alternates: {
    canonical: `${baseUrl}/bookmarks`
  }
};

export default function BookmarksLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StructuredData
        page="collection"
        data={{
          url: `${baseUrl}/bookmarks`,
          name: '북마크 | Toris Blog',
          description:
            '북마크한 블로그 포스트를 모아서 볼 수 있습니다. Toris Blog.'
        }}
        breadcrumb={[
          { name: '홈', url: '/' },
          { name: '북마크', url: '/bookmarks' }
        ]}
      />
      {children}
    </>
  );
}
