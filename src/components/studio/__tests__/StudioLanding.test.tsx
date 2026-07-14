import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import StudioLanding from '../StudioLanding';

jest.mock('@/components/studio/ProductShowreel', () => ({
  __esModule: true,
  default: () => (
    <section aria-label="대표 프로젝트 쇼릴">Product showreel</section>
  )
}));

jest.mock('framer-motion', () => {
  const React = require('react') as typeof import('react');
  const createMotionComponent = (tag: 'div' | 'article' | 'span') =>
    function MotionComponent({
      children,
      initial: _initial,
      animate: _animate,
      whileInView: _whileInView,
      whileHover: _whileHover,
      transition: _transition,
      viewport: _viewport,
      ...props
    }: ComponentProps<typeof tag> & {
      children?: ReactNode;
      initial?: unknown;
      animate?: unknown;
      whileInView?: unknown;
      whileHover?: unknown;
      transition?: unknown;
      viewport?: unknown;
    }) {
      return React.createElement(tag, props, children);
    };

  return {
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    motion: {
      div: createMotionComponent('div'),
      article: createMotionComponent('article'),
      span: createMotionComponent('span')
    },
    useMotionTemplate: () => 'none',
    useMotionValue: (initialValue: number) => ({
      get: () => initialValue,
      set: jest.fn()
    }),
    useReducedMotion: () => false,
    useSpring: (value: unknown) => value,
    useTransform: (value: unknown) => value
  };
});

const posts = [
  {
    title: '운영 가능한 제품을 만드는 법',
    slug: 'shipping-products',
    category: 'Projects',
    date: '2026-07-14',
    description: '설계부터 배포까지 이어지는 제품 개발 기록'
  },
  {
    title: 'Next.js 제품 구조',
    slug: 'next-product-architecture',
    category: 'Next.js',
    date: '2026-07-13'
  },
  {
    title: 'AI 자동화 운영기',
    slug: 'ai-automation',
    category: 'AI',
    date: '2026-07-12'
  }
];

it('presents a service business before the blog archive', () => {
  render(<StudioLanding projectCount={25} latestPosts={posts} />);

  expect(
    screen.getByRole('heading', {
      level: 1,
      name: '아이디어를 작동하게, 끝까지.'
    })
  ).toBeInTheDocument();
  expect(
    screen.getAllByRole('link', { name: '프로젝트 상담하기' })[0]
  ).toHaveAttribute('href', '/contact');
  expect(screen.getByRole('link', { name: '작업 사례 보기' })).toHaveAttribute(
    'href',
    '/work'
  );
  expect(screen.getAllByRole('article')).toHaveLength(4);
  expect(
    screen.getByRole('region', { name: '대표 프로젝트 쇼릴' })
  ).toBeInTheDocument();
  expect(screen.getAllByRole('img')).toHaveLength(4);
  expect(screen.getAllByText('문제')).toHaveLength(6);
  expect(screen.getByText('예쁜계약')).toBeInTheDocument();
  expect(screen.getByText('TraceDesk')).toBeInTheDocument();
  expect(
    screen.getByText('TraceDesk').closest('[data-theme="dark"]')
  ).not.toBeNull();
  expect(
    screen.getByText('devPulse').closest('[data-theme="dark"]')
  ).not.toBeNull();
  expect(screen.getAllByText('상담과 문제 정의').length).toBeGreaterThan(0);
  expect(screen.getByText('운영 가능한 제품을 만드는 법')).toBeInTheDocument();
  expect(screen.queryByText('Toris Dev Universe')).not.toBeInTheDocument();
  expect(
    screen.getByText('TORIS · Product Engineering Lab')
  ).toBeInTheDocument();
  expect(screen.getByText('Build slot · Available')).toBeInTheDocument();
  expect(screen.getByTestId('product-flow-signal')).toHaveAttribute(
    'data-brand-signature',
    't-reactor'
  );
  expect(screen.getByTestId('toris-reactor-core')).toBeInTheDocument();

  const desktopService = screen.getByRole('button', {
    name: /데스크톱·로컬 앱/
  });
  fireEvent.click(desktopService);
  expect(desktopService).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText('Tauri / Rust / React / SQLite')).toBeInTheDocument();

  const shipStep = screen.getByRole('button', {
    name: /Ship 출시와 운영/i
  });
  fireEvent.click(shipStep);
  expect(shipStep).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText('프로덕션 배포 · 운영 가이드')).toBeInTheDocument();
});
