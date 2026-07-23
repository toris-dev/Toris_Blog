// 한국어 조사 처리. reading_engine.dart 의 조사 헬퍼를 그대로 이식한다.
// 한글 음절은 0xAC00 부터 28개 종성 단위로 배열되어 있다.

/** 마지막 글자에 받침이 있는지 판정한다. */
export function hasFinalConsonant(word: string): boolean {
  const trimmed = word.trim();
  if (trimmed.length === 0) return false;
  const code = trimmed.codePointAt(trimmed.length - 1) ?? 0;
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/** 목적격 조사: "경계를", "시작을" 처럼 자연스럽게. "을(를)" 표기를 쓰지 않는다. */
export const objectParticle = (word: string): string => (hasFinalConsonant(word) ? '을' : '를');

/** 주격 조사. */
export const subjectParticle = (word: string): string => (hasFinalConsonant(word) ? '이' : '가');

/** 도구격 조사. 받침이 없거나 받침이 'ㄹ' 이면 "로" 를 쓴다. */
export function instrumentParticle(word: string): string {
  const trimmed = word.trim();
  if (trimmed.length === 0) return '로';
  const code = trimmed.codePointAt(trimmed.length - 1) ?? 0;
  if (code < 0xac00 || code > 0xd7a3) return '로';
  const jongseong = (code - 0xac00) % 28;
  return jongseong === 0 || jongseong === 8 ? '로' : '으로';
}
