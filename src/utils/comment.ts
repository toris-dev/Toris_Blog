// 클라이언트/서버 모두 사용 가능한 유틸리티
// bcrypt 관련 함수는 comment.server.ts에서 분리

// 입력 검증
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateAuthorId(authorId: string): ValidationResult {
  const errors: string[] = [];

  if (!authorId || authorId.trim().length === 0) {
    errors.push('작성자 ID를 입력해주세요.');
  } else if (authorId.length > 50) {
    errors.push('작성자 ID는 50자 이하여야 합니다.');
  } else if (!/^[a-zA-Z0-9가-힣_]+$/.test(authorId)) {
    errors.push('작성자 ID는 영문, 숫자, 한글, 언더스코어만 사용할 수 있습니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password || password.length === 0) {
    errors.push('비밀번호를 입력해주세요.');
  } else if (password.length < 4) {
    errors.push('비밀번호는 4자 이상이어야 합니다.');
  } else if (password.length > 50) {
    errors.push('비밀번호는 50자 이하여야 합니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateContent(content: string): ValidationResult {
  const errors: string[] = [];

  if (!content || content.trim().length === 0) {
    errors.push('댓글 내용을 입력해주세요.');
  } else if (content.length > 1000) {
    errors.push('댓글 내용은 1000자 이하여야 합니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// XSS 방지: HTML 태그 제거 및 특수 문자 이스케이프
export function sanitizeContent(content: string): string {
  // HTML 태그 제거
  let sanitized = content.replace(/<[^>]*>/g, '');
  
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

// 전체 입력 검증 (클라이언트/서버 모두 사용 가능)
export function validateCommentInput(
  authorId: string,
  password: string,
  content: string
): ValidationResult {
  const errors: string[] = [];

  const authorIdValidation = validateAuthorId(authorId);
  if (!authorIdValidation.isValid) {
    errors.push(...authorIdValidation.errors);
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  const contentValidation = validateContent(content);
  if (!contentValidation.isValid) {
    errors.push(...contentValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
