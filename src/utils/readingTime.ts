/**
 * 마크다운 콘텐츠에서 읽기 시간을 계산합니다.
 * 한국어 기준: 평균 300자/분
 */
export function calculateReadingTime(content: string): number {
  // 마크다운 태그 제거
  let plainText = content
    .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거
    .replace(/`[^`]+`/g, '') // 인라인 코드 제거
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 링크 텍스트만 추출
    .replace(/[#*\-+>]/g, '') // 마크다운 문법 제거
    .replace(/\n+/g, ' ') // 줄바꿈을 공백으로
    .trim();

  // 공백 제거하여 문자 수 계산
  const charCount = plainText.replace(/\s/g, '').length;

  // 한국어 기준: 300자/분
  const readingTime = Math.ceil(charCount / 300);

  // 최소 1분
  return Math.max(1, readingTime);
}

/**
 * 읽기 시간을 포맷팅합니다.
 * @param minutes 읽기 시간 (분)
 * @returns 포맷팅된 문자열 (예: "5분", "약 1시간")
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) {
    return '1분 미만';
  }

  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `약 ${hours}시간`;
  }

  return `약 ${hours}시간 ${remainingMinutes}분`;
}
