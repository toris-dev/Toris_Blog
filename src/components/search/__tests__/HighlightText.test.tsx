import { render, screen } from '@testing-library/react';
import { HighlightText } from '../HighlightText';

describe('HighlightText', () => {
  it('uses the semantic system surface for a readable match', () => {
    render(<HighlightText text="React product system" searchTerm="React" />);

    const match = screen.getByText('React');
    expect(match.tagName).toBe('MARK');
    expect(match).toHaveClass(
      'bg-[var(--toris-system)]',
      'text-[var(--toris-on-system)]'
    );
    expect(match.className).not.toMatch(/yellow|amber/);
  });

  it('does not add a mark when there is no search term', () => {
    const { container } = render(
      <HighlightText text="운영 가능한 제품" searchTerm="" />
    );

    expect(container.querySelector('mark')).not.toBeInTheDocument();
    expect(screen.getByText('운영 가능한 제품')).toBeVisible();
  });
});
