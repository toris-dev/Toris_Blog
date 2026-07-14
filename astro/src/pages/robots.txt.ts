import type { APIRoute } from 'astro';

/** 주요 AI 크롤러 — 콘텐츠 인용/검색 노출을 위해 명시적으로 허용 */
const AI_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'PerplexityBot',
  'OAI-SearchBot'
] as const;

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL('/sitemap-index.xml', site).href;

  const lines = [
    'User-agent: *',
    'Allow: /',
    '',
    ...AI_CRAWLERS.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', '']),
    `Sitemap: ${sitemapUrl}`,
    ''
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
