import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import DeveloperIdentityScene from '../scenes/DeveloperIdentityScene';

const mockUseReducedMotion = jest.fn(() => false);

jest.mock('framer-motion', () => {
  const React = require('react') as typeof import('react');
  const component = (tag: 'div' | 'span') =>
    function MotionComponent({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      layoutId: _layoutId,
      whileInView: _whileInView,
      viewport: _viewport,
      ...props
    }: Record<string, unknown>) {
      return React.createElement(tag, props, children as ReactNode);
    };

  function AnimatePresence({ children }: { children: ReactNode }) {
    const [displayedChild, setDisplayedChild] = React.useState(children);

    React.useEffect(() => {
      const displayedKey = React.isValidElement(displayedChild)
        ? displayedChild.key
        : null;
      const nextKey = React.isValidElement(children) ? children.key : null;
      if (displayedKey === nextKey) return;

      const timeout = window.setTimeout(() => setDisplayedChild(children), 320);
      return () => window.clearTimeout(timeout);
    }, [children, displayedChild]);

    return displayedChild;
  }

  return {
    AnimatePresence,
    motion: { div: component('div'), span: component('span') },
    useReducedMotion: () => mockUseReducedMotion()
  };
});

beforeEach(() => mockUseReducedMotion.mockReturnValue(false));

it('introduces the approved identity with one semantic four-stage pipeline', () => {
  render(<DeveloperIdentityScene />);

  expect(
    screen.getByRole('heading', {
      level: 2,
      name: '제품의 처음과 끝을 연결하는 개발자'
    })
  ).toBeInTheDocument();
  expect(screen.getByText('Product Full-Stack Developer')).toBeInTheDocument();
  expect(screen.getByText('HOW I BUILD')).toHaveClass('text-foreground');
  expect(screen.getByText(/Active stage · 01/)).toHaveClass('text-foreground');
  expect(screen.getByText('Output')).toHaveClass('text-foreground');
  expect(
    screen.getByRole('tablist', { name: '제품 개발 단계' })
  ).toBeInTheDocument();

  const tabs = screen.getAllByRole('tab');
  expect(tabs).toHaveLength(4);
  expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  expect(tabs[0]).toHaveAttribute('tabindex', '0');
  expect(tabs[1]).toHaveAttribute('tabindex', '-1');

  const panel = screen.getByRole('tabpanel');
  expect(panel).toHaveAttribute('aria-labelledby', tabs[0].id);
  expect(panel).toHaveTextContent('문제를 제품 언어로');
  expect(panel).toHaveTextContent('명확한 MVP와 우선순위');
  expect(screen.queryByText(/21앤 \(21n\)/)).not.toBeInTheDocument();
  expect(screen.queryByText(/B2B2C/)).not.toBeInTheDocument();
});

it('changes the active workbench only after an explicit click', async () => {
  const user = userEvent.setup();
  render(<DeveloperIdentityScene />);

  await user.click(screen.getByTestId('pipeline-tab-shape'));

  const selectedTab = screen.getByTestId('pipeline-tab-shape');
  const panels = screen.getAllByRole('tabpanel');
  expect(selectedTab).toHaveAttribute('aria-selected', 'true');
  expect(panels).toHaveLength(1);
  expect(selectedTab).toHaveAttribute('aria-controls', panels[0].id);
  expect(panels[0]).toHaveAttribute('aria-labelledby', selectedTab.id);
  expect(panels[0]).toHaveTextContent('만지고 이해되는 경험으로');
  expect(panels[0]).toHaveTextContent('설명 없이도 작동하는 인터페이스');
  expect(screen.getByText('Interaction')).toBeInTheDocument();
});

it('uses automatic roving focus for arrows, Home, and End without wrapping', () => {
  render(<DeveloperIdentityScene />);

  const frame = screen.getByTestId('pipeline-tab-frame');
  const shape = screen.getByTestId('pipeline-tab-shape');
  const build = screen.getByTestId('pipeline-tab-build');
  const ship = screen.getByTestId('pipeline-tab-ship');

  frame.focus();
  fireEvent.keyDown(frame, { key: 'ArrowRight' });
  expect(shape).toHaveFocus();
  expect(shape).toHaveAttribute('aria-selected', 'true');

  fireEvent.keyDown(shape, { key: 'ArrowDown' });
  expect(build).toHaveFocus();
  expect(build).toHaveAttribute('aria-selected', 'true');

  fireEvent.keyDown(build, { key: 'End' });
  expect(ship).toHaveFocus();
  expect(ship).toHaveAttribute('aria-selected', 'true');
  const panels = screen.getAllByRole('tabpanel');
  expect(panels).toHaveLength(1);
  expect(ship).toHaveAttribute('aria-controls', panels[0].id);
  expect(panels[0]).toHaveAttribute('aria-labelledby', ship.id);
  expect(panels[0]).toHaveTextContent('배포 이후까지 운영으로');
  expect(panels[0]).toHaveTextContent('운영 가능한 릴리스와 반복');

  fireEvent.keyDown(ship, { key: 'ArrowRight' });
  expect(ship).toHaveFocus();
  expect(ship).toHaveAttribute('aria-selected', 'true');

  fireEvent.keyDown(ship, { key: 'Home' });
  expect(frame).toHaveFocus();
  fireEvent.keyDown(frame, { key: 'ArrowLeft' });
  expect(frame).toHaveFocus();
  fireEvent.keyDown(frame, { key: 'ArrowUp' });
  expect(frame).toHaveFocus();
});

it('marks the packet and workbench as native reduced-motion targets', async () => {
  mockUseReducedMotion.mockReturnValue(true);
  render(<DeveloperIdentityScene />);

  await userEvent.click(screen.getByTestId('pipeline-tab-ship'));

  for (const target of [
    screen.getByTestId('product-packet'),
    screen.getByTestId('product-workbench')
  ]) {
    expect(target).toHaveAttribute('data-reduced-motion', 'true');
    expect(target).toHaveClass('home-pipeline-reduced-static');
  }
});
