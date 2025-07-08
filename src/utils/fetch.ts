import { CategoryWithCount, MarkdownFile, TagWithCount } from '@/types';

// Only import fs and path in server context
const fs = typeof window === 'undefined' ? require('fs/promises') : null;
const path = typeof window === 'undefined' ? require('path') : null;

// Client-side markdown file fetching (for browser)
export async function getMarkdownFiles(): Promise<MarkdownFile[]> {
  try {
    const response = await fetch('/api/markdown', {
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });

    if (!response.ok) {
      throw new Error('Failed to fetch markdown files');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching markdown files:', error);
    return [];
  }
}

// Client-side markdown file fetching by slug (for browser)
export async function getMarkdownFile(
  slug: string
): Promise<MarkdownFile | null> {
  try {
    const files = await getMarkdownFiles();
    const file = files.find((file) => file.slug === slug);
    return file || null;
  } catch (error) {
    console.error('Error fetching markdown file:', error);
    return null;
  }
}

// 마크다운 콘텐츠를 파싱하는 헬퍼 함수
function parseMarkdownContent(text: string, slug: string): MarkdownFile {
  // Extract metadata from frontmatter
  const metadataMatch = text.match(/^---\n([\s\S]*?)\n---\n/);
  let metadata: Record<string, string> = {};
  let content = text;

  if (metadataMatch) {
    const metadataContent = metadataMatch[1];
    const lines = metadataContent.split('\n');

    for (const line of lines) {
      const [key, value] = line.split(': ');
      if (key && value) {
        metadata[key.trim()] = value.trim();
      }
    }

    // Remove metadata from content
    content = text.replace(/^---\n[\s\S]*?\n---\n/, '');
  }

  return {
    id: parseInt(metadata.id || '0'),
    title: metadata.title || 'Untitled',
    date: metadata.date || new Date().toISOString(),
    slug: metadata.slug || slug,
    content,
    filePath: `/markdown/${slug}.md`,
    tags: metadata.tags
      ? metadata.tags.split(',').map((tag) => tag.trim())
      : [],
    category: metadata.category || 'Uncategorized'
  };
}

// Get all tags from markdown files
export async function getTags(): Promise<string[]> {
  // Check if running in browser
  if (typeof window !== 'undefined') {
    // Client-side implementation
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
  } else {
    // Server-side implementation
    try {
      const files = await getMarkdownFiles();
      const allTags = files.flatMap((file) => file.tags || []);
      // Return unique tags without using Set
      const uniqueTags: string[] = [];
      allTags.forEach((tag) => {
        if (!uniqueTags.includes(tag)) {
          uniqueTags.push(tag);
        }
      });
      return uniqueTags;
    } catch (error) {
      console.error('Error getting tags:', error);
      return [];
    }
  }
}

// Get all categories from markdown files
export async function getCategories(): Promise<string[]> {
  // 브라우저에서 실행 중인지 확인
  if (typeof window !== 'undefined') {
    // 클라이언트 측에서 실행 중일 때
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  } else {
    // 서버 측에서 실행 중일 때
    try {
      const files = await getMarkdownFiles();
      const allCategories = files.map(
        (file) => file.category || 'Uncategorized'
      );
      // Return unique categories using Array.filter for compatibility
      const uniqueCategories: string[] = [];
      allCategories.forEach((category) => {
        if (!uniqueCategories.includes(category)) {
          uniqueCategories.push(category);
        }
      });
      return uniqueCategories;
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }
}

// Get markdown files by tag or category
export async function getPosts({
  category,
  tag,
  page = 0
}: {
  category?: string;
  tag?: string;
  page?: number;
}): Promise<MarkdownFile[]> {
  try {
    const files = await getMarkdownFiles();

    let filteredFiles = files;

    if (category) {
      filteredFiles = filteredFiles.filter(
        (file) => file.category === category
      );
    }

    if (tag) {
      filteredFiles = filteredFiles.filter((file) => file.tags?.includes(tag));
    }

    // Sort by date descending
    filteredFiles.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Paginate if needed (5 posts per page)
    const start = page * 5;
    const end = start + 5;
    return filteredFiles.slice(start, end);
  } catch (error) {
    console.error('Error getting posts:', error);
    return [];
  }
}

// Get all posts for sitemap and feed (without pagination)
export async function getAllPosts(): Promise<MarkdownFile[]> {
  try {
    const files = await getMarkdownFiles();

    // Sort by date descending
    files.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return files;
  } catch (error) {
    console.error('Error getting all posts:', error);
    return [];
  }
}

// Get all post IDs (slugs) for sitemap and static paths
export async function getPostId(): Promise<
  { id: string; created_at: string }[]
> {
  try {
    const files = await getMarkdownFiles();
    return files.map((file) => ({
      id: file.slug,
      created_at: file.date
    }));
  } catch (error) {
    console.error('Error getting post IDs:', error);
    return [];
  }
}

// 카테고리 관련 함수 추가
// 모든 카테고리와 포스트 수 가져오기
export async function getAllCategories(): Promise<CategoryWithCount[]> {
  try {
    // 여기서는 모든 포스트를 가져와서 카테고리를 집계하는 방식을 사용합니다
    const posts = await getPosts({ page: 0 });

    // 카테고리별 포스트 수 집계
    const categoryCounts: Record<string, number> = {};

    posts.forEach((post) => {
      if (post.category) {
        categoryCounts[post.category] =
          (categoryCounts[post.category] || 0) + 1;
      }
    });

    // 카테고리 배열로 변환
    const categories: CategoryWithCount[] = Object.entries(categoryCounts).map(
      ([name, count]) => ({
        name,
        count
      })
    );

    // 카테고리 이름 기준으로 정렬
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('카테고리 가져오기 오류:', error);
    return [];
  }
}

// 특정 카테고리와 해당 카테고리의 포스트 가져오기
export async function getCategoryWithPosts(categoryName: string) {
  try {
    const posts = await getPosts({ page: 0 });
    const categoryPosts = posts.filter(
      (post) => post.category === categoryName
    );

    return {
      name: categoryName,
      count: categoryPosts.length,
      posts: categoryPosts
    };
  } catch (error) {
    console.error(`${categoryName} 카테고리 가져오기 오류:`, error);
    return { name: categoryName, count: 0, posts: [] };
  }
}

// 태그 관련 함수 추가
// 모든 태그와 포스트 수 가져오기
export async function getTagsWithCount(): Promise<TagWithCount[]> {
  try {
    // 모든 포스트를 가져와서 태그 집계
    const posts = await getPosts({ page: 0 });

    // 태그별 포스트 수 집계
    const tagCounts: Record<string, number> = {};

    posts.forEach((post) => {
      if (post.tags && post.tags.length > 0) {
        post.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // 태그 배열로 변환
    const tags: TagWithCount[] = Object.entries(tagCounts).map(
      ([name, count]) => ({
        name,
        count
      })
    );

    // 태그 이름 기준으로 정렬
    return tags.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('태그 가져오기 오류:', error);
    return [];
  }
}

// 특정 태그와 해당 태그의 포스트 가져오기
export async function getTagWithPosts(tagName: string) {
  try {
    const posts = await getPosts({ page: 0 });
    const tagPosts = posts.filter((post) => post.tags?.includes(tagName));

    return {
      name: tagName,
      count: tagPosts.length,
      posts: tagPosts
    };
  } catch (error) {
    console.error(`${tagName} 태그 가져오기 오류:`, error);
    return { name: tagName, count: 0, posts: [] };
  }
}
