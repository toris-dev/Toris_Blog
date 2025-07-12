import { useQuery } from '@tanstack/react-query';
import { getCategories, getPost, getPosts } from './fetch';

// 포스트 목록을 가져오는 훅
export const usePosts = (options: { category?: string; tag?: string } = {}) => {
  return useQuery({
    queryKey: ['posts', options],
    queryFn: () => getPosts(options),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000 // 10분
  });
};

// 특정 포스트를 가져오는 훅
export const usePost = (slug: string) => {
  return useQuery({
    queryKey: ['post', slug],
    queryFn: () => getPost(slug),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    enabled: !!slug
  });
};

// 카테고리 목록을 가져오는 훅
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 30 * 60 * 1000 // 30분
  });
};

// 검색 기능을 위한 훅
export const useSearch = (query: string) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query.trim()) return [];

      const posts = await getPosts({});
      return posts.filter(
        (post) =>
          post.title.toLowerCase().includes(query.toLowerCase()) ||
          post.content.toLowerCase().includes(query.toLowerCase()) ||
          post.description?.toLowerCase().includes(query.toLowerCase())
      );
    },
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
    enabled: !!query.trim()
  });
};
