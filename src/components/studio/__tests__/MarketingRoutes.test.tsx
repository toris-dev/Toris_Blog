import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { submitContactForm } from '@/app/actions/contact';
import ContactPage from '@/app/contact/page';
import ProcessPage from '@/app/process/page';
import ServicesPage from '@/app/services/page';
import WorkPage from '@/app/work/page';

jest.mock('@/app/actions/contact', () => ({
  submitContactForm: jest.fn()
}));

jest.mock('@/utils/markdown', () => ({
  getPostData: () => [],
  getPostsByCategory: () => []
}));

jest.mock('@/app/posts/_components/ClientSearchPage', () => ({
  __esModule: true,
  default: () => {
    const { StudioStage } = jest.requireActual(
      '@/components/studio/StudioShell'
    );
    return <StudioStage aria-label="블로그 검색 도구">검색 도구</StudioStage>;
  }
}));

jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: {
    p: ({ children, ...props }: { children?: ReactNode }) => (
      <p {...props}>{children}</p>
    )
  },
  useReducedMotion: () => true
}));

jest.mock('@/components/studio/StudioLanding', () => {
  const actual = jest.requireActual('@/components/studio/StudioLanding');
  const { StudioCanvas, StudioStage } = jest.requireActual(
    '@/components/studio/StudioShell'
  );

  return {
    ...actual,
    ServicesSection: () => (
      <StudioStage aria-label="서비스 상세">서비스 상세</StudioStage>
    ),
    WorkSection: () => (
      <StudioCanvas aria-label="작업 사례 상세">작업 사례 상세</StudioCanvas>
    ),
    ProcessSection: () => (
      <StudioStage aria-label="진행 방식 상세">진행 방식 상세</StudioStage>
    ),
    StudioRouteFooterCta: () => <a href="/contact">프로젝트 상담하기</a>
  };
});

describe('TORIS marketing routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [ServicesPage, '화면만이 아니라 운영되는 제품을 만듭니다.'],
    [WorkPage, '만든 기술보다 바꾼 흐름을 보여드립니다.'],
    [ProcessPage, '빠르게 만들되 결정은 생략하지 않습니다.']
  ])(
    'keeps one route heading and shared canvas/stage surfaces',
    (Page, title) => {
      const { container } = render(<Page />);

      expect(
        screen.getByRole('heading', { level: 1, name: title })
      ).toBeVisible();
      expect(
        screen.getByRole('link', { name: '프로젝트 상담하기' })
      ).toHaveAttribute('href', '/contact');
      expect(container.querySelector('.toris-studio')).toBeInTheDocument();
      expect(
        container.querySelector('[data-toris-surface="canvas"]')
      ).toHaveClass('bg-[var(--toris-canvas)]');
    }
  );

  it('preserves the consultation fields and deliberate surface transition', () => {
    const { container } = render(<ContactPage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '만들고 싶은 제품을 함께 정리해 봅시다.'
      })
    ).toBeVisible();
    expect(screen.getByLabelText('개발 유형')).toBeRequired();
    expect(screen.getByLabelText('예산 범위')).toBeRequired();
    expect(screen.getByLabelText('희망 일정')).toBeRequired();
    expect(screen.getByLabelText('필요한 기능')).toBeRequired();
    expect(
      screen.getByLabelText('상담 정보 처리 안내를 확인했으며 이에 동의합니다.')
    ).toBeRequired();
    expect(screen.getByText(/필요한 기간 동안만 보관/)).toBeVisible();
    expect(
      screen.getByRole('button', { name: '프로젝트 상담 요청하기' })
    ).toHaveClass('min-h-12');
    expect(
      container.querySelector('[data-toris-surface="stage"]')
    ).toHaveAttribute('data-toris-theme', 'dark');
  });

  it('submits the consultation payload, shows success, and resets fields', async () => {
    const payload = {
      name: '토리스 상사',
      email: 'owner@example.com',
      projectType: '기존 제품 개선',
      budgetRange: '1,000만–3,000만원',
      timeline: '1–3개월',
      requiredFeatures: '관리자 화면과 결제 흐름 개선',
      message: '기존 서비스 운영 중입니다.',
      privacyConsent: true,
      website: ''
    };
    (submitContactForm as jest.Mock).mockResolvedValueOnce({
      success: true,
      message: '상담 요청을 받았습니다.'
    });
    render(<ContactPage />);

    fireEvent.change(screen.getByLabelText('이름 또는 회사명'), {
      target: { value: payload.name }
    });
    fireEvent.change(screen.getByLabelText('회신 이메일'), {
      target: { value: payload.email }
    });
    fireEvent.change(screen.getByLabelText('개발 유형'), {
      target: { value: payload.projectType }
    });
    fireEvent.change(screen.getByLabelText('예산 범위'), {
      target: { value: payload.budgetRange }
    });
    fireEvent.change(screen.getByLabelText('희망 일정'), {
      target: { value: payload.timeline }
    });
    fireEvent.change(screen.getByLabelText('필요한 기능'), {
      target: { value: payload.requiredFeatures }
    });
    fireEvent.change(screen.getByLabelText('현재 상황과 참고 사항 (선택)'), {
      target: { value: payload.message }
    });
    fireEvent.click(
      screen.getByLabelText('상담 정보 처리 안내를 확인했으며 이에 동의합니다.')
    );
    fireEvent.submit(screen.getByRole('form', { name: '프로젝트 상담 양식' }));

    expect(submitContactForm).toHaveBeenCalledWith(payload);
    expect(await screen.findByRole('status')).toHaveTextContent(
      '상담 요청을 받았습니다.'
    );
    expect(screen.getByLabelText('이름 또는 회사명')).toHaveValue('');
    expect(screen.getByLabelText('개발 유형')).toHaveValue('');
    expect(screen.getByLabelText('필요한 기능')).toHaveValue('');
  });

  it('keeps consultation error feedback visible', async () => {
    (submitContactForm as jest.Mock).mockResolvedValueOnce({
      success: false,
      message: '상담 요청 전송에 실패했습니다.'
    });
    render(<ContactPage />);

    fireEvent.submit(screen.getByRole('form', { name: '프로젝트 상담 양식' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      '상담 요청 전송에 실패했습니다.'
    );
  });

  it('frames the blog entry with the same studio canvas', async () => {
    const { default: BlogPage } = await import('@/app/blog/page');
    const view = await BlogPage({ searchParams: Promise.resolve({}) });
    const { container } = render(view);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '만들고 운영하며 남긴 판단을 공유합니다.'
      })
    ).toBeVisible();
    expect(
      screen.getByRole('region', { name: '블로그 검색 도구' })
    ).toBeVisible();
    expect(
      screen.getByRole('region', { name: '블로그 검색 도구' })
    ).toHaveAttribute('data-toris-theme', 'dark');
    expect(container.querySelector('.toris-studio')).toBeInTheDocument();
    expect(
      container.querySelector('[data-toris-surface="canvas"]')
    ).toHaveAttribute('data-toris-theme', 'light');
  });
});
