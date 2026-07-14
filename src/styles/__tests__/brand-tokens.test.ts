import fs from 'node:fs';
import path from 'node:path';

const readStyle = (fileName: string) =>
  fs.readFileSync(path.join(process.cwd(), 'src', 'styles', fileName), 'utf8');

const relativeLuminance = (hex: string) => {
  const channels = hex
    .match(/[a-f\d]{2}/gi)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    );

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

const contrastRatio = (first: string, second: string) => {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);

  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
};

describe('TORIS brand tokens', () => {
  const source = readStyle('brand-tokens.css');

  it.each([
    ['ink', '#080A0D'],
    ['graphite', '#171A20'],
    ['mist', '#F4F1E8'],
    ['steel', '#7E8794'],
    ['signal-green', '#5CEBFF'],
    ['system-blue', '#C99A3D'],
    ['forge-red', '#B72E2C']
  ])('keeps the canonical %s value', (token, value) => {
    expect(source).toMatch(
      new RegExp(`--toris-color-${token}:\\s*${value};`, 'i')
    );
  });

  it.each([
    'canvas',
    'surface',
    'surface-elevated',
    'ink',
    'ink-muted',
    'border',
    'signal',
    'system',
    'signal-text',
    'system-text',
    'on-signal',
    'on-system',
    'inverse',
    'focus',
    'control-border',
    'destructive',
    'on-destructive',
    'destructive-text',
    'shadow-sm',
    'shadow-md'
  ])('defines the --toris-%s semantic token', (token) => {
    expect(source).toMatch(new RegExp(`--toris-${token}:\\s*[^;]+;`));
  });

  it('provides explicit light and dark semantic contexts', () => {
    expect(source).toMatch(/:root,\s*\[data-toris-theme=['"]light['"]\]\s*{/);
    expect(source).toMatch(
      /\.dark,\s*\.cyberpunk,\s*\[data-toris-theme=['"]dark['"]\]\s*{/
    );
  });

  it('uses Ink on saturated brand actions and a strong control border', () => {
    expect(source).toContain('--toris-on-signal: var(--toris-color-ink);');
    expect(source).toContain('--toris-on-system: var(--toris-color-ink);');
    expect(source).toMatch(/--toris-control-border:\s*#69717B;/i);

    const darkContext = source.match(
      /\.dark,\s*\.cyberpunk,\s*\[data-toris-theme=['"]dark['"]\]\s*{([\s\S]*?)\n}/
    )?.[1];
    expect(darkContext).toContain(
      '--toris-control-border: var(--toris-color-steel);'
    );
  });

  it('meets WCAG contrast for action copy and interactive boundaries', () => {
    expect(contrastRatio('#080A0D', '#5CEBFF')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#080A0D', '#C99A3D')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#69717B', '#F4F1E8')).toBeGreaterThanOrEqual(3);
    expect(contrastRatio('#7E8794', '#171A20')).toBeGreaterThanOrEqual(3);
  });

  it('uses contrast-safe accent text roles on light and dark surfaces', () => {
    expect(source).toMatch(/--toris-signal-text:\s*#006877;/i);
    expect(source).toMatch(/--toris-system-text:\s*#745000;/i);
    expect(source).toMatch(/--toris-signal-text:\s*#5CEBFF;/i);
    expect(source).toMatch(/--toris-system-text:\s*#E7C46D;/i);

    expect(contrastRatio('#006877', '#F4F1E8')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#745000', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#5CEBFF', '#171A20')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#E7C46D', '#080A0D')).toBeGreaterThanOrEqual(4.5);
  });

  it('uses the surface-safe reactor text role for visible focus', () => {
    expect(source).toContain('--toris-focus: var(--toris-signal-text);');
    expect(contrastRatio('#006877', '#F4F1E8')).toBeGreaterThanOrEqual(3);
    expect(contrastRatio('#5CEBFF', '#080A0D')).toBeGreaterThanOrEqual(3);
  });

  it('keeps destructive surfaces and text readable in both contexts', () => {
    expect(source).toContain(
      '--toris-destructive: var(--toris-color-forge-red);'
    );
    expect(source).toMatch(/--toris-on-destructive:\s*#FFFFFF;/i);
    expect(source).toMatch(/--toris-destructive-text:\s*#9E2320;/i);

    const darkContext = source.match(
      /\.dark,\s*\.cyberpunk,\s*\[data-toris-theme=['"]dark['"]\]\s*{([\s\S]*?)\n}/
    )?.[1];
    expect(darkContext).toMatch(/--toris-destructive:\s*#FF716D;/i);
    expect(darkContext).toContain(
      '--toris-on-destructive: var(--toris-color-ink);'
    );
    expect(darkContext).toMatch(/--toris-destructive-text:\s*#FF8B87;/i);

    expect(contrastRatio('#B72E2C', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#9E2320', '#F4F1E8')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#FF8B87', '#171A20')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#080A0D', '#FF716D')).toBeGreaterThanOrEqual(4.5);
  });

  it('loads brand tokens before legacy variables and removes the body dot grid', () => {
    const globals = readStyle('globals.css');
    const brandImport = globals.indexOf("@import './brand-tokens.css';");
    const legacyImport = globals.indexOf("@import './variables.css';");

    expect(brandImport).toBeGreaterThanOrEqual(0);
    expect(brandImport).toBeLessThan(legacyImport);
    expect(globals).not.toMatch(
      /body\s*{[^}]*background-image:\s*radial-gradient/s
    );
    expect(globals).not.toMatch(/body\s*{[^}]*transition:\s*background-color/s);
    expect(globals).toContain(
      '--primary-foreground: var(--toris-hsl-on-signal);'
    );
    expect(globals).toContain(
      '--secondary-foreground: var(--toris-hsl-on-system);'
    );
    expect(globals).toContain('--input: var(--toris-hsl-control-border);');
    expect(globals).toContain('--destructive: var(--toris-hsl-destructive);');
    expect(globals).toContain(
      '--destructive-foreground: var(--toris-hsl-on-destructive);'
    );
    expect(globals).toMatch(/\.dark,\s*\.cyberpunk\s*{/);
  });
});
