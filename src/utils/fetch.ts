import { MarkdownFile } from '@/types';

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
    // Check if running on server or client
    if (typeof window !== 'undefined') {
      // Client-side (브라우저) 구현
      const response = await fetch(`/markdown/${slug}.md`, {
        next: { revalidate: 60 } // Revalidate every 60 seconds
      });

      if (!response.ok) {
        throw new Error('Failed to fetch markdown file');
      }

      const text = await response.text();
      return parseMarkdownContent(text, slug);
    } else {
      // Server-side 구현 - 파일 시스템에서 직접 읽기
      const markdownDir = path.join(process.cwd(), 'public', 'markdown');
      const filePath = path.join(markdownDir, `${slug}.md`);

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        return parseMarkdownContent(content, slug);
      } catch (fileError) {
        console.error(`File not found: ${filePath}`, fileError);
        return null;
      }
    }
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

// Server-side functions for direct file access
export async function getMarkdownFilesFromDisk(): Promise<MarkdownFile[]> {
  // Check if running on server
  if (typeof window !== 'undefined') {
    console.error(
      'getMarkdownFilesFromDisk should only be called on the server'
    );
    return [];
  }

  try {
    const markdownDir = path.join(process.cwd(), 'public', 'markdown');

    // Create the directory if it doesn't exist
    await fs.mkdir(markdownDir, { recursive: true });

    // Get all markdown files
    const files = await fs.readdir(markdownDir);
    const markdownFiles = files.filter((file: string) => file.endsWith('.md'));

    // Read the metadata from each file
    const markdownContents = await Promise.all(
      markdownFiles.map(async (file: string) => {
        const filePath = path.join(markdownDir, file);
        const content = await fs.readFile(filePath, 'utf-8');

        // Extract metadata
        const metadataMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
        const metadata: Record<string, string> = {};

        if (metadataMatch) {
          const metadataContent = metadataMatch[1];
          const lines = metadataContent.split('\n');

          for (const line of lines) {
            const [key, value] = line.split(': ');
            if (key && value) {
              metadata[key.trim()] = value.trim();
            }
          }
        }

        return {
          title: metadata.title || 'Untitled',
          date: metadata.date || new Date().toISOString(),
          slug: file.replace('.md', ''),
          content: content.replace(/^---\n[\s\S]*?\n---\n/, ''),
          filePath: `/markdown/${file}`,
          tags: metadata.tags
            ? metadata.tags.split(',').map((tag) => tag.trim())
            : [],
          category: metadata.category || 'Uncategorized'
        };
      })
    );

    return markdownContents;
  } catch (error) {
    console.error('Error listing markdown files:', error);
    return [];
  }
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
      const files = await getMarkdownFilesFromDisk();
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
      const files = await getMarkdownFilesFromDisk();
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
    const files = await getMarkdownFilesFromDisk();

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
    const files = await getMarkdownFilesFromDisk();

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
    const files = await getMarkdownFilesFromDisk();
    return files.map((file) => ({
      id: file.slug,
      created_at: file.date
    }));
  } catch (error) {
    console.error('Error getting post IDs:', error);
    return [];
  }
}
