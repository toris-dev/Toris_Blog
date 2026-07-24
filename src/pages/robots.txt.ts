import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/site';

// toris.kr은 공개 마케팅·포트폴리오 사이트로 로그인 전용 페이지가 없다.
// Cloudflare의 AI 봇 차단을 껐으므로 'User-agent: * Allow: /'만으로 AI 봇 포함 전부 허용된다.
export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL('/sitemap-index.xml', site).href;

  const lines = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${absoluteUrl('/sitemap.xml')}`,
    `Sitemap: ${sitemapUrl}`,
    ''
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
