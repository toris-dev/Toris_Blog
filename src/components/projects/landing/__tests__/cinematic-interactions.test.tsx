import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ReactNode } from 'react';
import Apps21nLanding from '../21nAppsLanding';
import BubbleBibleLanding from '../BubbleBibleLanding';
import { CinematicLanding } from '../cinematic';
import DongnePaintLanding from '../DongnePaintLanding';
import ProductGrowthSkillsLanding from '../ProductGrowthSkillsLanding';
import SnapMateLanding from '../SnapMateLanding';
import StarlightGreenhouseLanding from '../StarlightGreenhouseLanding';
import TorisDocsLanding from '../TorisDocsLanding';
import VolleyKingLanding from '../VolleyKingLanding';
import YouthMoneyGuideLanding from '../YouthMoneyGuideLanding';
import { getProject, projects } from '@/data/projects';

const mockUseReducedMotion = jest.fn(() => false);

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, ...props }: ComponentProps<'img'> & { fill?: boolean }) => {
    void fill;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  }
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      initial: _initial,
      animate: _animate,
      transition: _transition,
      whileInView: _whileInView,
      viewport: _viewport,
      ...props
    }: {
      children: ReactNode;
      className?: string;
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
      whileInView?: unknown;
      viewport?: unknown;
      [key: string]: unknown;
    }) => (
      <div className={className} {...props}>
        {children}
      </div>
    )
  },
  useReducedMotion: () => mockUseReducedMotion()
}));

beforeEach(() => {
  mockUseReducedMotion.mockReturnValue(false);
});

it('renders an accessible cinematic shell with CTA and signature', () => {
  render(
    <CinematicLanding
      project={projects[0]}
      eyebrow="TEST LAB"
      title="대표 행동"
      thesis="문제를 짧게 설명합니다."
      theme={{
        background: '#0B1026',
        surface: '#151B35',
        pageInk: '#FFFFFF',
        pageMuted: '#A5B4CF',
        surfaceInk: '#FFFFFF',
        surfaceMuted: '#A5B4CF',
        accent: '#7C5CFC',
        accent2: '#74D9E8',
        primaryBackground: '#5B3CC4',
        primaryInk: '#FFFFFF'
      }}
      proof={['검증된 흐름', '접근 가능한 조작']}
      signature={<button type="button">인터랙션 실행</button>}
      gallery={[
        {
          src: '/missing-project-image.png',
          alt: '검증용 프로젝트 화면'
        }
      ]}
    />
  );

  expect(screen.getByTestId('cinematic-project')).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { level: 1, name: '대표 행동' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: '인터랙션 실행' })
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /프로젝트 보기/i })).toHaveAttribute(
    'href',
    projects[0].github
  );
  expect(screen.getByText(projects[0].features[0].title)).toBeInTheDocument();
  expect(screen.getByText(projects[0].tech[0])).toBeInTheDocument();

  const primary = screen.getByRole('link', { name: /프로젝트 보기/i });
  primary.focus();
  expect(primary).toHaveFocus();
  expect(primary.className).toContain('focus-visible:');

  const proofLink = screen.getByRole('link', { name: '설계 근거' });
  expect(proofLink).toHaveAttribute('href', '#proof');
  expect(proofLink).toHaveStyle({ color: 'var(--cinema-page-ink)' });
  expect(document.getElementById('proof')).toBeInTheDocument();

  fireEvent.error(screen.getByRole('img', { name: '검증용 프로젝트 화면' }));

  expect(
    screen.getByRole('img', {
      name: '검증용 프로젝트 화면 이미지 대체 그래픽'
    })
  ).toBeInTheDocument();
});

