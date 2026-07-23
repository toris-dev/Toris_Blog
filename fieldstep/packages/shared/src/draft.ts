/**
 * 현장 기록(transcript/메모)로부터 구조화된 작업 초안을 만드는 결정적 규칙 파서.
 * 외부 STT/LLM 호출 없음 — 순수 함수만. 향후 STT/LLM 엔진으로 교체 가능하도록
 * DraftEngine 인터페이스로 추상화한다.
 */

export interface UsedPart {
  name: string;
  model?: string;
  quantity: number;
  unit: string;
}

export interface StructuredDraft {
  workSummary: string;
  actions: string[];
  usedParts: UsedPart[];
  issues: string[];
  recommendations: string[];
  nextInspectionDate: string | null;
  uncertainFields: string[];
}

export interface FieldRecordInput {
  transcript: string;
  workSummary?: string;
  parts?: UsedPart[];
  issues?: string;
  nextInspectionDate?: string | null;
}

/** 미래 STT/LLM 교체 지점 — 지금은 RuleBasedDraftEngine만 구현한다. */
export interface DraftEngine {
  generate(input: FieldRecordInput): Promise<StructuredDraft>;
}

// ---------------------------------------------------------------------------
// 내부 패턴
// ---------------------------------------------------------------------------

const SENTENCE_SPLIT_RE = /[.\n,]+/u;

const PART_WORD = "[\\p{Script=Hangul}A-Za-z0-9]+(?:\\s[\\p{Script=Hangul}A-Za-z0-9]+){0,2}";
const PART_WITH_QTY_RE = new RegExp(
  `(${PART_WORD})\\s+(\\d+)\\s*(개|EA|세트|조)(?![\\p{Script=Hangul}A-Za-z0-9])`,
  "u",
);
const PART_NO_QTY_RE = new RegExp(
  `(${PART_WORD})\\s*(?:을|를)?\\s*(?:교체|장착|보충|충전)(?:함|했|하였|완료)`,
  "u",
);

const ISSUE_RE = /마모|누수|소음|진동|불량|고장|파손|부족|오류/u;
const RECOMMEND_RE = /권장|필요함|하십시오|추천|재점검|예정/u;
const ACTION_RE = /교체|점검|청소|수리|정렬|시운전|보수|용접|급유|교정/u;

const ISO_DATE_RE = /\d{4}-\d{2}-\d{2}/u;
const RELATIVE_DATE_RE = /\d+\s*개월\s*후|다음\s*점검|\d{1,2}월\s*\d{1,2}일/u;

const HANGUL_RE = /\p{Script=Hangul}/u;
const ASCII_ALNUM_RE = /[0-9A-Za-z]/u;

function splitSentences(transcript: string): string[] {
  return transcript
    .split(SENTENCE_SPLIT_RE)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ---------------------------------------------------------------------------
// 파서
// ---------------------------------------------------------------------------

export function parseFieldNotes(input: FieldRecordInput): StructuredDraft {
  const transcript = input.transcript ?? "";
  const uncertainFields: string[] = [];

  // 1) 부품: 입력 parts는 그대로 신뢰
  const usedParts: UsedPart[] = input.parts ? [...input.parts] : [];
  /** 동일 부품 중복 방지 — 공백 제거·소문자 정규화 후 동일하거나 한쪽이 다른 쪽을 포함하면 같은 부품으로 본다. */
  const normalizePart = (name: string): string => name.replace(/\s+/gu, "").toLowerCase();
  const hasPart = (name: string): boolean => {
    const n = normalizePart(name);
    return usedParts.some((p) => {
      const e = normalizePart(p.name);
      return e === n || e.includes(n) || n.includes(e);
    });
  };

  const sentences = splitSentences(transcript);

  const actions: string[] = [];
  // 입력 issues는 그대로 신뢰 (transcript에서 감지된 문제와 별개로 유지)
  const issues: string[] = [];
  const recommendations: string[] = [];
  if (input.issues && input.issues.trim().length > 0) {
    issues.push(input.issues.trim());
  }

  for (const sentence of sentences) {
    // 부품 추출 (transcript에서 추가로)
    const qtyMatch = PART_WITH_QTY_RE.exec(sentence);
    if (qtyMatch && !hasPart(qtyMatch[1]!.trim())) {
      const name = qtyMatch[1]!.trim();
      const part: UsedPart = {
        name,
        quantity: Number(qtyMatch[2]),
        unit: qtyMatch[3]!,
      };
      usedParts.push(part);
      if (HANGUL_RE.test(name) && ASCII_ALNUM_RE.test(name)) {
        uncertainFields.push(`usedParts[${usedParts.length - 1}].model`);
      }
    } else {
      const noQtyMatch = PART_NO_QTY_RE.exec(sentence);
      if (noQtyMatch && !hasPart(noQtyMatch[1]!.trim())) {
        const name = noQtyMatch[1]!.trim();
        const part: UsedPart = { name, quantity: 1, unit: "개" };
        usedParts.push(part);
        uncertainFields.push(`usedParts[${usedParts.length - 1}].quantity`);
        if (HANGUL_RE.test(name) && ASCII_ALNUM_RE.test(name)) {
          uncertainFields.push(`usedParts[${usedParts.length - 1}].model`);
        }
      }
    }

    // 문장 분류: 권고 > 문제 > 조치
    if (RECOMMEND_RE.test(sentence)) {
      recommendations.push(sentence);
    } else if (ISSUE_RE.test(sentence)) {
      issues.push(sentence);
    } else if (ACTION_RE.test(sentence)) {
      actions.push(sentence);
    }
  }

  // 2) 다음 점검일
  let nextInspectionDate: string | null;
  if (input.nextInspectionDate !== undefined) {
    nextInspectionDate = input.nextInspectionDate;
  } else {
    const isoMatch = ISO_DATE_RE.exec(transcript);
    if (isoMatch) {
      nextInspectionDate = isoMatch[0];
    } else if (RELATIVE_DATE_RE.test(transcript)) {
      nextInspectionDate = null;
      uncertainFields.push("nextInspectionDate");
    } else {
      nextInspectionDate = null;
    }
  }

  // 3) 작업 요약
  let workSummary: string;
  if (input.workSummary && input.workSummary.trim().length > 0) {
    workSummary = input.workSummary.trim();
  } else if (sentences.length > 0) {
    workSummary = sentences[0]!;
  } else {
    workSummary = "";
    uncertainFields.push("workSummary");
  }

  return {
    workSummary,
    actions,
    usedParts,
    issues,
    recommendations,
    nextInspectionDate,
    uncertainFields,
  };
}

/** RuleBasedDraftEngine — 현재 유일한 DraftEngine 구현. 결정적, 외부 호출 없음. */
export class RuleBasedDraftEngine implements DraftEngine {
  generate(input: FieldRecordInput): Promise<StructuredDraft> {
    return Promise.resolve(parseFieldNotes(input));
  }
}
