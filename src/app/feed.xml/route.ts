import { getPosts } from '@/utils/fetch';
import RSS from 'rss';

// 사이트 도메인 설정
const DOMAIN =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-dev.vercel.app';

// 6시간마다 재생성
export const revalidate = 21600;

export async function GET() {
  // 모든 게시물 가져오기
  const allPosts = await getPosts({});

  // RSS 피드 생성
  const feed = new RSS({
    title: '토리스 블로그',
    description: '웹 개발, 프로그래밍, 기술 트렌드에 관한 내용을 다룹니다.',
    site_url: DOMAIN,
    feed_url: `${DOMAIN}/feed.xml`,
    language: 'ko',
    pubDate: new Date(),
    copyright: `${new Date().getFullYear()} 토리스`,
    image_url: `${DOMAIN}/images/logo.png`
  });

  // 모든 게시물을 RSS 피드에 추가
  allPosts.forEach((post) => {
    feed.item({
      title: post.title,
      url: `${DOMAIN}/posts/${post.slug}`,
      date: post.date,
      description: post.description || post.title,
      author: '토리스',
      categories: post.tags || [],
      custom_elements: [{ 'content:encoded': post.content }]
    });
  });

  // Next.js route handler로 RSS XML 제공
  return new Response(feed.xml({ indent: true }), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // ISG를 위한 캐시 제어 헤더 설정
      'Cache-Control': `public, s-maxage=${21600}, stale-while-revalidate`
    }
  });
}
