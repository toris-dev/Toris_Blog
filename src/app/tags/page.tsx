import { getTagsWithCount } from '@/utils/fetch';
import { Metadata } from 'next';
import TagList from './_components/TagList';

// 정적 재생성 설정 (6시간)
export const revalidate = 60 * 60 * 6;

export const metadata: Metadata = {
  title: '태그 목록',
  description: '블로그의 모든 태그를 둘러보세요'
};

export default async function TagsPage() {
  // 모든 태그와 포스트 수 가져오기
  const tags = await getTagsWithCount();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
        태그 목록
      </h1>
      <p className="mb-8 text-gray-600 dark:text-gray-300">
        관심 있는 태그를 선택하여 관련 포스트를 확인해보세요.
      </p>

      <TagList initialTags={tags} />
    </div>
  );
}

export const dynamic = 'force-dynamic';
