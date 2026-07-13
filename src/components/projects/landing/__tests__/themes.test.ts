import { cinematicThemes } from '../themes';

const expectedSlugs = [
  '21n-apps',
  'snapmate',
  'bubble-bible',
  'dongne-paint',
  'youth-money-guide',
  'starlight-greenhouse',
  'volley-king-30',
  'toris-docs',
  'product-growth-skills'
] as const;

function relativeLuminance(hex: string) {
  const channels = hex
    .replace('#', '')
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    );

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);

  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

describe('cinematic theme accessibility contract', () => {
  it('defines the exact nine showcase themes', () => {
    expect(Object.keys(cinematicThemes)).toEqual(expectedSlugs);
  });

  it.each(expectedSlugs)('%s keeps every text pair at WCAG AA', (slug) => {
    const theme = cinematicThemes[slug];
    const pairs = [
      [theme.pageInk, theme.background, 'page ink'],
      [theme.pageMuted, theme.background, 'page muted'],
      [theme.surfaceInk, theme.surface, 'surface ink'],
      [theme.surfaceMuted, theme.surface, 'surface muted'],
      [theme.primaryInk, theme.primaryBackground, 'primary CTA']
    ] as const;

    pairs.forEach(([foreground, background, label]) => {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
      expect(`${slug}: ${label}`).toBeTruthy();
    });
  });
});
