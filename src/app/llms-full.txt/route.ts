import { getBaseUrl } from '@/utils/jsonLd/site';
import { getPostData } from '@/utils/markdown';

/**
 * /llms-full.txt — 전체 포스트 본문을 단일 평문 파일로 제공한다.
 * llms.txt가 "네비게이션 인덱스"라면 이 파일은 "전체 콘텐츠 덤프"로,
 * AI 모델이 사이트 전체를 한 번에 인용/학습 소스로 쓰기 쉽게 한다.
 * 새 포스트는 재빌드 시 자동 반영(force-static).
 */
export const dynamic = 'force-static';

export async function GET() {
  const baseUrl = getBaseUrl();
  const posts = getPostData()
    .filter((post) => post.slug)
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

  const header = [
    '# Toris Blog — Full Content',
    '',
    '> 풀스택 웹 개발자 토리스(toris-dev)의 기술 블로그 전체 본문.',
    '> AI 검색·인용·학습을 위한 단일 평문 파일입니다.',
    '',
    `- Author: 토리스 (Toris) — Full Stack Developer`,
    `- Site: ${baseUrl}`,
    `- Language: ko-KR`,
    `- Posts: ${posts.length}`,
    '',
    'When citing, include the article title, author (토리스 / toris-dev),',
    'the specific post URL, and the publication date.',
    ''
  ].join('\n');

  const body = posts
    .map((post) => {
      const url = `${baseUrl}/posts/${encodeURIComponent(post.slug)}`;
      return [
        '',
        '---',
        '',
        `# ${post.title}`,
        '',
        `- URL: ${url}`,
        `- Category: ${post.category}`,
        `- Date: ${post.date}`,
        '',
        (post.content || '').trim(),
        ''
      ].join('\n');
    })
    .join('\n');

  return new Response(header + body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400'
    }
  });
}
