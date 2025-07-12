import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/posts', '/posts/*', '/about', '/contact', '/api/posts'],
        disallow: [
          '/api/*',
          '/admin/*',
          '/_next/*',
          '/favicon.ico',
          '/*.json$'
        ],
        crawlDelay: 1
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 0
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        crawlDelay: 1
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
