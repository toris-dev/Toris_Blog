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

    // 디버깅 로그
    console.log(`파일: ${fileName} -> 슬러그: ${slug}`);

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
      console.warn(`Posts directory not found: ${postsDirectory}`);
      return [];
    }

    const markdownFiles = getAllMarkdownFiles(postsDirectory);
    const posts = markdownFiles
      .map(parseMarkdownFile)
      .filter((post) => post !== null) as Post[];

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

    // 디버깅 로그
    console.log(`총 ${uniquePosts.length}개의 포스트를 찾았습니다.`);
    uniquePosts.forEach((post) => {
      console.log(`- ${post.title} (${post.slug})`);
    });

    // 날짜순 정렬
    return uniquePosts.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error('Error reading markdown files:', error);
    return [];
  }
}

export function getPostBySlug(slug: string): Post | null {
  console.log(`슬러그 검색: ${slug}`);
  const posts = getPostData();
  const post = posts.find((post) => post.slug === slug);

  if (!post) {
    console.log(`슬러그 '${slug}'에 해당하는 포스트를 찾을 수 없습니다.`);
    console.log('사용 가능한 슬러그들:');
    posts.forEach((p) => console.log(`- ${p.slug}`));
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
