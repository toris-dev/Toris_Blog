import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { COMPANY, SITE_URL } from '../lib/site';
import { fileBaseName, toISO } from '../lib/slug';

/** /llms-full.txt — 전체 포스트 본문 단일 평문(AI 인용·RAG용) */
export const GET: APIRoute = async () => {
  const entries = await getCollection('posts');
  const posts = entries
    .map((p) => ({
      slug: p.id,
      title: p.data.title || fileBaseName(p.filePath) || p.id,
      date: toISO(p.data.date) || '',
      body: (p.body || '').trim()
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const header = [
    `# ${COMPANY.nameKo} (${COMPANY.nameEn}) — Full Content`,
    '',
    `> ${COMPANY.description}`,
    '',
    `- Site: ${SITE_URL} · Contact: ${COMPANY.email} · Posts: ${posts.length}`,
    '- License: CC BY 4.0 — cite title, author (토리스/Toris Inc.), URL, and date.',
    ''
  ].join('\n');

  const body = posts
    .map((p) =>
      [
        '',
        '---',
        '',
        `# ${p.title}`,
        `- URL: ${SITE_URL}/posts/${encodeURIComponent(p.slug)}`,
        p.date ? `- Date: ${p.date}` : '',
        '',
        p.body,
        ''
      ]
        .filter((l) => l !== '')
        .join('\n')
    )
    .join('\n');

  return new Response(header + body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
