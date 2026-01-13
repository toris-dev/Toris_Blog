import { Post } from '@/types';

export interface SeriesPost {
  id: string; // slug
  title: string;
  order: number;
}

export interface SeriesMetadata {
  name: string;
  posts: SeriesPost[];
  totalPosts: number;
}

/**
 * 포스트 배열에서 시리즈 메타데이터를 생성합니다.
 */
export function getSeriesMetadata(posts: Post[]): Map<string, SeriesMetadata> {
  const seriesMap = new Map<string, SeriesMetadata>();

  // 시리즈별로 그룹화
  posts.forEach((post) => {
    // Post 타입에 series와 seriesOrder 필드가 있다고 가정
    const seriesName = (post as any).series;
    const seriesOrder = (post as any).seriesOrder || 0;

    if (seriesName) {
      if (!seriesMap.has(seriesName)) {
        seriesMap.set(seriesName, {
          name: seriesName,
          posts: [],
          totalPosts: 0
        });
      }

      const series = seriesMap.get(seriesName)!;
      series.posts.push({
        id: post.slug,
        title: post.title,
        order: seriesOrder
      });
    }
  });

  // 정렬 및 메타데이터 업데이트
  seriesMap.forEach((series) => {
    series.posts.sort((a, b) => a.order - b.order);
    series.totalPosts = series.posts.length;
  });

  return seriesMap;
}

/**
 * 현재 포스트의 시리즈 네비게이션 정보를 반환합니다.
 */
export function getSeriesNavigation(
  currentPost: Post,
  seriesMetadata: SeriesMetadata
): {
  previous?: SeriesPost;
  next?: SeriesPost;
  currentIndex: number;
} {
  const currentIndex = seriesMetadata.posts.findIndex(
    (p) => p.id === currentPost.slug
  );

  if (currentIndex === -1) {
    return {
      currentIndex: 0
    };
  }

  return {
    previous:
      currentIndex > 0 ? seriesMetadata.posts[currentIndex - 1] : undefined,
    next:
      currentIndex < seriesMetadata.posts.length - 1
        ? seriesMetadata.posts[currentIndex + 1]
        : undefined,
    currentIndex: currentIndex + 1
  };
}

/**
 * 특정 시리즈의 메타데이터를 가져옵니다.
 */
export function getSeriesMetadataByName(
  seriesName: string,
  allPosts: Post[]
): SeriesMetadata | null {
  const seriesMap = getSeriesMetadata(allPosts);
  return seriesMap.get(seriesName) || null;
}
