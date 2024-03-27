import { getPosts } from '@/utils/fetch';
import RSS from 'rss';
export async function GET() {
  const allPosts = await getPosts({});

  const feed = new RSS({
    title: 'toris-dev Blog',
    description: 'Blog introducing the toris-dev project',
    site_url: 'https://toris-blog.vercel.app/',
    feed_url: 'https://toris-blog.vercel.app/feed.xml',
    language: 'ko',
    pubDate: '',
    image_url:
      'https://tnmdprhjqnijsaqjvbtd.supabase.co/storage/v1/object/public/blog-image/'
  });

  allPosts?.map((post) => {
    feed.item({
      title: post.title,
      url: `https://toris-blog.vercel.app/${post.id}`,
      date: post.created_at,
      description: post.content,
      author: 'toris-dev',
      categories: post.tags?.map((tag) => tag) ?? undefined
    });
  });
  return new Response(feed.xml({ indent: true }), {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8'
    }
  });
}