it('advances the 21n contract to completion and resets the flow', async () => {
  const user = userEvent.setup();
  render(<Apps21nLanding project={getProject('21n-apps')!} />);
  const advance = screen.getByTestId('contract-advance');

  expect(
    screen.getByRole('link', { name: 'GitHub 프로필 보기' })
  ).toHaveAttribute('href', 'https://github.com/toris-dev');

  expect(document.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
  await user.click(advance);
  await user.click(advance);
  await user.click(advance);

  expect(screen.getByText('체결 완료')).toHaveAttribute('aria-current', 'step');
  expect(document.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
  expect(advance).toHaveTextContent('계약 흐름 다시 보기');

  await user.click(advance);

  expect(screen.getByText('계약 초안')).toHaveAttribute('aria-current', 'step');
  expect(document.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
});

it('develops a SnapMate photo into the group gallery', async () => {
  render(<SnapMateLanding project={getProject('snapmate')!} />);

  const signature = screen.getByRole('region', {
    name: 'SnapMate 촬영 데모'
  });
  expect(
    within(signature).getByRole('img', {
      name: 'SnapMate 카메라에서 촬영할 순간을 확인하는 화면'
    })
  ).toBeInTheDocument();

  await userEvent.click(screen.getByTestId('snap-shutter'));

  expect(screen.getByRole('status').textContent).toBe('우리 갤러리에 저장됨');
  expect(
    within(signature).getByRole('img', {
      name: 'SnapMate에서 현상된 사진을 확인하는 그룹 갤러리 화면'
    })
  ).toBeInTheDocument();
  expect(
    within(signature).queryByRole('img', {
      name: 'SnapMate 카메라에서 촬영할 순간을 확인하는 화면'
    })
  ).not.toBeInTheDocument();

  fireEvent.error(
    within(signature).getByRole('img', {
      name: 'SnapMate에서 현상된 사진을 확인하는 그룹 갤러리 화면'
    })
  );
  expect(
    within(signature).getByRole('img', {
      name: 'SnapMate에서 현상된 사진을 확인하는 그룹 갤러리 화면 이미지 대체 그래픽'
    })
  ).toBeInTheDocument();
});

it('keeps the SnapMate photo card static when reduced motion is requested', async () => {
  mockUseReducedMotion.mockReturnValue(true);
  render(<SnapMateLanding project={getProject('snapmate')!} />);

  await userEvent.click(screen.getByTestId('snap-shutter'));

  const card = screen.getByTestId('snap-photo-card');
  expect(card).toHaveAttribute('data-reduced-motion', 'true');
  expect(card.className).not.toMatch(/translate|rotate/);
});

it('grows a seed and unlocks production', async () => {
  const user = userEvent.setup();
  render(
    <StarlightGreenhouseLanding project={getProject('starlight-greenhouse')!} />
  );
  const grow = screen.getByTestId('seed-grow');

  expect(screen.getByRole('status')).toHaveTextContent('별가루 0');
  await user.click(grow);
  await user.click(grow);

  expect(screen.getByRole('status')).toHaveTextContent('별가루 2');
  expect(screen.queryByText('초당 +1')).not.toBeInTheDocument();

  await user.click(grow);

  expect(screen.getByRole('status')).toHaveTextContent(
    '별가루 3 · 새싹 조명 해금'
  );
  expect(screen.getByText('초당 +1')).toBeInTheDocument();
  expect(screen.getByText('오프라인 보상 최대 8시간')).toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: '별빛 온실 앱 아이콘' })
  ).toBeInTheDocument();

  await user.click(grow);
  expect(screen.getByRole('status')).toHaveTextContent(
    '별가루 3 · 새싹 조명 해금'
  );

  await user.click(screen.getByRole('button', { name: '초기화' }));
  expect(screen.getByRole('status')).toHaveTextContent('별가루 0');
  expect(screen.queryByText('초당 +1')).not.toBeInTheDocument();
});

it('exposes receive, set, and spike in order, then resets the rally', async () => {
  const user = userEvent.setup();
  render(<VolleyKingLanding project={getProject('volley-king-30')!} />);
  const hit = screen.getByTestId('volley-hit');
  const status = screen.getByRole('status');

  expect(screen.getByText('00:30')).toBeInTheDocument();
  expect(hit).toHaveTextContent('리시브');
  expect(status).toHaveTextContent('COMBO 0');

  await user.click(hit);
  expect(hit).toHaveTextContent('토스');
  expect(status).toHaveTextContent('COMBO 1');

  await user.click(hit);
  expect(hit).toHaveTextContent('스파이크');
  expect(status).toHaveTextContent('COMBO 2');

  await user.click(hit);
  expect(hit).toHaveTextContent('다시 랠리');
  expect(status).toHaveTextContent('NICE SPIKE · COMBO 3');

  await user.click(hit);
  expect(hit).toHaveTextContent('리시브');
  expect(status).toHaveTextContent('COMBO 0');
});

it('completes a reading and prepares a local small-group share card', async () => {
  const user = userEvent.setup();
  render(<BubbleBibleLanding project={getProject('bubble-bible')!} />);
  const share = screen.getByRole('button', { name: '소그룹에 나누기' });

  expect(share).toBeDisabled();
  expect(screen.getByRole('status').textContent).toBe('읽기 전');

  await user.click(screen.getByTestId('bible-complete'));

  expect(screen.getByRole('status').textContent).toBe(
    '오늘의 읽기 완료 · 7일 연속'
  );
  expect(share).toBeEnabled();

  await user.click(share);

  expect(screen.getByRole('status').textContent).toBe(
    '소그룹 나눔 카드 준비 완료'
  );
});

