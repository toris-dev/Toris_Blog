import CategorySidebar from '@/components/blog/CategorySidebar';
import type { Post } from '@/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ReactNode } from 'react';

jest.mock('framer-motion', () => {
  const React = require('react') as typeof import('react');

  function MotionDiv({
    children,
    initial: _initial,
    animate: _animate,
    exit: _exit,
    transition: _transition,
    ...props
  }: ComponentProps<'div'> & {
    children?: ReactNode;
    initial?: unknown;
    animate?: unknown;
    exit?: unknown;
    transition?: unknown;
  }) {
    return <div {...props}>{children}</div>;
  }

  return {
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    motion: { div: MotionDiv }
  };
});

it('preserves an encoded category when opening the full blog listing', async () => {
  const user = userEvent.setup();
  const category = '한글 & AI/ML';
  const posts = Array.from({ length: 6 }, (_, index) => ({
    id: index + 1,
    title: `카테고리 글 ${index + 1}`,
    slug: `category-post-${index + 1}`,
    filePath: `posts/category-post-${index + 1}.md`,
    content: '본문',
    description: '설명',
    category,
    tags: ['AI'],
    date: '2026-07-14'
  })) satisfies Post[];

  render(<CategorySidebar posts={posts} />);

  await user.click(
    await screen.findByRole('button', { name: new RegExp(category) })
  );

  expect(screen.getByRole('link', { name: '+ 1개 더 보기' })).toHaveAttribute(
    'href',
    `/blog?category=${encodeURIComponent(category)}`
  );
});
