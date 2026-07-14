import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen, within } from '@testing-library/react';
import Footer from '@/components/common/Footer';

const root = process.cwd();
const brandDir = path.join(root, 'public/brand');

describe('TORIS production brand assets', () => {
  it('keeps imagegen concepts separate from flat production vectors', () => {
    const sourceAssets = [
      'toris-mark-imagegen-source-v2.png',
      'toris-app-icon-imagegen-source-v2.png'
    ];
    const productionAssets = ['toris-mark-v2.svg', 'toris-app-icon-v2.svg'];

    sourceAssets.forEach((asset) => {
      expect(existsSync(path.join(brandDir, asset))).toBe(true);
    });

    productionAssets.forEach((asset) => {
      const svg = readFileSync(path.join(brandDir, asset), 'utf8');

      expect(svg).toContain('viewBox="0 0 256 256"');
      expect(svg).toContain('#10A37F');
      expect(svg).toContain('#2B8FFF');
      expect(svg).not.toMatch(/gradient|filter|shadow|texture/i);
    });
  });

  it('publishes only production vectors in the manifest and icon routes', () => {
    const manifest = JSON.parse(
      readFileSync(path.join(root, 'public/manifest.json'), 'utf8')
    );
    const iconRoute = readFileSync(path.join(root, 'src/app/icon.tsx'), 'utf8');
    const appleIconRoute = readFileSync(
      path.join(root, 'src/app/apple-icon.tsx'),
      'utf8'
    );

    expect(manifest.icons).toEqual([
      expect.objectContaining({
        src: '/brand/toris-app-icon-v2.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      }),
      expect.objectContaining({
        src: '/brand/toris-mark-v2.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      })
    ]);
    expect(iconRoute).toContain('public/brand/toris-mark-v2.svg');
    expect(appleIconRoute).toContain('public/brand/toris-app-icon-v2.svg');
  });

  it('uses the TORIS icon and palette in root metadata without legacy overrides', () => {
    const layout = readFileSync(path.join(root, 'src/app/layout.tsx'), 'utf8');

    expect(layout).toContain("url: '/brand/toris-mark-v2.svg'");
    expect(layout).toContain('href="/brand/toris-mark-v2.svg"');
    expect(layout).toContain('content="#F5F7FA"');
    expect(layout).toContain('content="#0E0F12"');
    expect(layout).not.toContain('/images/favicon.svg');
    expect(layout).not.toContain('#0f172a');
  });
});

describe('Footer target sizing', () => {
  it('keeps icon and navigation targets at least 44px tall', () => {
    render(<Footer />);

    expect(screen.getByLabelText('TORIS GitHub')).toHaveClass('size-11');
    expect(screen.getByLabelText('TORIS 이메일')).toHaveClass('size-11');

    within(screen.getByRole('navigation', { name: '푸터 메뉴' }))
      .getAllByRole('link')
      .forEach((link) => expect(link).toHaveClass('min-h-11'));
  });

  it('keeps the official mark unchanged on a light contrast backing', () => {
    render(<Footer />);

    const homeLink = screen.getByRole('link', { name: 'TORIS' });
    const mark = homeLink.querySelector('img');

    expect(homeLink).toHaveClass('bg-[var(--toris-color-mist)]');
    expect(mark?.className).not.toMatch(/brightness|invert|filter/);
  });
});
