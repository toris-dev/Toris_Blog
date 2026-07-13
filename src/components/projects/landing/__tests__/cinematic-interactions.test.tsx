import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { CinematicLanding } from '../cinematic';
import { projects } from '@/data/projects';

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

  fireEvent.error(
    screen.getByRole('img', { name: '검증용 프로젝트 화면' })
  );

  expect(
    screen.getByRole('img', {
      name: '검증용 프로젝트 화면 이미지 대체 그래픽'
    })
  ).toBeInTheDocument();
});
