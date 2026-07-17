# toris

[토리스(Toris)](https://toris.kr) — 웹·모바일·AI 자동화 제품을 기획부터 출시·운영까지 만드는 1인 소프트웨어 스튜디오의 공식 사이트.

## Stack

Astro 5 (static) · Tailwind CSS v4 · Cloudflare Workers Static Assets

## Develop

```bash
pnpm install
pnpm dev          # localhost:4321
pnpm build        # 정적 빌드 (dist/)
pnpm run deploy   # 빌드 + Cloudflare 배포 + IndexNow 핑
```

- 콘텐츠: `public/markdown/**` (frontmatter 기반, slug = 파일명)
- 문의 API: `workers/contact-api` (사이트와 배포 분리)
