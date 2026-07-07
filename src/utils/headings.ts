/**
 * 마크다운 콘텐츠에서 h2 헤딩을 동기적으로 추출한다.
 *
 * PostPage(목차 렌더)와 Markdown(h2에 id 부여)이 이 동일한 로직을 공유하므로
 * 목차의 앵커 링크가 실제 h2 요소의 id와 항상 일치한다. 또한 서버/클라이언트
 * 렌더 결과가 결정론적으로 같아 hydration mismatch가 없고, 목차가 첫 페인트부터
 * 존재하므로 "목차가 뒤늦게 떠서 본문이 밀리는" 레이아웃 시프트가 사라진다.
 */

export interface Heading {
  id: string;
  text: string;
  level: number;
}

// 텍스트를 slug로 변환 (이모지/특수문자 제거, 한글·영문·숫자 유지)
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// h2 헤딩을 순서대로 추출하고 결정론적으로 중복 없는 id를 부여
export function extractHeadings(content: string): Heading[] {
  if (!content) return [];
  const headingRegex = /^(#{2})\s+(.+)$/gm;
  const idCounts = new Map<string, number>();
  const result: Heading[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(content)) !== null) {
    const text = match[2].trim();
    let baseId = slugify(text);
    if (!baseId) {
      baseId = `heading-${hashString(text)}`;
    }

    let id = baseId;
    if (idCounts.has(baseId)) {
      const count = idCounts.get(baseId)! + 1;
      idCounts.set(baseId, count);
      id = `${baseId}-${count}`;
    } else {
      idCounts.set(baseId, 0);
    }

    result.push({ id, text, level: 2 });
  }

  return result;
}

// Markdown 렌더러가 h2에 id를 부여할 때 쓰는 조회 맵: `2-${text}` -> id
export function buildHeadingIdMap(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const h of extractHeadings(content)) {
    map.set(`${h.level}-${h.text}`, h.id);
  }
  return map;
}
