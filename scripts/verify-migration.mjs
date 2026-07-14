#!/usr/bin/env node
/**
 * verify-migration.mjs — Next.js → Astro 마이그레이션 검증 스크립트
 *
 * 마이그레이션 '전'(public/markdown/**\/*.md)과 '후'(astro/dist/) 산출물을 비교해
 * URL(slug), 메타데이터, 게시글 수가 보존되었는지 검증한다.
 *
 * 실행: node scripts/verify-migration.mjs  (repo root 또는 astro/ 어디서든 가능)
 * 요구: Node >= 20, 외부 의존성 없음 (node:fs / node:path 만 사용)
 * 종료 코드: 0 = PASS, 1 = FAIL
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// 경로 해석 — 이 파일(scripts/verify-migration.mjs) 기준으로 repo root 고정
// ---------------------------------------------------------------------------
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
const MARKDOWN_DIR = path.join(REPO_ROOT, 'public', 'markdown');
const DIST_DIR = path.join(REPO_ROOT, 'astro', 'dist');
const DIST_POSTS_DIR = path.join(DIST_DIR, 'posts');

// ---------------------------------------------------------------------------
// src/utils/markdown.ts 의 createSlug() 인라인 포팅 (알고리즘 변경 금지)
// ---------------------------------------------------------------------------
function createSlug(fileName) {
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

  if (!slug) {
    const koreanOnly = fileName.replace(/[^\u{AC00}-\u{D7AF}]/gu, '');
    return koreanOnly || 'untitled-post';
  }

  return slug;
}

// ---------------------------------------------------------------------------
// src/utils/markdown.ts 의 toPlainExcerpt() 인라인 포팅
// ---------------------------------------------------------------------------
function toPlainExcerpt(markdown, maxLen = 155) {
  const text = (markdown || '')
    .replace(/^\s*#\s+.*(?:\r?\n|$)/, ' ') // 선두 H1 제거
    .replace(/```[\s\S]*?```/g, ' ') // 코드펜스
    .replace(/<[^>]+>/g, ' ') // HTML 태그 (<img> 등)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 마크다운 이미지
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 링크 → 텍스트
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '') // 줄머리 마커
    .replace(/[`*_~]/g, '') // 강조/인라인코드 기호
    .replace(/&[a-z]+;/gi, ' ') // HTML 엔티티
    .replace(/\s+/g, ' ') // 공백 정리
    .trim();
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen).trim() + '…';
}

// ---------------------------------------------------------------------------
// 1. SOURCE OF TRUTH — public/markdown/**/*.md 수집 및 expected 계산
// ---------------------------------------------------------------------------
function collectMarkdownFiles(dir) {
  const files = [];
  for (const item of fs.readdirSync(dir)) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      files.push(...collectMarkdownFiles(itemPath));
    } else if (item.endsWith('.md')) {
      files.push(itemPath);
    }
  }
  return files;
}

/** frontmatter에서 title/description/date 키만 간단히 파싱 */
function parseFrontmatter(raw) {
  const normalized = raw.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { data: {}, content: normalized };

  const data = {};
  for (const line of match[1].split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex <= 0) continue;
    const key = line.substring(0, colonIndex).trim();
    if (key !== 'title' && key !== 'description' && key !== 'date') continue;
    data[key] = line
      .substring(colonIndex + 1)
      .trim()
      .replace(/['"]/g, '');
  }
  const content = normalized.slice(match[0].length).replace(/^\s*\n/, '');
  return { data, content };
}

function buildExpected() {
  const files = collectMarkdownFiles(MARKDOWN_DIR);
  const expected = new Map(); // slug -> { title, description, file }
  const duplicates = [];

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, content } = parseFrontmatter(raw);
    const basename = path.basename(filePath, '.md');
    const slug = createSlug(basename);

    if (expected.has(slug)) {
      duplicates.push({ slug, file: path.relative(REPO_ROOT, filePath) });
      continue;
    }
    expected.set(slug, {
      title: data.title || basename,
      description: data.description || toPlainExcerpt(content),
      file: path.relative(REPO_ROOT, filePath)
    });
  }

  return { expected, duplicates, fileCount: files.length };
}

// ---------------------------------------------------------------------------
// 2. BUILT OUTPUT — astro/dist/posts/*/index.html 스캔 및 메타 추출
// ---------------------------------------------------------------------------
function decodeEntities(str) {
  return (str || '')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/gi, "'")
    .replace(/&amp;/g, '&');
}

/** <meta ... name|property="X" ... content="Y"> 에서 Y 추출 (속성 순서 무관) */
function extractMetaContent(html, attrName, attrValue) {
  const escaped = attrValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(
      `<meta[^>]*\\b${attrName}=["']${escaped}["'][^>]*\\bcontent=["']([^"']*)["']`,
      'i'
    ),
    new RegExp(
      `<meta[^>]*\\bcontent=["']([^"']*)["'][^>]*\\b${attrName}=["']${escaped}["']`,
      'i'
    )
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decodeEntities(m[1]);
  }
  return null;
}

