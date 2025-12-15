import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/posts',
          '/posts/*',
          '/categories',
          '/categories/*',
          '/tags',
          '/tags/*',
          '/about',
          '/contact'
        ],
        disallow: [
          '/api/*',
          '/admin/*',
          '/_next/*',
          '/favicon.ico',
          '/*.json$',
          '/offline'
        ],
        crawlDelay: 1
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/posts',
          '/posts/*',
          '/categories',
          '/categories/*',
          '/tags',
          '/tags/*',
          '/about',
          '/contact'
        ],
        disallow: ['/api/*', '/admin/*', '/_next/*', '/offline'],
        crawlDelay: 0
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/posts',
          '/posts/*',
          '/categories',
          '/categories/*',
          '/tags',
          '/tags/*',
          '/about',
          '/contact'
        ],
        disallow: ['/api/*', '/admin/*', '/_next/*', '/offline'],
        crawlDelay: 1
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
