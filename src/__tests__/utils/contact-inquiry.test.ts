import {
  formatContactInquiry,
  validateContactInquiry
} from '@/utils/contact-inquiry';

const validInquiry = {
  name: '테스트 회사',
  email: 'HELLO@EXAMPLE.COM',
  projectType: '기존 제품 개선',
  budgetRange: '협의 필요',
  timeline: '일정 협의',
  requiredFeatures: '관리자 화면 개선',
  message: '',
  privacyConsent: true,
  website: ''
};

describe('contact inquiry validation', () => {
  it('trims text and normalizes email before formatting', () => {
    const result = validateContactInquiry({
      ...validInquiry,
      name: '  테스트 회사  '
    });

    expect(result.success).toBe(true);
    expect(result.inquiry).toEqual(
      expect.objectContaining({
        name: '테스트 회사',
        email: 'hello@example.com'
      })
    );
    expect(formatContactInquiry(result.inquiry!)).toContain(
      '**이메일:** hello@example.com'
    );
  });

  it('rejects non-string fields, invalid choices, and invalid email', () => {
    expect(
      validateContactInquiry({ ...validInquiry, name: { value: '회사' } })
        .success
    ).toBe(false);
    expect(
      validateContactInquiry({ ...validInquiry, projectType: '알 수 없음' })
        .success
    ).toBe(false);
    expect(
      validateContactInquiry({ ...validInquiry, email: 'invalid' }).success
    ).toBe(false);
  });

  it('enforces strict field length limits', () => {
    const result = validateContactInquiry({
      ...validInquiry,
      requiredFeatures: 'a'.repeat(4_001)
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('글자 수');
  });
});