function extractPageMeta(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const canonicalMatch =
    html.match(
      /<link[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']*)["']/i
    ) ||
    html.match(
      /<link[^>]*\bhref=["']([^"']*)["'][^>]*\brel=["']canonical["']/i
    );
  const jsonLdMatch = html.match(
    /<script[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
  );

  return {
    title: titleMatch ? decodeEntities(titleMatch[1].trim()) : null,
    description: extractMetaContent(html, 'name', 'description'),
    canonical: canonicalMatch ? decodeEntities(canonicalMatch[1]) : null,
    ogTitle: extractMetaContent(html, 'property', 'og:title'),
    ogDescription: extractMetaContent(html, 'property', 'og:description'),
    jsonLd: jsonLdMatch ? jsonLdMatch[1] : null
  };
}

function scanBuiltPosts() {
  const actual = new Map(); // slug -> pageMeta
  for (const entry of fs.readdirSync(DIST_POSTS_DIR, { withFileTypes: true })) {
    // build.format 양쪽 지원:
    //  - 'directory': dist/posts/<slug>/index.html
    //  - 'file'     : dist/posts/<slug>.html
    let slug = null;
    let htmlPath = null;
    if (entry.isDirectory()) {
      slug = entry.name;
      htmlPath = path.join(DIST_POSTS_DIR, entry.name, 'index.html');
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      slug = entry.name.replace(/\.html$/, '');
      htmlPath = path.join(DIST_POSTS_DIR, entry.name);
    }
    if (!slug || !htmlPath || !fs.existsSync(htmlPath)) continue;
    const html = fs.readFileSync(htmlPath, 'utf8');
    // 파일시스템 이름 = slug (한글은 유니코드 그대로). NFC 정규화로 대조.
    actual.set(slug.normalize('NFC'), extractPageMeta(html));
  }
  return actual;
}

// ---------------------------------------------------------------------------
// 3. COMPARE & REPORT
// ---------------------------------------------------------------------------
const failures = []; // 사유 목록

function check(ok, label, detail = '') {
  const mark = ok ? '✓' : '✗';
  console.log(`  ${mark} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(label);
  return ok;
}

function printSamples(items, max = 5) {
  for (const item of items.slice(0, max)) {
    console.log(`      · ${item}`);
  }
  if (items.length > max) {
    console.log(`      · … 외 ${items.length - max}건`);
  }
}

function compareCounts(expected, actual) {
  console.log('\n[게시글 수 비교]');
  const expectedSlugs = new Set(expected.keys());
  const actualSlugs = new Set(actual.keys());

  const missing = [...expectedSlugs].filter((s) => !actualSlugs.has(s));
  const extra = [...actualSlugs].filter((s) => !expectedSlugs.has(s));

  check(
    expected.size === actual.size,
    `게시글 수 일치 (원본 ${expected.size} vs 빌드 ${actual.size})`
  );

  console.log('\n[URL(slug) 집합 비교]');
  const setsEqual = missing.length === 0 && extra.length === 0;
  check(setsEqual, 'slug 집합 동등성');
  if (missing.length > 0) {
    console.log(`    누락된 slug (원본에는 있으나 빌드에 없음): ${missing.length}건`);
    printSamples(missing);
  }
  if (extra.length > 0) {
    console.log(`    초과된 slug (빌드에만 있음): ${extra.length}건`);
    printSamples(extra);
  }
}

function compareMetadata(expected, actual) {
  console.log('\n[메타데이터 검증]');
  const fails = {
    title: [],
    description: [],
    canonical: [],
    og: []
  };

  for (const [slug, exp] of expected) {
    const page = actual.get(slug);
    if (!page) continue; // 누락은 slug 비교에서 이미 보고됨

    // (a) <title>이 expected title을 포함하는지
    if (!page.title || !page.title.includes(exp.title)) {
      fails.title.push(`${slug}: <title>="${page.title ?? '(없음)'}" ⊉ "${exp.title}"`);
    }

    // (b) description 비어있지 않고 raw markdown 흔적 없음
    const desc = page.description;
    if (!desc || desc.trim() === '' || desc.includes('<img') || /^\s*#/.test(desc)) {
      fails.description.push(
        `${slug}: description="${desc ? desc.slice(0, 60) : '(없음)'}"`
      );
    }

    // (c) canonical pathname이 /posts/<slug>/ 형태인지 (호스트 무관)
    let canonicalOk = false;
    if (page.canonical) {
      try {
        const pathname = new URL(page.canonical, 'https://placeholder.invalid')
          .pathname;
        const decoded = decodeURIComponent(pathname)
          .normalize('NFC')
          .replace(/\/+$/, '');
        canonicalOk = decoded === `/posts/${slug}`;
      } catch {
        canonicalOk = false;
      }
    }
    if (!canonicalOk) {
      fails.canonical.push(`${slug}: canonical="${page.canonical ?? '(없음)'}"`);
    }

    // (d) og:title / og:description / JSON-LD BlogPosting 존재
    const hasOg = Boolean(page.ogTitle && page.ogDescription);
    const hasJsonLd = Boolean(page.jsonLd && page.jsonLd.includes('BlogPosting'));
    if (!hasOg || !hasJsonLd) {
      const missing = [
        !page.ogTitle && 'og:title',
        !page.ogDescription && 'og:description',
        !hasJsonLd && 'JSON-LD(BlogPosting)'
      ]
        .filter(Boolean)
        .join(', ');
      fails.og.push(`${slug}: ${missing} 누락`);
    }
  }

  const checks = [
    ['title 포함 여부', fails.title],
    ['description 유효성 (비어있지 않음 + 마크다운 흔적 없음)', fails.description],
    ['canonical URL 형식 (/posts/<slug>)', fails.canonical],
    ['og:title / og:description / JSON-LD BlogPosting', fails.og]
  ];

  for (const [label, list] of checks) {
    check(list.length === 0, label, list.length > 0 ? `실패 ${list.length}건` : undefined);
    if (list.length > 0) printSamples(list);
  }
}

function checkExtras(expectedCount) {
  console.log('\n[추가 산출물 검증]');

  check(
    fs.existsSync(path.join(DIST_DIR, 'blog', 'index.html')) ||
      fs.existsSync(path.join(DIST_DIR, 'blog.html')),
    '목록 페이지 존재 (astro/dist/blog[.html|/index.html])'
  );

  const sitemapIndexPath = path.join(DIST_DIR, 'sitemap-index.xml');
  const hasSitemapIndex = fs.existsSync(sitemapIndexPath);
  check(hasSitemapIndex, 'sitemap 존재 (astro/dist/sitemap-index.xml)');

  if (hasSitemapIndex) {
    // sitemap-*.xml 전체에서 /posts/ URL 수 집계
    let postUrlCount = 0;
    const sitemapFiles = fs
      .readdirSync(DIST_DIR)
      .filter((f) => /^sitemap-.*\.xml$/.test(f) && f !== 'sitemap-index.xml');
    for (const file of sitemapFiles) {
      const xml = fs.readFileSync(path.join(DIST_DIR, file), 'utf8');
      const locs = xml.match(/<loc>[^<]*<\/loc>/g) || [];
      postUrlCount += locs.filter((loc) => loc.includes('/posts/')).length;
    }
    check(
      postUrlCount >= expectedCount,
      `sitemap 내 /posts/ URL 수 >= 게시글 수 (${postUrlCount} >= ${expectedCount})`
    );
  }

  check(
    fs.existsSync(path.join(DIST_DIR, 'robots.txt')),
    'robots.txt 존재 (astro/dist/robots.txt)'
  );
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function main() {
  console.log('=== 마이그레이션 검증 (Next.js → Astro) ===');
  console.log(`repo root: ${REPO_ROOT}`);

  if (!fs.existsSync(MARKDOWN_DIR)) {
    console.error(`\n✗ 원본 마크다운 디렉토리가 없습니다: ${MARKDOWN_DIR}`);
    console.log('VERIFY: FAIL (사유 1건)');
    process.exit(1);
  }

  if (!fs.existsSync(DIST_POSTS_DIR)) {
    console.error(`\n✗ Astro 빌드 산출물이 없습니다: ${DIST_POSTS_DIR}`);
    console.error('  먼저 빌드를 실행하세요: cd astro && pnpm build');
    console.log('VERIFY: FAIL (사유 1건)');
    process.exit(1);
  }

  // 1. 마이그레이션 '전' — 원본 마크다운
  const { expected, duplicates, fileCount } = buildExpected();
  console.log(`\n[원본] 마크다운 파일 ${fileCount}개 → 게시글 ${expected.size}개`);
  if (duplicates.length > 0) {
    console.warn(`  ⚠ 중복 slug ${duplicates.length}건 (뒤에 오는 파일은 무시됨):`);
    printSamples(duplicates.map((d) => `${d.slug} (${d.file})`));
  }

  // 2. 마이그레이션 '후' — Astro 빌드 산출물
  const actual = scanBuiltPosts();
  console.log(`[빌드] astro/dist/posts/ 하위 게시글 페이지 ${actual.size}개`);

  // 3. 비교
  compareCounts(expected, actual);
  compareMetadata(expected, actual);
  checkExtras(expected.size);

  // 4. 최종 판정
  console.log('');
  if (failures.length === 0) {
    console.log('VERIFY: PASS');
    process.exit(0);
  } else {
    console.log(`VERIFY: FAIL (사유 ${failures.length}건)`);
    process.exit(1);
  }
}

main();
