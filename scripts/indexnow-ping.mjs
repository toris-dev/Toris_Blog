#!/usr/bin/env node
/**
 * IndexNow 핑 — 배포 후 sitemap의 모든 URL을 Bing(IndexNow)에 통지한다.
 * 사용: node scripts/indexnow-ping.mjs
 * 키: astro/.indexnow(INDEXNOW_KEY=...) + astro/public/<key>.txt (둘 다 커밋됨)
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'toris.kr';
const SITEMAP = `https://${HOST}/sitemap.xml`;

const keyLine = readFileSync(join(root, 'astro', '.indexnow'), 'utf8');
const key = keyLine.match(/INDEXNOW_KEY=(\w+)/)?.[1];
if (!key) {
  console.error('INDEXNOW_KEY를 찾을 수 없습니다 (astro/.indexnow)');
  process.exit(1);
}

const xml = await (await fetch(SITEMAP)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urls.length === 0) {
  console.error('sitemap에서 URL을 찾지 못했습니다:', SITEMAP);
  process.exit(1);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key,
    keyLocation: `https://${HOST}/${key}.txt`,
    urlList: urls
  })
});

console.log(`IndexNow: ${urls.length}개 URL 제출 → HTTP ${res.status}`);
if (!res.ok) {
  console.error(await res.text());
  process.exit(1);
}
