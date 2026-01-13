import { Post } from '@/types';

export interface RelatedPostScore {
  post: Post;
  score: number;
}

/**
 * 태그 기반 유사도 점수 계산
 */
function calculateTagSimilarity(
  currentTags: string[],
  otherTags: string[]
): number {
  if (currentTags.length === 0 || otherTags.length === 0) {
    return 0;
  }

  const currentTagSet = new Set(currentTags.map((tag) => tag.toLowerCase()));
  const otherTagSet = new Set(otherTags.map((tag) => tag.toLowerCase()));

  // 교집합 계산
  let intersection = 0;
  currentTagSet.forEach((tag) => {
    if (otherTagSet.has(tag)) {
      intersection++;
    }
  });

  // Jaccard 유사도: 교집합 / 합집합
  const union = currentTagSet.size + otherTagSet.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * 카테고리 기반 유사도 점수 계산
 */
function calculateCategorySimilarity(
  currentCategory: string,
  otherCategory: string
): number {
  return currentCategory.toLowerCase() === otherCategory.toLowerCase() ? 1 : 0;
}

/**
 * 제목 기반 유사도 점수 계산 (간단한 키워드 매칭)
 */
function calculateTitleSimilarity(
  currentTitle: string,
  otherTitle: string
): number {
  const currentWords = currentTitle
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);
  const otherWords = otherTitle
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);

  if (currentWords.length === 0 || otherWords.length === 0) {
    return 0;
  }

  const currentWordSet = new Set(currentWords);
  let matches = 0;
  otherWords.forEach((word) => {
    if (currentWordSet.has(word)) {
      matches++;
    }
  });

  // 평균 매칭 비율
  return matches / Math.max(currentWords.length, otherWords.length);
}

/**
 * 관련 포스트를 추천합니다.
 * 태그, 카테고리, 제목 유사도를 기반으로 점수를 계산하고 정렬합니다.
 *
 * @param currentPost 현재 포스트
 * @param allPosts 모든 포스트 목록
 * @param maxResults 최대 결과 수 (기본값: 3)
 * @returns 관련 포스트 목록 (점수 순으로 정렬)
 */
export function getRelatedPosts(
  currentPost: Post,
  allPosts: Post[],
  maxResults: number = 3
): Post[] {
  // 현재 포스트 제외
  const otherPosts = allPosts.filter(
    (post) => post.id !== currentPost.id && post.slug !== currentPost.slug
  );

  if (otherPosts.length === 0) {
    return [];
  }

  // 태그 정규화
  const currentTags = Array.isArray(currentPost.tags)
    ? currentPost.tags
    : typeof currentPost.tags === 'string'
      ? currentPost.tags.split(',').map((tag) => tag.trim())
      : [];

  // 각 포스트에 대한 점수 계산
  const scoredPosts: RelatedPostScore[] = otherPosts.map((post) => {
    const otherTags = Array.isArray(post.tags)
      ? post.tags
      : typeof post.tags === 'string'
        ? post.tags.split(',').map((tag) => tag.trim())
        : [];

    // 가중치 적용
    const tagScore = calculateTagSimilarity(currentTags, otherTags) * 0.5; // 50% 가중치
    const categoryScore =
      calculateCategorySimilarity(currentPost.category, post.category) * 0.3; // 30% 가중치
    const titleScore =
      calculateTitleSimilarity(currentPost.title, post.title) * 0.2; // 20% 가중치

    const totalScore = tagScore + categoryScore + titleScore;

    return {
      post,
      score: totalScore
    };
  });

  // 점수 순으로 정렬하고 상위 N개 선택
  const sortedPosts = scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .filter((item) => item.score > 0) // 점수가 0보다 큰 것만
    .map((item) => item.post);

  return sortedPosts;
}

/**
 * 카테고리 기반 관련 포스트 추천 (간단한 버전)
 */
export function getRelatedPostsByCategory(
  currentPost: Post,
  allPosts: Post[],
  maxResults: number = 3
): Post[] {
  const relatedPosts = allPosts
    .filter(
      (post) =>
        post.category === currentPost.category &&
        post.id !== currentPost.id &&
        post.slug !== currentPost.slug
    )
    .slice(0, maxResults);

  return relatedPosts;
}

/**
 * 태그 기반 관련 포스트 추천 (간단한 버전)
 */
export function getRelatedPostsByTags(
  currentPost: Post,
  allPosts: Post[],
  maxResults: number = 3
): Post[] {
  const currentTags = Array.isArray(currentPost.tags)
    ? currentPost.tags.map((tag) => tag.toLowerCase())
    : typeof currentPost.tags === 'string'
      ? currentPost.tags.split(',').map((tag) => tag.trim().toLowerCase())
      : [];

  if (currentTags.length === 0) {
    return [];
  }

  const scoredPosts: RelatedPostScore[] = allPosts
    .filter(
      (post) => post.id !== currentPost.id && post.slug !== currentPost.slug
    )
    .map((post) => {
      const postTags = Array.isArray(post.tags)
        ? post.tags.map((tag) => tag.toLowerCase())
        : typeof post.tags === 'string'
          ? post.tags.split(',').map((tag) => tag.trim().toLowerCase())
          : [];

      const matchingTags = currentTags.filter((tag) => postTags.includes(tag));
      const score = matchingTags.length / currentTags.length;

      return {
        post,
        score
      };
    })
    .filter((item) => item.score > 0);

  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((item) => item.post);
}
