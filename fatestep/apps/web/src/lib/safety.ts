// 안전·윤리 정책. safety_policy.dart 를 그대로 이식한다.
// - 민감 주제는 별도 안내 문구로 전환한다.
// - 질문 원문은 해석 문구에 직접 삽입하지 않는다.

export type SafetyTopic = 'none' | 'crisis' | 'crime' | 'health' | 'legal' | 'finance';

export const BASE_DISCLAIMER =
  '운명의 카드는 엔터테인먼트와 자기성찰을 위한 서비스이며, ' +
  '미래의 사건을 보장하거나 의료·법률·재정적 판단을 대신하지 않습니다.';

const CRISIS = ['자살', '죽고 싶', '죽고싶', '자해', '극단적 선택', '살기 싫', '살기싫'];
const HEALTH = ['암', '진단', '수술', '병원', '질병', '통증', '임신', '유산', '치료', '약을'];
const LEGAL = ['소송', '고소', '변호사', '재판', '합의금', '형사', '이혼 소송'];
const FINANCE = ['주식', '코인', '비트코인', '대출', '빚', '투자', '레버리지', '선물', '파산'];
const CRIME = ['폭행', '스토킹', '협박', '학대', '성추행', '성폭력', '피해 신고'];

/** 민감 주제 분류. 순서가 곧 우선순위다. */
export function classify(question: string | null | undefined): SafetyTopic {
  const q = (question ?? '').trim();
  if (q.length === 0) return 'none';
  const has = (keys: string[]): boolean => keys.some((k) => q.includes(k));
  if (has(CRISIS)) return 'crisis';
  if (has(CRIME)) return 'crime';
  if (has(HEALTH)) return 'health';
  if (has(LEGAL)) return 'legal';
  if (has(FINANCE)) return 'finance';
  return 'none';
}

export const isSensitive = (topic: SafetyTopic): boolean => topic !== 'none';

/** 결과 상단에 노출할 안내. 공포를 유발하지 않고 현실의 도움을 안내한다. */
export function safetyNotice(topic: SafetyTopic): string {
  switch (topic) {
    case 'crisis':
      return (
        '지금 많이 힘든 마음이 담긴 질문으로 보입니다. 카드는 이 상황을 판단할 수 없습니다. ' +
        '한국에서는 자살예방 상담전화 109, 정신건강 상담전화 1577-0199 로 24시간 이야기를 나눌 수 있습니다. ' +
        '가까운 사람에게 지금의 마음을 알리는 것도 도움이 됩니다.'
      );
    case 'crime':
      return (
        '안전과 관련된 질문으로 보입니다. 카드 결과를 대응의 근거로 사용하지 않으시길 권합니다. ' +
        '위급한 상황이라면 112, 여성긴급전화 1366 등 공적인 도움을 먼저 이용해 주세요.'
      );
    case 'health':
      return (
        '건강과 관련된 질문으로 보입니다. 카드는 진단이나 치료 판단을 대신할 수 없습니다. ' +
        '증상이 있다면 의료 전문가의 진료를 우선해 주세요. 아래 해석은 마음을 정리하는 용도로만 참고해 주세요.'
      );
    case 'legal':
      return (
        '법률적 판단이 필요한 질문으로 보입니다. 카드는 법적 조언을 대신할 수 없습니다. ' +
        '대한법률구조공단(132) 등 전문가 상담을 함께 이용해 주세요.'
      );
    case 'finance':
      return (
        '금전적 결정이 담긴 질문으로 보입니다. 카드는 수익이나 손실을 예측하지 않습니다. ' +
        '아래 해석은 결정 기준을 정리하는 용도로만 참고하시고, 실제 판단은 본인의 자료와 전문가 조언을 근거로 해 주세요.'
      );
    case 'none':
    default:
      return '';
  }
}

/** 질문 원문을 저장하지 않을 때 목록에 보여 줄 마스킹 미리보기. 앞 12자만. */
export function maskPreview(question: string | null | undefined): string {
  const q = (question ?? '').trim().replace(/\s+/g, ' ');
  if (q.length === 0) return '질문 없이 진행한 리딩';
  const runes = Array.from(q);
  if (runes.length <= 12) return q;
  return runes.slice(0, 12).join('') + '…';
}

/** 단정 표현 점검. 콘텐츠 QA 와 테스트에서 사용한다. */
export const FORBIDDEN_EXPRESSIONS = [
  '반드시',
  '확실히',
  '틀림없이',
  '운명적으로 정해',
  '반드시 헤어',
  '큰돈을 법니다',
  '병이 생길',
];

export const findForbidden = (text: string): string[] =>
  FORBIDDEN_EXPRESSIONS.filter((e) => text.includes(e));
