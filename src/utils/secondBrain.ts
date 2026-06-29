import fs from 'fs';
import path from 'path';

const secondBrainDirectory = path.join(
  process.cwd(),
  'content',
  'second-brain'
);
const MAX_CHUNK_LENGTH = 1600;
const CHUNK_OVERLAP_LENGTH = 220;

export interface SecondBrainDocument {
  id: string;
  title: string;
  category: string;
  path: string;
  content: string;
}

export interface SecondBrainChunk {
  id: string;
  documentId: string;
  title: string;
  category: string;
  path: string;
  heading?: string;
  content: string;
}

export interface SecondBrainSearchResult extends SecondBrainChunk {
  score: number;
}

let cachedChunks: SecondBrainChunk[] | null = null;

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function stripOrderingPrefix(value: string): string {
  return value.replace(/^\d{2}-/, '');
}

function humanizeTitle(value: string): string {
  return stripOrderingPrefix(value)
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFrontmatter(content: string): {
  title?: string;
  content: string;
} {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);

  if (!match) {
    return { content };
  }

  const titleLine = match[1]
    .split('\n')
    .find((line) => line.trim().startsWith('title:'));
  const title = titleLine
    ?.slice(titleLine.indexOf(':') + 1)
    .trim()
    .replace(/^['"]|['"]$/g, '');

  return { title, content: match[2] };
}

function extractTitle(
  filePath: string,
  content: string,
  frontmatterTitle?: string
) {
  if (frontmatterTitle) {
    return frontmatterTitle;
  }

  const heading = content.match(/^#\s+(.+)$/m);
  if (heading?.[1]) {
    return heading[1].trim();
  }

  return humanizeTitle(path.basename(filePath, '.md'));
}

function getCategory(relativePath: string): string {
  const parts = relativePath.split('/');
  const [firstPart] = parts;

  if (!firstPart || parts.length === 1) {
    return 'second brain';
  }

  return humanizeTitle(firstPart);
}

function getMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getMarkdownFiles(entryPath));
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.endsWith('.md') &&
      entry.name !== 'AGENTS.md'
    ) {
      files.push(entryPath);
    }
  }

  return files;
}

function readDocuments(): SecondBrainDocument[] {
  return getMarkdownFiles(secondBrainDirectory).map((filePath) => {
    const rawContent = fs.readFileSync(filePath, 'utf8');
    const { title: frontmatterTitle, content } = parseFrontmatter(rawContent);
    const relativePath = normalizePath(
      path.relative(secondBrainDirectory, filePath)
    );

    return {
      id: relativePath,
      title: extractTitle(filePath, content, frontmatterTitle),
      category: getCategory(relativePath),
      path: relativePath,
      content: content.trim()
    };
  });
}

function splitLongText(text: string): string[] {
  if (text.length <= MAX_CHUNK_LENGTH) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + MAX_CHUNK_LENGTH, text.length);
    const slice = text.slice(start, end);
    const lastBreak = slice.lastIndexOf('\n\n');
    const cutAt =
      end < text.length && lastBreak > MAX_CHUNK_LENGTH * 0.55
        ? start + lastBreak
        : end;

    chunks.push(text.slice(start, cutAt).trim());
    start = Math.max(cutAt - CHUNK_OVERLAP_LENGTH, cutAt);
  }

  return chunks.filter(Boolean);
}

function chunkDocument(document: SecondBrainDocument): SecondBrainChunk[] {
  const sections = document.content.split(/(?=^#{1,3}\s+)/gm);
  const chunks: SecondBrainChunk[] = [];

  sections.forEach((section, sectionIndex) => {
    const trimmedSection = section.trim();

    if (!trimmedSection) {
      return;
    }

    const heading = trimmedSection.match(/^#{1,3}\s+(.+)$/m)?.[1]?.trim();
    const textChunks = splitLongText(trimmedSection);

    textChunks.forEach((content, chunkIndex) => {
      chunks.push({
        id: `${document.id}#${sectionIndex}-${chunkIndex}`,
        documentId: document.id,
        title: document.title,
        category: document.category,
        path: document.path,
        heading,
        content
      });
    });
  });

  return chunks;
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .normalize('NFKC')
    .split(/[^a-z0-9가-힣]+/g)
    .filter((token) => token.length >= 2);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsToken(value: string, token: string): boolean {
  if (/^[a-z0-9]+$/.test(token)) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegex(token)}([^a-z0-9]|$)`).test(
      value
    );
  }

  return value.includes(token);
}

function countTokenOccurrences(value: string, token: string): number {
  if (/^[a-z0-9]+$/.test(token)) {
    const matches = value.match(
      new RegExp(`(^|[^a-z0-9])${escapeRegex(token)}(?=[^a-z0-9]|$)`, 'g')
    );
    return matches?.length ?? 0;
  }

  return value.split(token).length - 1;
}

function containsQuery(value: string, query: string): boolean {
  if (/^[a-z0-9]+$/.test(query)) {
    return containsToken(value, query);
  }

  return value.includes(query);
}

function scoreChunk(chunk: SecondBrainChunk, query: string): number {
  const normalizedQuery = query.toLowerCase().normalize('NFKC').trim();
  const tokens = tokenize(normalizedQuery);

  if (tokens.length === 0) {
    return 0;
  }

  const title = chunk.title.toLowerCase().normalize('NFKC');
  const heading = chunk.heading?.toLowerCase().normalize('NFKC') ?? '';
  const category = chunk.category.toLowerCase().normalize('NFKC');
  const content = chunk.content.toLowerCase().normalize('NFKC');
  const haystack = `${title} ${heading} ${category} ${content}`;

  let score = 0;

  if (containsQuery(title, normalizedQuery)) score += 18;
  if (containsQuery(heading, normalizedQuery)) score += 12;
  if (containsQuery(content, normalizedQuery)) score += 8;

  for (const token of tokens) {
    if (containsToken(title, token)) score += 8;
    if (containsToken(heading, token)) score += 5;
    if (containsToken(category, token)) score += 3;

    const occurrences = countTokenOccurrences(haystack, token);
    score += Math.min(occurrences, 8);
  }

  return score;
}

export function getSecondBrainChunks(): SecondBrainChunk[] {
  if (cachedChunks) {
    return cachedChunks;
  }

  cachedChunks = readDocuments().flatMap(chunkDocument);
  return cachedChunks;
}

export function searchSecondBrain(
  query: string,
  limit = 8
): SecondBrainSearchResult[] {
  const safeLimit = Math.min(Math.max(limit, 1), 20);

  return getSecondBrainChunks()
    .map((chunk) => ({ ...chunk, score: scoreChunk(chunk, query) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit);
}

export function getSecondBrainStats() {
  const documents = readDocuments();
  const chunks = getSecondBrainChunks();
  const categories = [
    ...new Set(documents.map((document) => document.category))
  ];

  return {
    documents: documents.length,
    chunks: chunks.length,
    categories: categories.sort()
  };
}
