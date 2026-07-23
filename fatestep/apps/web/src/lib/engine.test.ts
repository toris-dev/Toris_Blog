import { describe, expect, it } from 'vitest';
import { CARDS } from './deck';
import { assign, drawPool, interpret } from './engine';
import { hasFinalConsonant, instrumentParticle, objectParticle, subjectParticle } from './korean';
import { seededRng } from './rng';
import { classify, findForbidden, isSensitive, maskPreview, safetyNotice } from './safety';
import { SPREADS, categoryMeaning, type CategoryKey } from './types';

const CATEGORY_KEYS: CategoryKey[] = ['general', 'relationship', 'work', 'money', 'choice'];

describe('덱 콘텐츠', () => {
  it('36장이며 6개 영역이 각각 6장이다', () => {
    expect(CARDS).toHaveLength(36);
    const byDomain = new Map<string, number>();
    for (const c of CARDS) byDomain.set(c.domain, (byDomain.get(c.domain) ?? 0) + 1);
    expect([...byDomain.keys()].sort()).toEqual(['bond', 'flame', 'gate', 'path', 'seed', 'shadow']);
    for (const n of byDomain.values()) expect(n).toBe(6);
  });

  it('id 와 이름이 중복되지 않는다', () => {
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
    expect(new Set(CARDS.map((c) => c.name)).size).toBe(CARDS.length);
  });

  it('모든 카드에 카테고리별 해석과 대체 텍스트가 있다', () => {
    for (const c of CARDS) {
      for (const k of CATEGORY_KEYS) expect(categoryMeaning(c, k).length).toBeGreaterThan(0);
      expect(c.imageAlt.length).toBeGreaterThan(0);
      expect(c.actionPrompt.length).toBeGreaterThan(0);
    }
  });

  it('단정적인 예언 표현을 쓰지 않는다', () => {
    for (const c of CARDS) {
      const blob = [
        c.summary,
        c.lightMeaning,
        c.shadowMeaning,
        c.relationshipMeaning,
        c.workMeaning,
        c.moneyMeaning,
        c.choiceMeaning,
        c.actionPrompt,
        c.caution,
      ].join(' ');
      expect(findForbidden(blob)).toEqual([]);
    }
  });
});

describe('리딩 엔진', () => {
  it('같은 리딩 안에서 카드가 중복되지 않는다', () => {
    const rng = seededRng(42);
    for (let n = 0; n < 200; n++) {
      const pool = drawPool(15, rng);
      const picked = pool.slice(0, 3);
      expect(new Set(picked.map((c) => c.id)).size).toBe(3);
    }
  });

  it('세 장 리딩은 씨앗 · 흐름 · 문 위치를 순서대로 가진다', () => {
    const rng = seededRng(7);
    const picked = drawPool(3, rng);
    const drawn = assign(SPREADS['fate-three'], picked, 'general', rng);
    expect(drawn.map((d) => d.position.key)).toEqual(['seed', 'stream', 'gate']);
  });

  it('해석은 모든 필수 섹션을 채운다', () => {
    const rng = seededRng(3);
    const picked = drawPool(3, rng);
    const drawn = assign(SPREADS['fate-three'], picked, 'relationship', rng);
    const r = interpret(SPREADS['fate-three'], 'relationship', drawn, 'none');
    expect(r.headline.length).toBeGreaterThan(0);
    expect(r.overview.length).toBeGreaterThan(0);
    expect(r.cardSections).toHaveLength(3);
    expect(r.action.length).toBeGreaterThan(0);
    expect(r.reflectionQuestion.length).toBeGreaterThan(0);
    expect(r.caution.length).toBeGreaterThan(0);
    expect(r.disclaimer.length).toBeGreaterThan(0);
  });

  it('그림자 영역은 그림자 흐름이 더 자주 나오지만 한쪽으로 고정되지 않는다', () => {
    const rng = seededRng(99);
    const shadowCards = CARDS.filter((c) => c.domain === 'shadow');
    let light = 0;
    let shadow = 0;
    for (let i = 0; i < 400; i++) {
      const card = shadowCards[i % shadowCards.length];
      const drawn = assign(SPREADS.daily, [card], 'general', rng);
      if (drawn[0].flow === 'shadow') shadow++;
      else light++;
    }
    expect(shadow).toBeGreaterThan(light); // 그림자가 더 자주
    expect(light).toBeGreaterThan(0); // 그러나 한쪽 고정 아님
  });

  it('결과 snapshot 은 직렬화 후에도 동일하게 복원된다', () => {
    const rng = seededRng(11);
    const drawn = assign(SPREADS['fate-three'], drawPool(3, rng), 'work', rng);
    const r = interpret(SPREADS['fate-three'], 'work', drawn, 'none');
    const roundtrip = JSON.parse(JSON.stringify(r));
    expect(roundtrip).toEqual(r);
  });
});

describe('한국어 조사', () => {
  it('받침 유무에 따라 목적격 조사를 고른다', () => {
    expect(objectParticle('경계')).toBe('를');
    expect(objectParticle('시작')).toBe('을');
    expect(hasFinalConsonant('시작')).toBe(true);
    expect(hasFinalConsonant('경계')).toBe(false);
  });

  it('주격 조사도 같은 규칙을 따른다', () => {
    expect(subjectParticle('씨앗')).toBe('이');
    expect(subjectParticle('나무')).toBe('가');
  });

  it('도구격 조사는 ㄹ 받침을 예외로 처리한다', () => {
    expect(instrumentParticle('나무')).toBe('로'); // 받침 없음
    expect(instrumentParticle('바람')).toBe('으로'); // ㅁ 받침
    expect(instrumentParticle('물')).toBe('로'); // ㄹ 받침 예외
  });

  it('모든 카드 이름에 어색한 "을(를)" 표기가 남지 않는다', () => {
    for (const c of CARDS) {
      expect(`${c.name}${objectParticle(c.name)}`).not.toContain('을(를)');
    }
  });
});

describe('안전 정책', () => {
  it('민감 주제를 분류한다', () => {
    expect(classify('요즘 자꾸 죽고 싶은 생각이 들어요')).toBe('crisis');
    expect(classify('수술을 받아야 할까요')).toBe('health');
    expect(classify('지금 주식을 사도 될까요')).toBe('finance');
    expect(classify('오늘 점심 뭐 먹을까')).toBe('none');
  });

  it('위기 신호는 다른 주제보다 우선한다', () => {
    // 건강·위기 키워드가 함께 있어도 위기가 먼저.
    expect(classify('병원에 가야 하는데 죽고 싶어요')).toBe('crisis');
  });

  it('민감 주제 안내에는 현실의 도움 경로가 포함된다', () => {
    expect(isSensitive('crisis')).toBe(true);
    expect(safetyNotice('crisis')).toContain('109');
    expect(safetyNotice('crime')).toContain('112');
  });

  it('질문 미리보기는 12자까지만 남긴다', () => {
    expect(maskPreview('')).toBe('질문 없이 진행한 리딩');
    expect(maskPreview('짧은질문')).toBe('짧은질문');
    const long = maskPreview('이것은 열두글자를 넘는 아주 긴 질문입니다');
    expect(long.endsWith('…')).toBe(true);
    expect(Array.from(long)).toHaveLength(13); // 12자 + …
  });
});
