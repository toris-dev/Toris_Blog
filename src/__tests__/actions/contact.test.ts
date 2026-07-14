import { submitContactForm } from '@/app/actions/contact';

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

const fetchMock = jest.fn();
Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  writable: true,
  value: fetchMock
});

const validInquiry = {
  name: '테스트 회사',
  email: 'hello@example.com',
  projectType: '웹 서비스·SaaS',
  budgetRange: '1,000만–3,000만원',
  timeline: '1–3개월',
  requiredFeatures: '회원가입, 결제, 관리자 화면',
  message: '기획 초안을 보유하고 있습니다.'
};

describe('submitContactForm', () => {
  const previousToken = process.env.GITHUB_TOKEN;

  afterEach(() => {
    process.env.GITHUB_TOKEN = previousToken;
    fetchMock.mockReset();
  });

  it('requires project type, budget, timeline and requested features', async () => {
    const result = await submitContactForm({
      ...validInquiry,
      requiredFeatures: ''
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('필수 상담 정보');
  });

  it('sends the complete project brief to the private inquiry issue', async () => {
    process.env.GITHUB_TOKEN = 'test-token';
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ html_url: 'https://github.com/example' })
    });

    const result = await submitContactForm(validInquiry);
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const body = JSON.parse(String(request?.body)) as { body: string };

    expect(result.success).toBe(true);
    expect(body.body).toContain('웹 서비스·SaaS');
    expect(body.body).toContain('1,000만–3,000만원');
    expect(body.body).toContain('회원가입, 결제, 관리자 화면');
  });
});
