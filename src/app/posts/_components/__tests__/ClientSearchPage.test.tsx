import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import ClientSearchPage from '../ClientSearchPage';

let mockReducedMotion = false;

jest.mock('@/utils/debounce', () => ({
  debounce: (callback: (...args: unknown[]) => unknown) => {
    const immediate = (...args: unknown[]) => callback(...args);
    immediate.cancel = jest.fn();
    return immediate;
  }
}));

jest.mock('framer-motion', () => {
  const React = require('react') as typeof import('react');
  const createMotionComponent = (tag: 'div' | 'span' | 'button') =>
    function MotionComponent({
      children,
      initial,
      animate,
      exit,
      transition,
      ...props
    }: ComponentProps<typeof tag> & {
      children?: ReactNode;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
    }) {
      return React.createElement(
        tag,
        {
          ...props,
          'data-motion-initial': JSON.stringify(initial),
          'data-motion-animate': JSON.stringify(animate),
          'data-motion-exit': JSON.stringify(exit),
          'data-motion-transition': JSON.stringify(transition)
        },
        children
      );
    };

  return {
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    motion: {
      div: createMotionComponent('div'),
      span: createMotionComponent('span'),
      button: createMotionComponent('button')
    },
    useReducedMotion: () => mockReducedMotion
  };
});

const posts = [
  {
    id: 1,
    title: 'React product system',
    content: 'React와 Next.js로 운영 가능한 제품 구조를 만듭니다.',
    category: 'Technology',
    tags: ['React', 'Next.js'],
    date: '2026-07-14',
    slug: 'react-product-system',
    filePath: 'posts/react-product-system.md'
  },
  {
    id: 2,
    title: '명료한 제품 디자인',
    content: '고객의 업무 흐름을 읽는 인터페이스 설계 기록입니다.',
    category: 'Design',
    tags: ['UI', 'Research'],
    date: '2026-07-13',
    slug: 'clear-product-design',
    filePath: 'posts/clear-product-design.md'
  },
  {
    id: 3,
    title: '배포 이후의 운영',
    content: '배포와 모니터링을 하나의 개발 범위로 연결합니다.',
    category: 'Programming',
    tags: ['Operations', 'Next.js'],
    date: '2026-06-01',
    slug: 'after-shipping',
    filePath: 'posts/after-shipping.md'
  }
];

describe('ClientSearchPage', () => {
  beforeEach(() => {
    mockReducedMotion = false;
  });

  it('filters real results by search text and renders semantic highlights', async () => {
    render(<ClientSearchPage initialPosts={posts} />);

    fireEvent.change(screen.getByRole('textbox', { name: '블로그 검색어' }), {
      target: { value: 'React' }
    });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'React product system' })
      ).toBeVisible();
      expect(
        screen.queryByRole('heading', { name: '명료한 제품 디자인' })
      ).not.toBeInTheDocument();
    });
    expect(screen.getAllByText('React')[0].tagName).toBe('MARK');
  });

  it('exposes filter expansion and selected state without relying on color', async () => {
    render(<ClientSearchPage initialPosts={posts} />);

    const toggle = screen.getByRole('button', { name: '필터 보기' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'blog-search-filters');

    fireEvent.click(toggle);

    expect(screen.getByRole('button', { name: '필터 숨기기' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('group', { name: '날짜 범위' })).toBeVisible();
    expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: '최신순' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    const category = screen.getByRole('button', { name: 'Technology' });
    expect(category).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(category);

    await waitFor(() => {
      expect(category).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('1개의 검색 결과')).toBeVisible();
    });

    const tag = screen.getByRole('button', { name: 'Next.js' });
    expect(tag).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(tag);
    expect(tag).toHaveAttribute('aria-pressed', 'true');

    const oldest = screen.getByRole('button', { name: '오래된순' });
    fireEvent.click(oldest);
    expect(oldest).toHaveAttribute('aria-pressed', 'true');
  });

  it('uses static zero-duration motion paths when reduced motion is requested', () => {
    mockReducedMotion = true;
    render(<ClientSearchPage initialPosts={posts} />);

    expect(screen.getByTestId('blog-search-entry')).toHaveAttribute(
      'data-motion-initial',
      'false'
    );
    expect(screen.getByTestId('blog-search-entry')).toHaveAttribute(
      'data-motion-transition',
      JSON.stringify({ duration: 0 })
    );
    expect(screen.getByTestId('blog-search-entry')).toHaveAttribute(
      'data-motion-animate',
      JSON.stringify({ opacity: 1 })
    );
    expect(screen.getByTestId('blog-result-1')).toHaveAttribute(
      'data-motion-exit',
      JSON.stringify({ opacity: 0 })
    );
    expect(screen.getByTestId('blog-result-1')).toHaveAttribute(
      'data-motion-transition',
      JSON.stringify({ duration: 0, ease: 'easeOut' })
    );

    fireEvent.click(screen.getByRole('button', { name: '필터 보기' }));
    expect(screen.getByTestId('blog-filter-panel')).toHaveAttribute(
      'data-motion-initial',
      'false'
    );
    expect(screen.getByTestId('blog-filter-panel')).toHaveAttribute(
      'data-motion-transition',
      JSON.stringify({ duration: 0 })
    );
  });
});
