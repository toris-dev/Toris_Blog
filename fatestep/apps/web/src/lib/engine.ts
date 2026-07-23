// 리딩 엔진. reading_engine.dart 를 그대로 이식한다. 생성형 AI 를 쓰지 않고
// 검수된 템플릿과 연결 규칙으로 결과를 구성한다.
import { CARDS } from './deck';
import { instrumentParticle, objectParticle, subjectParticle } from './korean';
import { secureRng, shuffled, type Rng } from './rng';
import { BASE_DISCLAIMER, isSensitive, safetyNotice, type SafetyTopic } from './safety';
import {
  CATEGORIES,
  DOMAIN_LABELS,
  categoryMeaning,
  flowMeaning,
  type CardFlow,
  type CardSection,
  type CategoryKey,
  type DrawnCard,
  type FateCard,
  type ReadingInterpretation,
  type Spread,
  type SpreadPosition,
} from './types';

const domainLabel = (key: string): string => DOMAIN_LABELS[key] ?? key;

/** 중복 없이 카드 후보를 뽑는다. 사용자가 고르는 자리 수보다 넉넉히 준비한다. */
export function drawPool(size: number, rng: Rng = secureRng): FateCard[] {
  const pool = shuffled(CARDS, rng);
  return pool.slice(0, Math.min(size, pool.length));
}

/** 사용자가 선택한 카드에 위치와 흐름을 붙인다. */
export function assign(
  spread: Spread,
  picked: FateCard[],
  category: CategoryKey,
  rng: Rng = secureRng,
): DrawnCard[] {
  const positions = spread.positions;
  return picked.map((card, i) => {
    const position = positions[i % positions.length];
    return {
      card,
      position,
      flow: decideFlow(card, position, category, rng),
      orderIndex: i,
    };
  });
}

/** 흐름은 단순 50:50 이 아니라 위치·도메인·카테고리 가중치로 결정한다. */
function decideFlow(
  card: FateCard,
  position: SpreadPosition,
  category: CategoryKey,
  rng: Rng,
): CardFlow {
  let lightWeight = 0.5;

  // 위치: 배경은 이미 지나간 흐름이라 중립, 문은 가능성을 보는 자리라 빛 쪽으로 기운다.
  lightWeight +=
    position.key === 'seed'
      ? 0.04
      : position.key === 'stream'
        ? -0.02
        : position.key === 'gate'
          ? 0.1
          : 0.03;

  // 도메인: 그림자 영역은 경고보다 자기 점검을 목적으로 하므로 shadow 가 더 자주 나온다.
  lightWeight +=
    card.domain === 'seed'
      ? 0.1
      : card.domain === 'path'
        ? 0.0
        : card.domain === 'bond'
          ? 0.04
          : card.domain === 'flame'
            ? 0.04
            : card.domain === 'shadow'
              ? -0.16
              : card.domain === 'gate'
                ? 0.06
                : 0.0;

  // 카테고리: 선택/돈 질문은 주의 관점이 더 유용하다.
  lightWeight +=
    category === 'choice'
      ? -0.04
      : category === 'money'
        ? -0.04
        : category === 'relationship'
          ? 0.02
          : 0.0;

  lightWeight = Math.min(0.8, Math.max(0.2, lightWeight));
  return rng.nextDouble() < lightWeight ? 'light' : 'shadow';
}

/** 검수된 템플릿으로 결과를 구성한다. (spread 는 API 패리티용 — 내부 미사용) */
export function interpret(
  _spread: Spread,
  category: CategoryKey,
  drawn: DrawnCard[],
  safetyTopic: SafetyTopic,
): ReadingInterpretation {
  const sections: CardSection[] = drawn.map((d) => ({
    positionTitle: d.position.title,
    positionDescription: d.position.description,
    cardId: d.card.id,
    cardName: d.card.name,
    domain: d.card.domain,
    symbol: d.card.symbol,
    flow: d.flow,
    keywords: d.card.keywords,
    meaning: flowMeaning(d.card, d.flow),
    categoryMeaning: categoryMeaning(d.card, category),
    imageAlt: d.card.imageAlt,
  }));

  const anchor = anchorCard(drawn);

  return {
    headline: headline(drawn, anchor),
    overview: overview(category, drawn),
    cardSections: sections,
    caution: caution(drawn),
    action: anchor.card.actionPrompt,
    reflectionQuestion: anchor.card.reflectionQuestion,
    disclaimer: isSensitive(safetyTopic)
      ? `${safetyNotice(safetyTopic)}\n\n${BASE_DISCLAIMER}`
      : BASE_DISCLAIMER,
  };
}

