import { render, screen } from '@testing-library/react';
import { TorisBrand } from '@/components/brand/TorisBrand';

describe('TorisBrand', () => {
  it('gives the mark-only variant an accessible image name', () => {
    const { container } = render(<TorisBrand variant="mark" />);

    expect(screen.getByRole('img', { name: 'TORIS 로고' })).toHaveAttribute(
      'src',
      expect.stringContaining('toris-mark-v2.svg')
    );
    expect(
      container.querySelector('[data-brand-variant="mark"]')
    ).toBeInTheDocument();
    expect(screen.queryByText('TORIS')).not.toBeInTheDocument();
  });

  it('renders a real-text wordmark and keeps the lockup image decorative', () => {
    const { container } = render(<TorisBrand />);

    const lockup = container.querySelector('[data-brand-variant="lockup"]');
    const mark = lockup?.querySelector('img');

    expect(lockup).toBeInTheDocument();
    expect(mark).toHaveAttribute('alt', '');
    expect(screen.getByText('TORIS')).toBeInTheDocument();
  });

  it('forwards visual class names without changing accessible content', () => {
    const { container } = render(
      <TorisBrand
        className="brand-shell"
        markClassName="brand-mark"
        wordmarkClassName="brand-wordmark"
      />
    );

    expect(container.firstChild).toHaveClass('brand-shell');
    expect(container.querySelector('img')).toHaveClass('brand-mark');
    expect(screen.getByText('TORIS')).toHaveClass('brand-wordmark');
  });
});
