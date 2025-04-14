import PostsList from '@/components/PostsList';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '블로그 - 모든 포스트',
  description: 'IT 개발과 프로젝트 이야기를 공유하는 블로그 포스트 모음'
};

export default async function PostsPage() {
  return <PostsList />;
}
