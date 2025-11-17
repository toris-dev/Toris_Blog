/**
 * 마크다운 콘텐츠에서 첫 번째 이미지 URL을 추출합니다.
 */
export function extractFirstImageFromMarkdown(content: string): string | null {
  if (!content) return null;

  // 마크다운 이미지 패턴: ![alt](url) 또는 ![alt](url "title")
  const markdownImageRegex = /!\[.*?\]\((.*?)(?:\s+"[^"]*")?\)/;
  const markdownMatch = content.match(markdownImageRegex);
  if (markdownMatch && markdownMatch[1]) {
    return markdownMatch[1].trim();
  }

  // HTML img 태그 패턴: <img src="url" ...>
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
  const htmlMatch = content.match(htmlImageRegex);
  if (htmlMatch && htmlMatch[1]) {
    return htmlMatch[1].trim();
  }

  return null;
}

/**
 * 기본 OG 이미지 URL을 생성합니다.
 * @param title - 이미지에 표시할 제목
 * @param subtitle - 이미지에 표시할 부제목 (선택적)
 */
export function getDefaultOGImageUrl(
  title: string,
  subtitle?: string
): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';
  const params = new URLSearchParams({
    title: title.substring(0, 60), // 제목 길이 제한
    ...(subtitle && { subtitle: subtitle.substring(0, 80) })
  });
  return `${baseUrl}/api/og-image?${params.toString()}`;
}

/**
 * 이미지 URL이 절대 경로인지 확인합니다.
 */
export function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * 상대 경로를 절대 URL로 변환합니다.
 */
export function toAbsoluteUrl(path: string): string {
  if (isAbsoluteUrl(path)) {
    return path;
  }
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://toris-blog.vercel.app';
  // 상대 경로가 /로 시작하지 않으면 추가
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

