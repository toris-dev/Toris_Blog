import { getPosts } from '@/utils/fetch';
import { Metadata } from 'next';
import ClientSearchPage from './_components/ClientSearchPage';

export const metadata: Metadata = {
  title: '블로그 - 모든 포스트',
  description: 'IT 개발과 프로젝트 이야기를 공유하는 블로그 포스트 모음'
};

export default async function PostsPage() {
  // 서버에서 포스트 데이터 가져오기
  const posts = await getPosts({});

  // 클라이언트 컴포넌트로 데이터 전달
  return <ClientSearchPage initialPosts={posts} />;
}
