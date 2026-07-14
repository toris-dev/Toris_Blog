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
    useReducedMotion: () => false,
    useSpring: (value: unknown) => value
  };
});

it('switches the visible product when a project tab is selected', () => {
  render(<ProductShowreel />);

  expect(
    screen.getByRole('img', { name: '예쁜계약 프로젝트 화면' })
  ).toHaveAttribute('src', '/images/projects/21n-apps/graphic.png');

  const firstTab = screen.getByRole('tab', { name: /예쁜계약/ });
  const snapMateTab = screen.getByRole('tab', { name: /SnapMate/ });
  fireEvent.keyDown(firstTab, { key: 'ArrowRight' });

  expect(snapMateTab).toHaveAttribute('aria-selected', 'true');
  expect(
    screen.getByRole('img', {
      name: 'SnapMate 프로젝트 화면'
    })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'SnapMate 프로젝트 보기' })
  ).toHaveAttribute('href', '/projects/snapmate');
});
