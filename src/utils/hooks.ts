import { MarkdownFile } from '@/types';
import {
  getCategories,
  getMarkdownFile,
  getMarkdownFiles
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

export function useCategories() {
  const [data, setData] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const categories = await getCategories();
        setData(categories);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { data, error, loading };
}
