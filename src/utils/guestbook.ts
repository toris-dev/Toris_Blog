// 입력 검증
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateNickname(nickname: string): ValidationResult {
  const errors: string[] = [];

  if (!nickname || nickname.trim().length === 0) {
    errors.push('닉네임을 입력해주세요.');
  } else if (nickname.length > 30) {
    errors.push('닉네임은 30자 이하여야 합니다.');
  } else if (!/^[a-zA-Z0-9가-힣_\s]+$/.test(nickname)) {
    errors.push('닉네임은 영문, 숫자, 한글, 언더스코어, 공백만 사용할 수 있습니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateMessage(message: string): ValidationResult {
  const errors: string[] = [];

  if (!message || message.trim().length === 0) {
    errors.push('메시지를 입력해주세요.');
  } else if (message.length > 500) {
    errors.push('메시지는 500자 이하여야 합니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// 전체 입력 검증
export function validateGuestbookInput(
  nickname: string,
  message: string
): ValidationResult {
  const errors: string[] = [];

  const nicknameValidation = validateNickname(nickname);
  if (!nicknameValidation.isValid) {
    errors.push(...nicknameValidation.errors);
  }

  const messageValidation = validateMessage(message);
  if (!messageValidation.isValid) {
    errors.push(...messageValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// XSS 방지: HTML 태그 제거 및 특수 문자 이스케이프
export function sanitizeMessage(message: string): string {
  // HTML 태그 제거
  let sanitized = message.replace(/<[^>]*>/g, '');

  // 특수 문자 이스케이프
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  sanitized = sanitized.replace(/[&<>"'/]/g, (char) => escapeMap[char] || char);

  return sanitized;
}
