import { useQuery } from '@tanstack/react-query';
import { getCategories, getComments, getTags } from './fetch';
export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });

export const useTags = () =>
  useQuery({
    queryKey: ['tags'],
    queryFn: getTags
  });

export const useComments = (postId: number) =>
  useQuery({
    queryKey: ['comments', postId],
    queryFn: () => getComments(postId)
  });
