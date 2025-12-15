import { getPostData } from '@/utils/markdown';
import { MetadataRoute } from 'next';

// 6시간마다 재생성
export const revalidate = 21600;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';

  // 정적 라우트 (항상 포함)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7
    },
    {
      url: `${baseUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9
    }
  ];

  // 동적 라우트 초기화
  let postRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];
  let tagRoutes: MetadataRoute.Sitemap = [];

  try {
    // 포스트 데이터 가져오기
    const posts = getPostData();

    if (posts && posts.length > 0) {
      // 포스트 라우트 생성
      postRoutes = posts
        .filter((post) => post.slug)
        .map((post) => ({
          url: `${baseUrl}/posts/${encodeURIComponent(post.slug)}`,
          lastModified: post.date ? new Date(post.date) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8
        }));

      // 카테고리 추출 및 라우트 생성
      const categories = Array.from(
        new Set(
          posts
            .map((post) => post.category)
            .filter((category) => category && category.trim())
        )
      );

      categoryRoutes = categories.map((category) => ({
        url: `${baseUrl}/categories/${encodeURIComponent(category)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7
      }));

      // 태그 추출 및 라우트 생성
      const allTags = posts
        .flatMap((post) => {
          if (!post.tags) return [];
          return typeof post.tags === 'string'
            ? post.tags.split(',').map((tag) => tag.trim())
            : post.tags;
        })
        .filter((tag) => tag && tag.trim());

      const uniqueTags = Array.from(new Set(allTags));

      tagRoutes = uniqueTags.map((tag) => ({
        url: `${baseUrl}/tags/${encodeURIComponent(tag)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6
      }));
    }
  } catch (error) {
    console.error('Error generating dynamic sitemap routes:', error);
    // 에러가 발생해도 빈 배열로 계속 진행
  }

  // 모든 라우트 결합
  return [...staticRoutes, ...postRoutes, ...categoryRoutes, ...tagRoutes];
}