it('closes a trail and captures territory', async () => {
  const user = userEvent.setup();
  render(<DongnePaintLanding project={getProject('dongne-paint')!} />);

  const cells = screen.getAllByLabelText(/^(빈|경로|확보한) 타일$/);
  expect(cells).toHaveLength(25);
  expect(
    cells
      .map((cell, index) =>
        cell.getAttribute('aria-label') === '경로 타일' ? index : -1
      )
      .filter((index) => index >= 0)
  ).toEqual([6, 7, 8, 11, 13, 16, 17, 18]);

  const capture = screen.getByTestId('territory-capture');
  expect(capture).toHaveAccessibleName('경로 닫기');
  await user.click(capture);

  expect(screen.getByRole('status')).toHaveTextContent('영역 9칸 확보');
  expect(screen.getAllByLabelText('확보한 타일')).toHaveLength(9);
  expect(capture).toHaveAccessibleName('다시 칠하기');

  await user.click(capture);

  expect(capture).toHaveAccessibleName('경로 닫기');
  expect(screen.getByRole('status').textContent).toBe(
    '경로를 출발 영역에 연결하세요'
  );
  expect(screen.queryAllByLabelText('확보한 타일')).toHaveLength(0);
  expect(screen.getAllByLabelText('경로 타일')).toHaveLength(8);
});

it('scans controlled youth policy criteria and shows official source metadata', async () => {
  render(<YouthMoneyGuideLanding project={getProject('youth-money-guide')!} />);

  expect(
    within(screen.getByLabelText('나이대'))
      .getAllByRole('option')
      .map((option) => option.textContent)
  ).toEqual(['19–24', '25–29', '30–34']);
  expect(
    within(screen.getByLabelText('지역'))
      .getAllByRole('option')
      .map((option) => option.textContent)
  ).toEqual(['전국', '서울', '경기']);
  expect(
    within(screen.getByLabelText('관심사'))
      .getAllByRole('option')
      .map((option) => option.textContent)
  ).toEqual(['주거', '일자리', '생활비']);

  await userEvent.selectOptions(screen.getByLabelText('나이대'), '30–34');
  await userEvent.selectOptions(screen.getByLabelText('지역'), '경기');
  await userEvent.selectOptions(screen.getByLabelText('관심사'), '생활비');
  await userEvent.click(screen.getByTestId('policy-scan'));

  const result = screen.getByRole('status');
  expect(result).toHaveTextContent('조건에 맞는 정책 카드');
  expect(result).toHaveTextContent('나이대 30–34');
  expect(result).toHaveTextContent('지역 경기');
  expect(result).toHaveTextContent('관심사 생활비');
  expect(result).toHaveTextContent('검토일 2026.07.13');
  expect(
    within(result).getByRole('link', { name: '온통청년 정책 통합검색' })
  ).toHaveAttribute(
    'href',
    'https://www.youthcenter.go.kr/youthPolicy/ythPlcyTotalSearch'
  );
  expect(
    within(result).getByRole('link', { name: '온통청년 정책 통합검색' })
  ).toHaveAttribute('target', '_blank');
  expect(
    within(result).getByRole('link', { name: '온통청년 정책 통합검색' })
  ).toHaveAttribute('rel', 'noopener noreferrer');
  expect(result).toHaveTextContent('실제 신청 전 원문을 확인하세요');
});

it('connects generic knowledge areas without exposing private notes', async () => {
  render(<TorisDocsLanding project={getProject('toris-docs')!} />);

  expect(
    screen.getAllByRole('button').map((button) => button.textContent)
  ).toEqual(['INBOX', 'PROJECTS', 'WIKI', 'OUTPUT']);

  await userEvent.click(screen.getByTestId('knowledge-node-projects'));

  expect(screen.getByRole('status')).toHaveTextContent(
    'PROJECTS → WIKI → OUTPUT 연결'
  );
  expect(document.body.textContent).not.toMatch(
    /업무 일지|회의록|2026-\d{2}-\d{2}/
  );
});

it('routes every growth goal to its verified skill', async () => {
  const user = userEvent.setup();
  const routes = [
    ['검색 노출 개선', 'seo-geo-optimizer'],
    ['스토어 등록 준비', 'app-store-listing-creator'],
    ['Expo 인터랙션', 'expo-interactive-design'],
    ['Flutter 인터랙션', 'flutter-interactive-design'],
    ['Expo Android 성능', 'expo-android-performance'],
    ['Flutter Android 성능', 'flutter-android-performance']
  ] as const;

  render(
    <ProductGrowthSkillsLanding
      project={getProject('product-growth-skills')!}
    />
  );

  const buttons = routes.map(([goal]) =>
    screen.getByRole('button', { name: goal })
  );

  expect(buttons[0]).toHaveAttribute('data-testid', 'skill-goal-search');
  expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('status')).toHaveTextContent('seo-geo-optimizer');

  for (const [index, [, skill]] of routes.entries()) {
    await user.click(buttons[index]);

    expect(buttons[index]).toHaveAttribute('aria-pressed', 'true');
    expect(
      buttons.filter((button) => button.getAttribute('aria-pressed') === 'true')
    ).toHaveLength(1);
    expect(
      within(screen.getByRole('status')).getByText(skill)
    ).toHaveTextContent(new RegExp(`^${skill}$`));
    expect(screen.getByRole('status')).toHaveTextContent(
      '증거 수집 → 실행 → 검증'
    );
  }
});
