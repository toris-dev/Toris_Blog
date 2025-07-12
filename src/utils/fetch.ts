import { Post } from '@/types';
import {
  getCategories as getMarkdownCategories,
  getPostBySlug,
  getPostData
} from './markdown';

export async function getPosts(options: {
  category?: string;
  tag?: string;
}): Promise<Post[]> {
  try {
    // 실제 마크다운 파일에서 데이터 가져오기
    let posts = getPostData();

    // 데이터가 없는 경우 목업 데이터 사용
    if (posts.length === 0) {
      posts = getMockPosts();
    }

    // 옵션에 따라 필터링
    if (options.category) {
      posts = posts.filter(
        (post) =>
          post.category.toLowerCase() === options.category?.toLowerCase()
      );
    }

    if (options.tag) {
      posts = posts.filter((post) =>
        Array.isArray(post.tags)
          ? post.tags.some(
              (tag) => tag.toLowerCase() === options.tag?.toLowerCase()
            )
          : post.tags.toLowerCase() === options.tag?.toLowerCase()
      );
    }

    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return getMockPosts();
  }
}

export async function getPost(slug: string): Promise<Post | null> {
  try {
    const post = getPostBySlug(slug);
    if (post) {
      return post;
    }

    // 목업 데이터에서 찾기
    const mockPosts = getMockPosts();
    return mockPosts.find((post) => post.slug === slug) || null;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

export async function getCategories(): Promise<string[]> {
  try {
    const categories = getMarkdownCategories();
    return categories.length > 0
      ? categories
      : ['Next.js', 'React', 'TypeScript'];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return ['Next.js', 'React', 'TypeScript'];
  }
}

export async function getTags(): Promise<string[]> {
  try {
    const posts = await getPosts({});
    const tags = posts.flatMap((post) =>
      Array.isArray(post.tags) ? post.tags : [post.tags]
    );
    return [...new Set(tags)];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return ['Next.js', 'React', 'TypeScript', 'JavaScript'];
  }
}

// 목업 데이터 (실제 마크다운 파일이 없을 때 사용)
function getMockPosts(): Post[] {
  return [
    {
      id: 1,
      title: 'Next.js 14의 새로운 기능들',
      content: 'Next.js 14에서 새롭게 추가된 기능들을 살펴보겠습니다.',
      description: 'Next.js 14의 새로운 기능들을 자세히 알아보세요.',
      category: 'Next.js',
      tags: ['Next.js', 'React', 'TypeScript'],
      date: '2023-01-01T12:00:00.000Z',
      slug: 'nextjs-14-new-features',
      filePath: '/posts/nextjs-14-new-features.md'
    },
    {
      id: 2,
      title: 'React 18의 Concurrent Features',
      content: 'React 18에서 소개된 Concurrent Features에 대해 알아보겠습니다.',
      description: 'React 18의 동시성 기능들을 실제 예제와 함께 살펴보세요.',
      category: 'React',
      tags: ['React', 'JavaScript', 'Frontend'],
      date: '2022-12-01T12:00:00.000Z',
      slug: 'react-18-concurrent-features',
      filePath: '/posts/react-18-concurrent-features.md'
    },
    {
      id: 3,
      title: 'TypeScript 5.0 새로운 기능',
      content: 'TypeScript 5.0에서 새롭게 추가된 기능들을 살펴보겠습니다.',
      description: 'TypeScript 5.0의 새로운 기능들과 개선사항들을 알아보세요.',
      category: 'TypeScript',
      tags: ['TypeScript', 'JavaScript', 'Programming'],
      date: '2022-11-01T12:00:00.000Z',
      slug: 'typescript-5-new-features',
      filePath: '/posts/typescript-5-new-features.md'
    }
  ];
}
