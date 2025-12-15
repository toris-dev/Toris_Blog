import { Post } from '@/types';
import fs from 'fs';
import path from 'path';

const postsDirectory = path.join(process.cwd(), 'public', 'markdown');

// 간단한 frontmatter 파싱 함수
function parseFrontmatter(content: string): { data: any; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content };
  }

  const frontmatter = match[1];
  const mainContent = match[2];

  // 간단한 YAML 파싱 (기본적인 key: value 형태만 지원)
  const data: any = {};
  const lines = frontmatter.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      // 배열 형태 처리 (tags: [tag1, tag2])
      if (value.startsWith('[') && value.endsWith(']')) {
        const arrayContent = value.slice(1, -1);
        data[key] = arrayContent
          .split(',')
          .map((item) => item.trim().replace(/['"]/g, ''));
      } else {
        data[key] = value.replace(/['"]/g, '');
      }
    }
  }

  return { data, content: mainContent };
}

// 개선된 슬러그 생성 함수
function createSlug(fileName: string): string {
  const slug = fileName
    // 이모지 제거 (단순한 패턴)
    .replace(
      /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
      ''
    )
    // 특수 문자를 하이픈으로 변경 (한글, 영문, 숫자, 공백, 하이픈만 유지)
    .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ-]/g, '-')
    // 다중 공백을 하이픈으로
    .replace(/\s+/g, '-')
    // 다중 하이픈을 단일 하이픈으로
    .replace(/-+/g, '-')
    // 앞뒤 하이픈 제거
    .replace(/^-+|-+$/g, '')
    .trim();

  // 빈 문자열인 경우 파일명에서 한글만 추출
  if (!slug) {
    const koreanOnly = fileName.replace(/[^\u{AC00}-\u{D7AF}]/gu, '');
    return koreanOnly || 'untitled-post';
  }

  return slug;
}

// 안전한 해시 ID 생성 함수
function createHashId(filePath: string): number {
  let hash = 0;
  const str = filePath.replace(/\\/g, '/'); // 경로 구분자 통일
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32비트 정수로 변환
  }
  return Math.abs(hash);
}

// 모든 카테고리 폴더를 순회하여 마크다운 파일들을 가져옴
function getAllMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        // 하위 디렉토리 재귀 탐색
        files.push(...getAllMarkdownFiles(itemPath));
      } else if (item.endsWith('.md')) {
        files.push(itemPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }

  return files;
}

// 파일 경로에서 카테고리 추출
function getCategoryFromPath(filePath: string): string {
  const relativePath = path.relative(postsDirectory, filePath);
  const parts = relativePath.split(path.sep);
  return parts[0] || 'Uncategorized';
}

// 마크다운 파일을 Post 타입으로 변환
function parseMarkdownFile(filePath: string): Post | null {
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = parseFrontmatter(fileContents);

    const fileName = path.basename(filePath, '.md');
    const slug = createSlug(fileName);
    const category = getCategoryFromPath(filePath);

    // 파일 경로 기반 해시 ID 생성
    const id = createHashId(filePath);

    return {
      id,
      title: data.title || fileName,
      content,
      description:
        data.description ||
        content.substring(0, 150).replace(/\n/g, ' ') + '...',
      category,
      tags: data.tags || [category],
      date: data.date || '1970-01-01T00:00:00.000Z',
      slug,
      filePath: path.relative(process.cwd(), filePath)
    };
  } catch (error) {
    console.error(`Error parsing markdown file ${filePath}:`, error);
    return null;
  }
}

export function getPostData(): Post[] {
  try {
    if (!fs.existsSync(postsDirectory)) {
      console.error(`Posts directory not found: ${postsDirectory}`);
      console.error(`Current working directory: ${process.cwd()}`);
      return [];
    }

    const markdownFiles = getAllMarkdownFiles(postsDirectory);

    if (markdownFiles.length === 0) {
      console.warn(`No markdown files found in ${postsDirectory}`);
      return [];
    }

    const posts = markdownFiles
      .map(parseMarkdownFile)
      .filter((post) => post !== null) as Post[];

    if (posts.length === 0) {
      console.warn(
        `No valid posts parsed from ${markdownFiles.length} markdown files`
      );
      return [];
    }

    // ID 중복 체크 및 제거
    const seenIds = new Set<number>();
    const uniquePosts = posts.filter((post) => {
      if (seenIds.has(post.id)) {
        console.warn(`중복 ID 발견: ${post.id}, 파일: ${post.filePath}`);
        return false;
      }
      seenIds.add(post.id);
      return true;
    });

    // 날짜순 정렬
    const sortedPosts = uniquePosts.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return sortedPosts;
  } catch (error) {
    console.error('Error reading markdown files:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return [];
  }
}

export function getPostBySlug(slug: string): Post | null {
  const posts = getPostData();

  // 정확한 매칭 시도
  let post = posts.find((post) => post.slug === slug);

  // 인코딩/디코딩된 버전으로도 시도
  if (!post) {
    try {
      const decodedSlug = decodeURIComponent(slug);
      post = posts.find((post) => post.slug === decodedSlug);
    } catch {
      // 디코딩 실패 시 무시
    }
  }

  // 인코딩된 버전으로도 시도
  if (!post) {
    try {
      const encodedSlug = encodeURIComponent(slug);
      post = posts.find((post) => {
        const encodedPostSlug = encodeURIComponent(post.slug);
        return encodedPostSlug === encodedSlug || encodedPostSlug === slug;
      });
    } catch {
      // 인코딩 실패 시 무시
    }
  }

  return post || null;
}

export function getCategories(): string[] {
  const posts = getPostData();
  const categories = [...new Set(posts.map((post) => post.category))];
  return categories.sort();
}

export function getPostsByCategory(category: string): Post[] {
  const posts = getPostData();
  return posts.filter((post) => post.category === category);
}

export function getTags(): string[] {
  const posts = getPostData();
  const allTags = new Set<string>();

  posts.forEach((post) => {
    if (Array.isArray(post.tags)) {
      post.tags.forEach((tag) => allTags.add(tag));
    } else if (typeof post.tags === 'string') {
      // 쉼표로 구분된 태그 문자열 처리
      post.tags.split(',').forEach((tag) => {
        const trimmedTag = tag.trim();
        if (trimmedTag) allTags.add(trimmedTag);
      });
    }
  });

  return Array.from(allTags).sort();
}

export function getPostsByTag(tag: string): Post[] {
  const posts = getPostData();
  return posts.filter((post) => {
    if (Array.isArray(post.tags)) {
      return post.tags.some((t) => t === tag);
    } else if (typeof post.tags === 'string') {
      return post.tags.split(',').some((t) => t.trim() === tag);
    }
    return false;
  });
}
