import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { absoluteUrl } from '../lib/site';
import { toISO } from '../lib/slug';

/**
 * /sitemap.xml — 전체 URL을 담은 단일 사이트맵.
 * (@astrojs/sitemap의 sitemap-index.xml/sitemap-0.xml은 호환용으로 병행 유지)
 * 글은 frontmatter 날짜를 lastmod로, 정적 페이지는 빌드 시각을 lastmod로 쓴다.
 */
const STATIC_PAGES: { path: string; changefreq: string; priority: string }[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/en', changefreq: 'monthly', priority: '0.7' },
  { path: '/projects', changefreq: 'weekly', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/process', changefreq: 'monthly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.8' },
  { path: '/blog', changefreq: 'weekly', priority: '0.9' },
  { path: '/posts', changefreq: 'weekly', priority: '0.6' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' }
];

export const GET: APIRoute = async () => {
  const buildDate = new Date().toISOString().slice(0, 10);
  const entries = await getCollection('posts');

  const urls: string[] = [];
  const add = (loc: string, lastmod: string, changefreq: string, priority: string) =>
    urls.push(
      `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    );

  for (const p of STATIC_PAGES) add(absoluteUrl(p.path), buildDate, p.changefreq, p.priority);

  const posts = entries
    .map((post) => ({ slug: post.id, date: toISO(post.data.date)?.slice(0, 10) || buildDate }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  for (const post of posts)
    add(absoluteUrl(`/posts/${encodeURIComponent(post.slug)}`), post.date, 'monthly', '0.7');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
