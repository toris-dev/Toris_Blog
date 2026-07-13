import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import FinalCtaScene from '../scenes/FinalCtaScene';
import { SceneHeading } from '../ui';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: ReactNode }) => (
      <div {...props}>{children}</div>
    )
  },
  useReducedMotion: () => false
}));

it('keeps Korean scene headings and descriptions on semantic word boundaries', () => {
  render(
    <SceneHeading
      eyebrow="Personal Projects"
      title="25개의 개인 프로젝트, 직접 만든 것들"
      description="여행 플랫폼부터 Web3까지 — 아이디어를 실제 제품으로 옮긴 기록."
    />
  );

  expect(
    screen.getByRole('heading', {
      level: 2,
      name: '25개의 개인 프로젝트, 직접 만든 것들'
    })
  ).toHaveClass('break-keep', 'text-balance');
  expect(
    screen.getByText(
      '여행 플랫폼부터 Web3까지 — 아이디어를 실제 제품으로 옮긴 기록.'
    )
  ).toHaveClass('break-keep', 'text-pretty');
});

it('balances the final portfolio statement without splitting Korean words', () => {
  render(<FinalCtaScene />);

  expect(screen.getByRole('heading', { level: 2 })).toHaveClass(
    'break-keep',
    'text-balance'
  );
});
