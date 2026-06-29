import { searchSecondBrain, type SecondBrainSearchResult } from './secondBrain';

export type ChatSource = {
  title: string;
  path: string;
  heading?: string;
};

function toSources(results: SecondBrainSearchResult[]): ChatSource[] {
  const seen = new Set<string>();

  return results
    .filter((result) => {
      const key = `${result.path}#${result.heading ?? ''}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 6)
    .map((result) => ({
      title: result.title,
      path: result.path,
      heading: result.heading
    }));
}

function buildAnswer(results: SecondBrainSearchResult[]): string {
  if (results.length === 0) {
    return '관련 문서를 찾지 못했습니다. 다른 키워드로 검색해 보세요.';
  }

  const snippets = results.slice(0, 5).map((result, index) => {
    const heading = result.heading ? ` — ${result.heading}` : '';
    const excerpt =
      result.content.length > 500
        ? `${result.content.slice(0, 500)}…`
        : result.content;

    return `${index + 1}. ${result.title}${heading}\n${excerpt}`;
  });

  return ['관련 문서 발췌:', '', ...snippets].join('\n');
}

/** LLM 없이 로컬 lexical 검색만 사용 (비용 0) */
export function askSecondBrain(message: string): {
  answer: string;
  sources: ChatSource[];
} {
  const results = searchSecondBrain(message, 6);

  return {
    answer: buildAnswer(results),
    sources: toSources(results)
  };
}
