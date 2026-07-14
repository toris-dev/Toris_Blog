import { render, screen } from '@testing-library/react';
import {
  StudioCanvas,
  StudioEyebrow,
  StudioSection,
  StudioStage,
  studioActionStyles
} from '../StudioShell';

describe('StudioShell', () => {
  it('provides explicit semantic stage and canvas surfaces', () => {
    render(
      <>
        <StudioStage aria-label="dark product stage">Stage</StudioStage>
        <StudioCanvas aria-label="light work canvas">Canvas</StudioCanvas>
      </>
    );

    expect(screen.getByLabelText('dark product stage')).toHaveAttribute(
      'data-toris-theme',
      'dark'
    );
    expect(screen.getByLabelText('dark product stage')).toHaveClass(
      'bg-[var(--toris-canvas)]'
    );
    expect(screen.getByLabelText('light work canvas')).toHaveAttribute(
      'data-toris-surface',
      'canvas'
    );
  });

  it('keeps section content bounded and Korean labels readable', () => {
    render(
      <StudioSection aria-label="bounded section">
        <StudioEyebrow>제품 개발 스튜디오</StudioEyebrow>
      </StudioSection>
    );

    expect(screen.getByLabelText('bounded section')).toHaveClass(
      'max-w-[86rem]'
    );
    expect(screen.getByText('제품 개발 스튜디오')).toHaveClass('break-keep');
  });

  it('exports action styles with accessible focus and target sizing', () => {
    expect(studioActionStyles({ intent: 'signal' })).toContain('min-h-11');
    expect(studioActionStyles({ intent: 'signal' })).toContain(
      'focus-visible:outline'
    );
    expect(studioActionStyles({ intent: 'outline' })).toContain(
      'border-[var(--toris-control-border)]'
    );
  });
});
