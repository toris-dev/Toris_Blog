import { getCategories, getPostId, getTags } from '@/utils/fetch';
import { MetadataRoute } from 'next';
// 블로그 글마다 sitemap 생성해야함

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPostId();
  const tags = await getTags();
  const categories = await getCategories();
  const postSitemap = posts.map(({ id, created_at }) => {
    return {
      url: `https://toris-blog.vercel.app/posts/${id}`,
      lastModified: new Date(created_at),
      priority: 0.7
    };
  });

  const tagsSitemap = tags.map((tag) => {
    return {
      url: `https://toris-blog.vercel.app/posts/${tag}`,
      lastModified: new Date(),
      priority: 0.7
    };
  });

  const categoriesSitemap = categories.map((category) => {
    return {
      url: `https://toris-blog.vercel.app/categories/${category}`,
      lastModified: new Date(),
      priority: 0.7
    };
  });
  const sitemap = [...postSitemap, ...tagsSitemap, ...categoriesSitemap];
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
      priority: 0.5
    },
    {
      url: 'https://toris-blog.vercel.app/tags',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6
    },
    {
      url: 'https://toris-blog.vercel.app/categories',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6
    },
    ...sitemap
  ];
}
