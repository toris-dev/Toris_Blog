import { submitContactForm } from '@/app/actions/contact';

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

let clientIp = '203.0.113.1';
jest.mock('next/headers', () => ({
  headers: jest.fn(async () => ({
    get: (name: string) =>
      name === 'x-forwarded-for' ? `${clientIp}, 10.0.0.1` : null
  }))
}));

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
  message: '기획 초안을 보유하고 있습니다.',
  privacyConsent: true,
  website: ''
};

const ENV_KEYS = [
  'GITHUB_INQUIRY_TOKEN',
  'GITHUB_INQUIRY_OWNER',
  'GITHUB_INQUIRY_REPOSITORY',
  'GITHUB_INQUIRY_ISSUE_NUMBER'
] as const;

function configurePrivateDestination() {
  process.env.GITHUB_INQUIRY_TOKEN = 'test-token';
  process.env.GITHUB_INQUIRY_OWNER = 'private-owner';
  process.env.GITHUB_INQUIRY_REPOSITORY = 'private-inquiries';
  process.env.GITHUB_INQUIRY_ISSUE_NUMBER = '42';
}

function mockPrivateDelivery() {
  fetchMock
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ private: true })
    })
    .mockResolvedValueOnce({ ok: true, status: 201 });
}

describe('submitContactForm', () => {
  const previousEnv = Object.fromEntries(
    ENV_KEYS.map((key) => [key, process.env[key]])
  );
  let sequence = 0;

  beforeEach(() => {
    sequence += 1;
    clientIp = `203.0.113.${sequence}`;
    fetchMock.mockReset();
    for (const key of ENV_KEYS) delete process.env[key];
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    for (const key of ENV_KEYS) {
      const value = previousEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('requires all project details and explicit consultation-data consent', async () => {
    const missingFeatures = await submitContactForm({
      ...validInquiry,
      requiredFeatures: ''
    });
    const missingConsent = await submitContactForm({
      ...validInquiry,
      privacyConsent: false
    });

    expect(missingFeatures.success).toBe(false);
    expect(missingFeatures.message).toContain('필수 상담 정보');
    expect(missingConsent.success).toBe(false);
    expect(missingConsent.message).toContain('동의');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails closed when the private destination is not fully configured', async () => {
    process.env.GITHUB_INQUIRY_TOKEN = 'test-token';

    const result = await submitContactForm(validInquiry);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Server configuration error');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses to post unless repository metadata proves it is private', async () => {
    configurePrivateDestination();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ private: false })
    });

    const result = await submitContactForm(validInquiry);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Destination is not private');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/private-owner/private-inquiries',
      expect.objectContaining({ method: 'GET', cache: 'no-store' })
    );
  });

  it('verifies the configured repository before posting the sanitized brief', async () => {
    configurePrivateDestination();
    mockPrivateDelivery();

    const result = await submitContactForm({
      ...validInquiry,
      name: '  테스트 회사  '
    });
    const postRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;
    const payload = JSON.parse(String(postRequest.body)) as { body: string };

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ method: 'GET' })
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://api.github.com/repos/private-owner/private-inquiries/issues/42/comments'
    );
    expect(postRequest.method).toBe('POST');
    expect(payload.body).toContain('**이름:** 테스트 회사');
    expect(payload.body).toContain('회원가입, 결제, 관리자 화면');
    expect(result).not.toHaveProperty('commentUrl');
  });

  it('blocks a honeypot submission before any network request', async () => {
    configurePrivateDestination();

    const result = await submitContactForm({
      ...validInquiry,
      website: 'https://spam.example'
    });

    expect(result.success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('best-effort limits repeated requests from one client', async () => {
    configurePrivateDestination();
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === 'GET'
        ? { ok: true, status: 200, json: async () => ({ private: true }) }
        : { ok: true, status: 201 }
    );

    expect((await submitContactForm(validInquiry)).success).toBe(true);
    expect((await submitContactForm(validInquiry)).success).toBe(true);
    expect((await submitContactForm(validInquiry)).success).toBe(true);
    const limited = await submitContactForm(validInquiry);

    expect(limited.success).toBe(false);
    expect(limited.error).toBe('Rate limited');
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
});
