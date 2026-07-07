import { MetadataRoute } from 'next';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';

const publicAllow = [
  '/',
  '/posts',
  '/posts/*',
  '/categories',
  '/categories/*',
  '/tags',
  '/tags/*',
  '/about',
  '/contact'
];

const publicDisallow = [
  '/api/*',
  '/admin/*',
  '/_next/*',
  '/favicon.ico',
  '/*.json$',
  '/offline',
  '/ask'
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: publicAllow,
        disallow: publicDisallow,
        crawlDelay: 2
      },
      {
        userAgent: 'Googlebot',
        allow: publicAllow,
        disallow: publicDisallow
      },
      {
        userAgent: 'Bingbot',
        allow: publicAllow,
        disallow: publicDisallow,
        crawlDelay: 1
      },
      // AEO / GEO: AI 검색·답변 엔진용 공개 콘텐츠 허용
      {
        userAgent: 'GPTBot',
        allow: publicAllow,
        disallow: [...publicDisallow, '/todos', '/bookmarks', '/guestbook', '/ask']
      },
      {
        userAgent: 'ChatGPT-User',
        allow: publicAllow,
        disallow: [...publicDisallow, '/todos', '/bookmarks', '/guestbook', '/ask']
      },
      {
        userAgent: 'ClaudeBot',
        allow: publicAllow,
        disallow: [...publicDisallow, '/todos', '/bookmarks', '/guestbook', '/ask']
      },
      {
        userAgent: 'Google-Extended',
        allow: publicAllow,
        disallow: [...publicDisallow, '/todos', '/bookmarks', '/guestbook', '/ask']
      },
      {
        userAgent: 'PerplexityBot',
        allow: publicAllow,
        disallow: [...publicDisallow, '/todos', '/bookmarks', '/guestbook', '/ask']
      },
      // ChatGPT 검색 fetcher(OAI-SearchBot)와 그 외 AI 검색봇도 명시 허용.
      // 명시하지 않으면 `*` 규칙의 Crawl-delay를 상속해 색인이 느려진다.
      {
        userAgent: 'OAI-SearchBot',
        allow: publicAllow,
        disallow: [...publicDisallow, '/todos', '/bookmarks', '/guestbook', '/ask']
      },
      {
        userAgent: 'Applebot-Extended',
        allow: publicAllow,
        disallow: [...publicDisallow, '/todos', '/bookmarks', '/guestbook', '/ask']
      },
      {
        userAgent: 'Amazonbot',
        allow: publicAllow,
        disallow: [...publicDisallow, '/todos', '/bookmarks', '/guestbook', '/ask']
      },
      {
        userAgent: 'CCBot',
        allow: publicAllow,
        disallow: [...publicDisallow, '/todos', '/bookmarks', '/guestbook', '/ask']
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
