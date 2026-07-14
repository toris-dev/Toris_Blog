// @ts-check
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

/**
 * 배포 도메인. 커스텀 도메인 확정 전까지 기존 canonical 호스트를 유지해
 * 게시글 canonical/OG URL 패리티를 보존한다. (요구사항: 메타데이터 보존)
 */
const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  // 요구사항: Astro 기본 output(static) — Cloudflare Workers Static Assets로 서빙
  output: 'static',
  trailingSlash: 'ignore',
  // 페이지를 <경로>.html로 생성 — Workers Static Assets가 /about, /posts/slug를
  // 트레일링 슬래시 307 없이 바로 200으로 서빙(기존 Next URL과 정확 일치)
  build: { format: 'file' },
  integrations: [mdx(), react(), sitemap()],
  // 구 URL 보존: 목록 개편(/posts → /blog)만 redirect, 글 상세는 그대로 유지
  redirects: {
    '/posts': '/blog'
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      fs: {
        // 콘텐츠(../public/markdown)와 프로젝트 데이터(../src/data)를
        // 저장소 루트에서 읽기 위해 허용
        allow: ['..']
      }
    }
  }
});
