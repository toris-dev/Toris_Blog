'use client';

import {
  AiOutlineSearch,
  AiOutlineTag,
  BsArrowRight
} from '@/components/icons';
import { TagWithCount } from '@/types';
import { cn } from '@/utils/style';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface TagListProps {
  initialTags: TagWithCount[];
}

export default function TagList({ initialTags }: TagListProps) {
  const [tags, setTags] = useState<TagWithCount[]>(initialTags);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [view, setView] = useState<'cloud' | 'grid'>('cloud');

  // 검색어에 따라 태그 필터링
  useEffect(() => {
    if (!searchQuery.trim()) {
      setTags(initialTags);
      return;
    }

    const filtered = initialTags.filter((tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setTags(filtered);
  }, [searchQuery, initialTags]);

  // 태그 크기 계산 (태그 클라우드용)
  const getTagSize = (count: number) => {
    const max = Math.max(...initialTags.map((t) => t.count));
    const min = Math.min(...initialTags.map((t) => t.count));

    // 최소 및 최대 크기 설정 (rem 단위)
    const minSize = 0.9;
    const maxSize = 2.0;

    if (max === min) return `${(minSize + maxSize) / 2}rem`;

    // 태그 포스트 수에 따라 크기 계산
    const size = minSize + ((count - min) / (max - min)) * (maxSize - minSize);
    return `${size.toFixed(1)}rem`;
  };

  // 태그 색상 계산 (태그 클라우드용)
  const getTagColor = (count: number) => {
    const max = Math.max(...initialTags.map((t) => t.count));
    const min = Math.min(...initialTags.map((t) => t.count));

    // 색상 강도 계산 (0~100)
    const intensity =
      max === min ? 50 : Math.floor(((count - min) / (max - min)) * 100);

    return {
      light: `hsl(210, ${40 + intensity * 0.6}%, ${40 + intensity * 0.3}%)`,
      dark: `hsl(210, ${50 + intensity * 0.5}%, ${30 + intensity * 0.3}%)`
    };
  };

  // 태그 아이템 애니메이션 변수
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
      scale: 1.05,
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
        staggerChildren: 0.05
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
            placeholder="태그 검색..."
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
            onClick={() => setView('cloud')}
            className={cn(
              'rounded-md px-3 py-1 transition-colors',
              view === 'cloud'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            )}
          >
            태그 클라우드
          </button>
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
        </div>
      </div>

      {/* 결과 없음 메시지 */}
      {tags.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800"
        >
          <p className="text-gray-600 dark:text-gray-300">
            &apos;{searchQuery}&apos;에 해당하는 태그가 없습니다.
          </p>
        </motion.div>
      )}

      {/* 태그 클라우드 뷰 */}
      {view === 'cloud' && tags.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex min-h-[200px] flex-wrap justify-center gap-4 rounded-lg bg-gray-50 p-6 dark:bg-gray-800"
        >
          {tags.map((tag, index) => {
            const tagColor = getTagColor(tag.count);
            return (
              <motion.div
                key={tag.name}
                custom={index}
                variants={itemVariants}
                whileHover={{ scale: 1.1 }}
                className="transition-all duration-200"
              >
                <Link
                  href={`/tags/${tag.name}`}
                  className="inline-flex items-center rounded-full px-3 py-1"
                  style={{
                    fontSize: getTagSize(tag.count),
                    color: `var(--tag-color, ${tagColor.light})`,
                    backgroundColor: `var(--tag-bg, rgba(59, 130, 246, 0.1))`,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.setProperty(
                      '--tag-color',
                      tagColor.dark
                    );
                    e.currentTarget.style.setProperty(
                      '--tag-bg',
                      'rgba(59, 130, 246, 0.2)'
                    );
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.setProperty(
                      '--tag-color',
                      tagColor.light
                    );
                    e.currentTarget.style.setProperty(
                      '--tag-bg',
                      'rgba(59, 130, 246, 0.1)'
                    );
                  }}
                >
                  <AiOutlineTag className="mr-1" />
                  {tag.name}
                  <span className="ml-1 text-xs opacity-70">({tag.count})</span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* 그리드 뷰 */}
      {view === 'grid' && tags.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {tags.map((tag, index) => (
            <motion.div
              key={tag.name}
              custom={index}
              variants={itemVariants}
              whileHover="hover"
              className={cn(
                'rounded-lg border p-4 shadow-sm transition-all duration-300',
                selectedTag === tag.name
                  ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30'
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
              )}
              onClick={() =>
                setSelectedTag(tag.name === selectedTag ? null : tag.name)
              }
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center text-blue-600 dark:text-blue-400">
                  <AiOutlineTag size={18} />
                  <h3 className="ml-2 font-medium">{tag.name}</h3>
                </div>

                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {tag.count}개의 포스트
                </span>
              </div>

              <Link
                href={`/tags/${tag.name}`}
                className="group mt-2 inline-flex items-center text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                포스트 보기
                <motion.span
                  initial={{ x: 0 }}
                  whileHover={{ x: 3 }}
                  className="ml-1 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                >
                  <BsArrowRight />
                </motion.span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
