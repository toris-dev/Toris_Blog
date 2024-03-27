import { getPostId } from '@/utils/fetch';
import { MetadataRoute } from 'next';
// 블로그 글마다 sitemap 생성해야함

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPostId();
  const sitemap = posts.map(({ id, created_at }) => {
    return {
      url: `https://toris-blog.vercel.app/posts/${id}`,
      lastModified: new Date(created_at)
    };
  });
  return [
    {
      url: 'https://toris-blog.vercel.app',
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
    },
    ...sitemap
  ];
}