/** 행동과 질문을 가져올 기준 카드. 세 장이면 문을 우선하되, 그림자가 있으면 그쪽을 먼저. */
function anchorCard(drawn: DrawnCard[]): DrawnCard {
  if (drawn.length === 1) return drawn[0];
  const shadowOnes = drawn.filter((d) => d.flow === 'shadow');
  if (shadowOnes.length >= 2) return shadowOnes[0];
  return drawn[drawn.length - 1];
}

function headline(drawn: DrawnCard[], anchor: DrawnCard): string {
  const shadowCount = drawn.filter((d) => d.flow === 'shadow').length;
  const domains = new Set(drawn.map((d) => d.card.domain));

  if (drawn.length === 1) {
    const keyword = anchor.card.keywords[0];
    return anchor.flow === 'light'
      ? `오늘은 ${keyword}${objectParticle(keyword)} 살펴보기 좋은 날입니다.`
      : '오늘은 서두르기보다 기준을 확인할 때입니다.';
  }

  if (shadowCount === drawn.length) {
    return '지금은 답을 정하기보다 마음을 먼저 살필 때입니다.';
  }
  if (shadowCount === 0) {
    return '흐름은 열려 있고, 남은 것은 방향을 정하는 일입니다.';
  }
  if (domains.has('seed') && domains.has('gate')) {
    return '작은 준비 하나가 다음 단계로 이어지고 있습니다.';
  }
  if (domains.has('flame') && domains.has('path')) {
    return '실행할 힘은 충분하고, 필요한 것은 기준입니다.';
  }
  if (domains.has('bond')) {
    return '결과보다 사람 사이의 방식이 흐름을 만들고 있습니다.';
  }
  return '서두르기보다 지금의 기준을 살펴볼 때입니다.';
}

function overview(category: CategoryKey, drawn: DrawnCard[]): string {
  const parts: string[] = [];
  const domains = drawn.map((d) => d.card.domain);
  const domainSet = new Set(domains);
  const shadowCount = drawn.filter((d) => d.flow === 'shadow').length;

  if (drawn.length === 1) {
    const only = drawn[0];
    parts.push(
      `오늘의 흐름은 ${domainLabel(only.card.domain)} 영역의 ` +
        `${only.card.name}${instrumentParticle(only.card.name)} 나타났습니다. `,
    );
    parts.push(`${flowMeaning(only.card, only.flow)} `);
    if (category !== 'general') {
      parts.push(`${categoryMeaning(only.card, category)} `);
    }
    parts.push('이 결과는 정해진 사실이 아니라 하나의 관점입니다.');
    return parts.join('');
  }

  const subject = (i: number): string => {
    const name = drawn[i].card.name;
    return `${name}${subjectParticle(name)}`;
  };

  parts.push(
    `${subject(0)} 지금의 배경을, ` +
      `${subject(1)} 현재 작용하는 힘을, ` +
      `${subject(2)} 열릴 수 있는 방향을 보여 줍니다. `,
  );

  // 연결 규칙 (DESIGN.md §10.3)
  if (domainSet.has('seed') && domainSet.has('gate')) {
    parts.push('작게 준비해 온 것이 전환으로 이어지는 흐름입니다. ');
  }
  if (domains.filter((d) => d === 'shadow').length >= 2) {
    parts.push('상황보다 먼저 불안과 집착을 살펴보는 편이 도움이 됩니다. ');
  }
  if (domains.filter((d) => d === 'bond').length >= 2) {
    parts.push('결과보다 관계와 소통 방식이 이번 흐름의 중심에 있습니다. ');
  }
  if (domainSet.has('flame') && domainSet.has('path')) {
    parts.push('실행할 에너지는 충분하지만 방향에 대한 기준이 필요합니다. ');
  }
  if (domainSet.has('gate') && domainSet.has('shadow')) {
    parts.push('정리하지 못한 마음이 전환의 시점을 늦추고 있을 수 있습니다. ');
  }

  if (shadowCount >= 2) {
    parts.push('그림자 흐름이 여럿 나타났지만 이는 나쁜 결과의 예고가 아니라, ');
    parts.push('지금 놓치기 쉬운 지점을 알려 주는 신호에 가깝습니다. ');
  } else if (shadowCount === 0) {
    parts.push('전반적으로 막힘이 적은 흐름이므로 결정을 미룰 이유는 크지 않아 보입니다. ');
  }

  if (category !== 'general') {
    parts.push(`${CATEGORIES[category].label} 관점에서는 `);
    parts.push(`${categoryMeaning(drawn[1].card, category)} `);
  }

  parts.push('여기에서 보이는 것은 가능성이며, 결정은 언제나 당신의 몫입니다.');
  return parts.join('');
}

function caution(drawn: DrawnCard[]): string {
  const shadowOnes = drawn.filter((d) => d.flow === 'shadow');
  if (shadowOnes.length > 0) return shadowOnes[0].card.caution;
  return drawn[drawn.length - 1].card.caution;
}
