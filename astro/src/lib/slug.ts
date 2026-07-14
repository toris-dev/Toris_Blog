/**
 * Next.js(src/utils/markdown.ts)의 슬러그/발췌 로직을 그대로 포팅.
 * 기존 게시글 URL(/posts/[slug])을 바이트 단위로 보존하기 위해
 * 알고리즘을 변경하지 말 것 — 검증 스크립트가 원본과 대조한다.
 */

export function createSlug(fileName: string): string {
  const slug = fileName
    // 이모지 제거 (단순한 패턴)
    .replace(
      /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
      ''
    )
    // 특수 문자를 하이픈으로 변경 (한글, 영문, 숫자, 공백, 하이픈만 유지)
    .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ-]/g, '-')
    // 다중 공백을 하이픈으로
    .replace(/\s+/g, '-')
    // 다중 하이픈을 단일 하이픈으로
    .replace(/-+/g, '-')
    // 앞뒤 하이픈 제거
    .replace(/^-+|-+$/g, '')
    .trim();

  if (!slug) {
    const koreanOnly = fileName.replace(/[^\u{AC00}-\u{D7AF}]/gu, '');
    return koreanOnly || 'untitled-post';
  }

  return slug;
}

/** 검색/소셜/AI 스니펫용 평문 발췌 — Next 구현과 동일 */
export function toPlainExcerpt(markdown: string, maxLen = 155): string {
  const text = (markdown || '')
    .replace(/^\s*#\s+.*(?:\r?\n|$)/, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[`*_~]/g, '')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen).trim() + '…';
}

/** 엔트리 filePath에서 확장자 없는 파일명(=Next 제목 폴백) 추출 */
export function fileBaseName(filePath: string | undefined): string {
  if (!filePath) return '';
  return (filePath.split('/').pop() || '').replace(/\.md$/i, '');
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/** 어떤 형태의 날짜든 ISO 8601로 정규화(JSON-LD/메타용). 실패 시 undefined */
export function toISO(date: string | null | undefined): string | undefined {
  if (!date) return undefined;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}
