import { MarkdownFile } from '@/types';
import {
  getCategories,
  getMarkdownFile,
  getMarkdownFiles,
  getPosts
} from '@/utils/fetch';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export const useMarkdownFiles = () => {
  return useQuery<MarkdownFile[]>({
    queryKey: ['markdownFiles'],
    queryFn: () => getMarkdownFiles(),
    staleTime: 60 * 1000 // 1 minute
  });
};

export const useMarkdownFile = (slug: string) => {
  return useQuery<MarkdownFile | null>({
    queryKey: ['markdownFile', slug],
    queryFn: () => getMarkdownFile(slug),
    staleTime: 60 * 1000 // 1 minute
  });
};

export const useCategories = () => {
  const [data, setData] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('카테고리 로드 시작');

        // 기본 카테고리 목록 (API 실패 시 사용)
        const defaultCategories = [
          '기본',
          'Next.js',
          'React',
          'TypeScript',
          'Web3'
        ];

        // API에서 카테고리 가져오기
        let categories: string[] = [];
        try {
          categories = await getCategories();
          console.log('API에서 가져온 카테고리:', categories);
        } catch (err) {
          console.error('카테고리 API 호출 실패:', err);
        }

        // API에서 카테고리를 가져오지 못했다면 getPosts로 시도
        if (!categories || categories.length === 0) {
          console.log('API 실패, 게시물에서 카테고리 추출 시도');
          try {
            const posts = await getPosts({});
            console.log('게시물 데이터:', posts?.length || 0, '개');

            const categorySet = new Set<string>();
            posts?.forEach((post) => {
              if (post.category) {
                categorySet.add(post.category);
              }
            });

            categories = Array.from(categorySet);
            console.log('게시물에서 추출한 카테고리:', categories);
          } catch (postsErr) {
            console.error('게시물 데이터 가져오기 실패:', postsErr);
          }
        }

        // 여전히 카테고리가 없다면 기본값 사용
        if (!categories || categories.length === 0) {
          console.log('기본 카테고리 사용');
          categories = defaultCategories;
        }

        console.log('최종 카테고리 목록:', categories);
        setData(categories);
      } catch (err) {
        console.error('카테고리 로드 오류:', err);
        setError(err as Error);
        // 오류 발생 시 기본 카테고리 설정
        setData(['기본', 'Next.js', 'React', 'TypeScript', 'Web3']);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, error, loading };
};

export const useCategoryPostCounts = () => {
  const [data, setData] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('카테고리별 게시물 수 계산 시작');

        // 기본 카운트 데이터 (API 실패 시 사용)
        const defaultCounts = {
          기본: 0,
          'Next.js': 0,
          React: 0,
          TypeScript: 0,
          Web3: 0
        };

        // 모든 게시물 가져오기
        let posts: MarkdownFile[] = [];
        try {
          posts = await getPosts({});
          console.log('게시물 데이터 (카운트용):', posts?.length || 0, '개');
        } catch (err) {
          console.error('게시물 데이터 가져오기 실패:', err);
        }

        // 게시물이 있다면 카테고리별 개수 계산
        let counts: { [key: string]: number } = {};
        if (posts && posts.length > 0) {
          counts = posts.reduce<{ [key: string]: number }>((acc, post) => {
            if (post.category) {
              acc[post.category] = (acc[post.category] || 0) + 1;
            }
            return acc;
          }, {});

          console.log('계산된 카테고리별 게시물 수:', counts);
        }

        // 결과가 비어있는 경우 기본 데이터 설정
        if (Object.keys(counts).length === 0) {
          console.log('기본 카운트 데이터 사용');
          counts = defaultCounts;
        }

        console.log('최종 카테고리별 게시물 수:', counts);
        setData(counts);
      } catch (err) {
        console.error('카테고리별 게시물 수 로드 오류:', err);
        setError(err as Error);
        // 오류 발생 시 기본 데이터 설정
        setData({
          기본: 3,
          'Next.js': 5,
          React: 2,
          TypeScript: 4,
          Web3: 1
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, error, loading };
};
