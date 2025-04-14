'use client';

import {
  AiOutlineFolder,
  AiOutlineFolderOpen,
  AiOutlineSearch,
  BsArrowRight,
  IoIosArrowDown
} from '@/components/icons';
import { CategoryWithCount } from '@/types';
import { cn } from '@/utils/style';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CategoryListProps {
  initialCategories: CategoryWithCount[];
}

export default function CategoryList({ initialCategories }: CategoryListProps) {
  const [categories, setCategories] =
    useState<CategoryWithCount[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // 검색어에 따라 카테고리 필터링
  useEffect(() => {
    if (!searchQuery.trim()) {
      setCategories(initialCategories);
      return;
    }

    const filtered = initialCategories.filter((category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setCategories(filtered);
  }, [searchQuery, initialCategories]);

  // 카테고리 확장/축소 토글
  const toggleExpand = (categoryName: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  // 카테고리 클릭 처리
  const handleCategoryClick = (categoryName: string) => {
    setActiveCategory(categoryName === activeCategory ? null : categoryName);
  };

  // 카테고리 아이템 애니메이션 변수
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.4,
        ease: 'easeOut'
      }
    }),
    hover: {
      scale: 1.03,
      boxShadow:
        '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      transition: { duration: 0.2 }
    }
  };

  // 컨테이너 애니메이션 변수
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div>
      {/* 검색 및 뷰 전환 */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="relative max-w-md grow">
          <input
            type="text"
            placeholder="카테고리 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <AiOutlineSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400"
            size={20}
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setView('grid')}
            className={cn(
              'rounded-md px-3 py-1 transition-colors',
              view === 'grid'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            )}
          >
            그리드 보기
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'rounded-md px-3 py-1 transition-colors',
              view === 'list'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            )}
          >
            리스트 보기
          </button>
        </div>
      </div>

      {/* 결과 없음 메시지 */}
      {categories.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800"
        >
          <p className="text-gray-600 dark:text-gray-300">
            &apos;{searchQuery}&apos;에 해당하는 카테고리가 없습니다.
          </p>
        </motion.div>
      )}

      {/* 그리드 뷰 */}
      {view === 'grid' && categories.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              custom={index}
              variants={itemVariants}
              whileHover="hover"
              className={cn(
                'rounded-lg border p-6 shadow-md transition-all duration-300',
                activeCategory === category.name
                  ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30'
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
              )}
              onClick={() => handleCategoryClick(category.name)}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center text-blue-600 dark:text-blue-400">
                  <motion.div
                    whileHover={{ rotate: 15 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activeCategory === category.name ? (
                      <AiOutlineFolderOpen size={24} />
                    ) : (
                      <AiOutlineFolder size={24} />
                    )}
                  </motion.div>
                  <h3 className="ml-2 text-lg font-semibold">
                    {category.name}
                  </h3>
                </div>

                <span className="rounded-full bg-blue-100 px-2 py-1 text-sm text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {category.count}개의 포스트
                </span>
              </div>

              <motion.div
                initial={{ height: 0 }}
                animate={{
                  height: activeCategory === category.name ? 'auto' : 0,
                  opacity: activeCategory === category.name ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="mb-4 text-gray-600 dark:text-gray-300">
                  {category.name} 카테고리에 속한 {category.count}개의 포스트를
                  확인해보세요.
                </p>
                <Link
                  href={`/categories/${category.name}`}
                  className="group inline-flex items-center text-blue-600 hover:underline dark:text-blue-400"
                >
                  모든 포스트 보기
                  <motion.span
                    initial={{ x: 0 }}
                    whileHover={{ x: 3 }}
                    className="ml-1 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                  >
                    <BsArrowRight />
                  </motion.span>
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* 리스트 뷰 */}
      {view === 'list' && categories.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              custom={index}
              variants={itemVariants}
              className={cn(
                'overflow-hidden rounded-lg border',
                expandedCategories.includes(category.name)
                  ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30'
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
              )}
            >
              <div
                className="flex cursor-pointer items-center justify-between p-4"
                onClick={() => toggleExpand(category.name)}
              >
                <div className="flex items-center">
                  <motion.div
                    animate={{
                      rotate: expandedCategories.includes(category.name)
                        ? 15
                        : 0
                    }}
                    className="text-blue-600 dark:text-blue-400"
                  >
                    {expandedCategories.includes(category.name) ? (
                      <AiOutlineFolderOpen size={20} />
                    ) : (
                      <AiOutlineFolder size={20} />
                    )}
                  </motion.div>
                  <h3 className="ml-2 font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </h3>
                </div>

                <div className="flex items-center">
                  <span className="mr-3 rounded-full bg-blue-100 px-2 py-1 text-sm text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {category.count}
                  </span>

                  <motion.div
                    animate={{
                      rotate: expandedCategories.includes(category.name)
                        ? 180
                        : 0
                    }}
                  >
                    <IoIosArrowDown className="text-gray-500 dark:text-gray-400" />
                  </motion.div>
                </div>
              </div>

              <AnimatePresence>
                {expandedCategories.includes(category.name) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-200 px-4 py-3 dark:border-gray-700"
                  >
                    <p className="mb-2 text-gray-600 dark:text-gray-300">
                      {category.name} 카테고리에 속한 {category.count}개의
                      포스트를 확인해보세요.
                    </p>
                    <Link
                      href={`/categories/${category.name}`}
                      className="group inline-flex items-center text-blue-600 hover:underline dark:text-blue-400"
                    >
                      모든 포스트 보기
                      <motion.span
                        initial={{ x: 0 }}
                        whileHover={{ x: 3 }}
                        className="ml-1 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                      >
                        <BsArrowRight />
                      </motion.span>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
