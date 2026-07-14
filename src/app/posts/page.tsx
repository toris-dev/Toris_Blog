import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';

export const metadata: Metadata = {
  title: '기술 블로그 | TORIS',
  description: '제품 개발과 운영 경험을 공유하는 TORIS 기술 블로그입니다.',
  alternates: {
    canonical: `${baseUrl}/blog`
  }
};

export default function PostsPage() {
  redirect('/blog');
}
