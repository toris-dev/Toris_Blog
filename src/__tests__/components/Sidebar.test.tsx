import { render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import Sidebar from '@/components/common/Sidebar';

let pathname = '/';

jest.mock('next/navigation', () => ({
  usePathname: () => pathname
}));

jest.mock('@/components/common/SidebarToggle', () => ({
  useSidebar: () => ({
    isOpen: false,
    toggle: jest.fn(),
    close: jest.fn()
  })
}));

jest.mock('@/components/blog/CategorySidebar', () => ({
  __esModule: true,
  default: () => <div>카테고리</div>
}));

jest.mock('framer-motion', () => {
  const React = require('react') as typeof import('react');
  const createMotionComponent = (tag: 'button' | 'div') =>
    function MotionComponent({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      whileHover: _whileHover,
      whileTap: _whileTap,
      ...props
    }: ComponentProps<typeof tag> & {
      children?: ReactNode;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      whileHover?: unknown;
      whileTap?: unknown;
    }) {
      return React.createElement(tag, props, children);
    };

  return {
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    motion: {
      button: createMotionComponent('button'),
      div: createMotionComponent('div')
    }
  };
});

describe('Sidebar route exclusions', () => {
  it.each(['/blog', '/blog/category/next-js'])(
    'does not render the legacy sidebar on %s',
    (route) => {
      pathname = route;
      const { container } = render(<Sidebar posts={[]} />);

      expect(container).toBeEmptyDOMElement();
      expect(screen.queryByLabelText('사이드바 열기')).not.toBeInTheDocument();
    }
  );

  it('keeps the legacy sidebar available on individual post routes', () => {
    pathname = '/posts/example-post';
    render(<Sidebar posts={[]} />);

    expect(screen.getByLabelText('사이드바 열기')).toBeInTheDocument();
  });
});
