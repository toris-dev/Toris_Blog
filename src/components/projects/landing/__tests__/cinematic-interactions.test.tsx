import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ReactNode } from 'react';
import Apps21nLanding from '../21nAppsLanding';
import BubbleBibleLanding from '../BubbleBibleLanding';
import { CinematicLanding } from '../cinematic';
import DongnePaintLanding from '../DongnePaintLanding';
import SnapMateLanding from '../SnapMateLanding';
import StarlightGreenhouseLanding from '../StarlightGreenhouseLanding';
import YouthMoneyGuideLanding from '../YouthMoneyGuideLanding';
import { getProject, projects } from '@/data/projects';

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
      className
    }: {
      children: ReactNode;
      className?: string;
    }) => <div className={className}>{children}</div>
  },
  useReducedMotion: () => false
}));

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
        ink: '#FFFFFF',
        muted: '#A5B4CF',
        accent: '#7C5CFC',
        accent2: '#74D9E8'
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

  await userEvent.click(screen.getByTestId('snap-shutter'));

  expect(screen.getByRole('status')).toHaveTextContent('우리 갤러리에 저장됨');
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

it('completes a reading and unlocks sharing', async () => {
  const user = userEvent.setup();
  render(<BubbleBibleLanding project={getProject('bubble-bible')!} />);
  const share = screen.getByRole('button', { name: '소그룹에 나누기' });

  expect(share).toBeDisabled();

  await user.click(screen.getByTestId('bible-complete'));

  expect(screen.getByRole('status')).toHaveTextContent(
    '오늘의 읽기 완료 · 7일 연속'
  );
  expect(share).toBeEnabled();
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

  expect(screen.getByRole('status')).toHaveTextContent(
    '경로를 출발 영역에 연결하세요'
  );
  expect(screen.queryAllByLabelText('확보한 타일')).toHaveLength(0);
});

it('scans youth money policy conditions and shows source metadata', async () => {
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

  await userEvent.selectOptions(screen.getByLabelText('지역'), '서울');
  await userEvent.click(screen.getByTestId('policy-scan'));

  const result = screen.getByRole('status');
  expect(result).toHaveTextContent('조건에 맞는 정책 카드');
  expect(within(result).getByText('공식 출처 확인')).toBeInTheDocument();
  expect(within(result).getByText('검토일 표시')).toBeInTheDocument();
  expect(result).toHaveTextContent('실제 신청 전 원문을 확인하세요');
});
