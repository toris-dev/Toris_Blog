// @ts-check
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// fate.toris.kr — 운명의 카드. 순수 정적 Astro + 클라이언트 React 아일랜드.
// 서버 없음: 카드 데이터·리딩 엔진·기록이 모두 브라우저에서 동작한다.
const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://fate.toris.kr';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'ignore',
  // 루트 toris.kr과 동일하게 <경로>.html 로 생성 → Workers Static Assets가 307 없이 200 서빙
  build: { format: 'file' },
  integrations: [react()],
});
