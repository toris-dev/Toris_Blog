import { getAllCategories } from '@/utils/fetch';
import { Metadata } from 'next';
import CategoryList from './_components/CategoryList';

// 정적 재생성 설정 (6시간)
export const revalidate = 60 * 60 * 6;

export const metadata: Metadata = {
  title: '카테고리 목록',
  description: '블로그의 모든 카테고리를 둘러보세요'
};

export default async function CategoriesPage() {
  // 모든 카테고리와 포스트 수 가져오기
  const categories = await getAllCategories();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
        카테고리 목록
      </h1>
      <p className="mb-8 text-gray-600 dark:text-gray-300">
        관심 있는 카테고리를 선택하여 관련 포스트를 확인해보세요.
      </p>

      <CategoryList initialCategories={categories} />
    </div>
  );
}
