import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import ProductShowreel from '../ProductShowreel';

jest.mock('framer-motion', () => {
  const React = require('react') as typeof import('react');
  const createMotionComponent = (tag: 'div' | 'span') =>
    function MotionComponent({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      layoutId: _layoutId,
      style: _style,
      ...props
    }: ComponentProps<typeof tag> & {
      children?: ReactNode;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
      layoutId?: string;
    }) {
      return React.createElement(tag, props, children);
    };

  const motionValue = () => ({ set: jest.fn() });

  return {
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    motion: {
      div: createMotionComponent('div'),
      span: createMotionComponent('span')
    },
    useMotionValue: motionValue,
    useReducedMotion: () =>
      Boolean(
        (
          globalThis as typeof globalThis & {
            __productShowreelReducedMotion?: boolean;
          }
        ).__productShowreelReducedMotion
      ),
    useSpring: (value: unknown) => value
  };
});

beforeEach(() => {
  (
    globalThis as typeof globalThis & {
      __productShowreelReducedMotion?: boolean;
    }
  ).__productShowreelReducedMotion = false;
});

it('switches the visible product when a project tab is selected', () => {
  render(<ProductShowreel />);

  expect(
    screen.getByRole('img', { name: '예쁜계약 프로젝트 화면' })
  ).toHaveAttribute('src', '/images/projects/21n-apps/graphic.png');

  const firstTab = screen.getByRole('tab', { name: /예쁜계약/ });
  const snapMateTab = screen.getByRole('tab', { name: /SnapMate/ });
  expect(firstTab).toHaveAttribute('tabindex', '0');
  expect(snapMateTab).toHaveAttribute('tabindex', '-1');
  expect(firstTab).toHaveAttribute('aria-controls', 'showreel-panel-21n-apps');
  expect(screen.getByRole('tabpanel')).toHaveAttribute(
    'aria-labelledby',
    'showreel-tab-21n-apps'
  );
  fireEvent.keyDown(firstTab, { key: 'ArrowRight' });

  expect(snapMateTab).toHaveAttribute('aria-selected', 'true');
  expect(snapMateTab).toHaveAttribute('tabindex', '0');
  expect(snapMateTab).toHaveFocus();
  expect(
    screen.getByRole('img', {
      name: 'SnapMate 프로젝트 화면'
    })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'SnapMate 프로젝트 보기' })
  ).toHaveAttribute('href', '/projects/snapmate');
});

it('supports Home, End, and vertical arrow keys with roving focus', () => {
  render(<ProductShowreel />);

  const tabs = screen.getAllByRole('tab');
  fireEvent.keyDown(tabs[0], { key: 'End' });
  expect(tabs.at(-1)).toHaveAttribute('aria-selected', 'true');
  expect(tabs.at(-1)).toHaveFocus();

  fireEvent.keyDown(tabs.at(-1)!, { key: 'ArrowDown' });
  expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  expect(tabs[0]).toHaveFocus();

  fireEvent.keyDown(tabs[0], { key: 'Home' });
  expect(tabs[0]).toHaveFocus();

  expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(4);
});

it('renders the active indicator statically when reduced motion is requested', () => {
  (
    globalThis as typeof globalThis & {
      __productShowreelReducedMotion?: boolean;
    }
  ).__productShowreelReducedMotion = true;

  const { container } = render(<ProductShowreel />);

  expect(
    container.querySelector('[data-reduced-motion="true"]')
  ).toBeInTheDocument();
  expect(
    container.querySelector('[data-reduced-motion="false"]')
  ).not.toBeInTheDocument();
});
