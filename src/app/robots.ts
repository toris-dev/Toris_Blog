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
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
