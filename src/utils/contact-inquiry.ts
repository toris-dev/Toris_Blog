export const PROJECT_TYPES = [
  '웹 서비스·SaaS',
  '모바일 앱',
  '데스크톱 앱',
  'MVP·프로토타입',
  'AI·업무 자동화',
  '기존 제품 개선'
] as const;

export const BUDGET_RANGES = [
  '500만원 미만',
  '500만–1,000만원',
  '1,000만–3,000만원',
  '3,000만원 이상',
  '협의 필요'
] as const;

export const TIMELINES = [
  '1개월 이내',
  '1–3개월',
  '3–6개월',
  '일정 협의'
] as const;

export interface ContactFormData {
  name: string;
  email: string;
  projectType: string;
  budgetRange: string;
  timeline: string;
  requiredFeatures: string;
  message: string;
  privacyConsent: boolean;
  website: string;
}

export interface ContactInquiryValidationResult {
  success: boolean;
  inquiry?: ContactFormData;
  message?: string;
}

const FIELD_LIMITS = {
  name: 120,
  email: 254,
  projectType: 80,
  budgetRange: 80,
  timeline: 80,
  requiredFeatures: 4_000,
  message: 4_000,
  website: 240
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

function isWithinLimit(
  value: string,
  field: keyof typeof FIELD_LIMITS
): boolean {
  return value.length <= FIELD_LIMITS[field];
}

export function validateContactInquiry(
  input: unknown
): ContactInquiryValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { success: false, message: '상담 정보 형식을 확인해 주세요.' };
  }

  const raw = input as Record<string, unknown>;
  const name = cleanText(raw.name);
  const email = cleanText(raw.email)?.toLowerCase() ?? null;
  const projectType = cleanText(raw.projectType);
  const budgetRange = cleanText(raw.budgetRange);
  const timeline = cleanText(raw.timeline);
  const requiredFeatures = cleanText(raw.requiredFeatures);
  const message = cleanText(raw.message);
  const website = cleanText(raw.website);

  if (
    name === null ||
    email === null ||
    projectType === null ||
    budgetRange === null ||
    timeline === null ||
    requiredFeatures === null ||
    message === null ||
    website === null ||
    typeof raw.privacyConsent !== 'boolean'
  ) {
    return { success: false, message: '상담 정보 형식을 확인해 주세요.' };
  }

  if (website) {
    return { success: false, message: '상담 요청을 전송하지 못했습니다.' };
  }

  if (
    !name ||
    !email ||
    !projectType ||
    !budgetRange ||
    !timeline ||
    !requiredFeatures
  ) {
    return { success: false, message: '필수 상담 정보를 모두 입력해 주세요.' };
  }

  if (
    !isWithinLimit(name, 'name') ||
    !isWithinLimit(email, 'email') ||
    !isWithinLimit(projectType, 'projectType') ||
    !isWithinLimit(budgetRange, 'budgetRange') ||
    !isWithinLimit(timeline, 'timeline') ||
    !isWithinLimit(requiredFeatures, 'requiredFeatures') ||
    !isWithinLimit(message, 'message') ||
    !isWithinLimit(website, 'website')
  ) {
    return { success: false, message: '입력 가능한 글자 수를 초과했습니다.' };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return {
      success: false,
      message: '회신 가능한 이메일 주소를 입력해 주세요.'
    };
  }

  if (!(PROJECT_TYPES as readonly string[]).includes(projectType)) {
    return { success: false, message: '유효한 개발 유형을 선택해 주세요.' };
  }

  if (!(BUDGET_RANGES as readonly string[]).includes(budgetRange)) {
    return { success: false, message: '유효한 예산 범위를 선택해 주세요.' };
  }

  if (!(TIMELINES as readonly string[]).includes(timeline)) {
    return { success: false, message: '유효한 희망 일정을 선택해 주세요.' };
  }

  if (!raw.privacyConsent) {
    return { success: false, message: '상담 정보 처리에 동의해 주세요.' };
  }

  return {
    success: true,
    inquiry: {
      name,
      email,
      projectType,
      budgetRange,
      timeline,
      requiredFeatures,
      message,
      privacyConsent: true,
      website: ''
    }
  };
}

export function formatContactInquiry(inquiry: ContactFormData): string {
  return `## 새로운 프로젝트 상담

**이름:** ${inquiry.name}
**이메일:** ${inquiry.email}
**개발 유형:** ${inquiry.projectType}
**예산 범위:** ${inquiry.budgetRange}
**희망 일정:** ${inquiry.timeline}

### 필요한 기능
${inquiry.requiredFeatures}

### 현재 상황과 참고 사항
${inquiry.message || '별도 참고 사항 없음'}

---
*이 내용은 TORIS 프로젝트 상담 양식을 통해 전달되었습니다.*`;
}
