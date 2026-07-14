import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { COMPANY, SITE_URL } from '../lib/site';
import { fileBaseName, toISO, toPlainExcerpt } from '../lib/slug';

/** /rss.xml — 네이버 서치어드바이저·Bing·AI 신선도 신호용 피드 */
export async function GET(context: APIContext) {
  const entries = await getCollection('posts');
  const items = entries
    .map((post) => ({
      title: post.data.title || fileBaseName(post.filePath) || post.id,
      description:
        post.data.description || toPlainExcerpt(post.body || '', 150) || '기술 노트',
      link: `/posts/${encodeURIComponent(post.id)}`,
      pubDate: toISO(post.data.date)
    }))
    .filter((i) => i.pubDate)
    .sort((a, b) => new Date(b.pubDate!).getTime() - new Date(a.pubDate!).getTime())
    .map((i) => ({ ...i, pubDate: new Date(i.pubDate!) }));

  return rss({
    title: '토리스 블로그',
    description: COMPANY.description,
    site: context.site ?? SITE_URL,
    items,
    customData: '<language>ko-KR</language>'
  });
}
