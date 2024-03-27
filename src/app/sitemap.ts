import { MetadataRoute } from 'next';
// 블로그 글마다 sitemap 생성해야함
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://toris-blog.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1
    },
    {
      url: 'https://toris-blog.vercel.app/posts',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1
    },
    {
      url: 'https://toris-blog.vercel.app/search',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8
    },
    {
      url: 'https://toris-blog.vercel.app/tags',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.5
    }
  ];
}
