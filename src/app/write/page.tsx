import WritePage from '@/components/WritePage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '새 글 작성 | 블로그',
  description: '새로운 블로그 글을 작성합니다.'
};

export default function WritePageRoute() {
  return <WritePage />;
}

export const dynamic = 'force-dynamic';
