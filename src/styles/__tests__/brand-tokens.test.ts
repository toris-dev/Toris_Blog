import fs from 'node:fs'
import path from 'node:path'

const readStyle = (fileName: string) =>
  fs.readFileSync(path.join(process.cwd(), 'src', 'styles', fileName), 'utf8')

const relativeLuminance = (hex: string) => {
  const channels = hex
    .match(/[a-f\d]{2}/gi)!
    .map(channel => Number.parseInt(channel, 16) / 255)
    .map(channel =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4
    )

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

const contrastRatio = (first: string, second: string) => {
  const firstLuminance = relativeLuminance(first)
  const secondLuminance = relativeLuminance(second)

  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  )
}

describe('TORIS brand tokens', () => {
  const source = readStyle('brand-tokens.css')

  it.each([
    ['ink', '#0E0F12'],
    ['graphite', '#202123'],
    ['mist', '#F5F7FA'],
    ['steel', '#9EA1AA'],
    ['signal-green', '#10A37F'],
    ['system-blue', '#2B8FFF']
  ])('keeps the canonical %s value', (token, value) => {
    expect(source).toContain(`--toris-color-${token}: ${value};`)
  })

  it.each([
    'canvas',
    'surface',
    'surface-elevated',
    'ink',
    'ink-muted',
    'border',
    'signal',
    'system',
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
  ])('defines the --toris-%s semantic token', token => {
    expect(source).toMatch(new RegExp(`--toris-${token}:\\s*[^;]+;`))
  })

  it('provides both default and dark semantic contexts', () => {
    expect(source).toMatch(/:root\s*{/)
    expect(source).toMatch(
      /\.dark,\s*\.cyberpunk,\s*\[data-toris-theme=['"]dark['"]\]\s*{/
    )
  })

  it('uses Ink on saturated brand actions and a strong control border', () => {
    expect(source).toContain(
      '--toris-on-signal: var(--toris-color-ink);'
    )
    expect(source).toContain(
      '--toris-on-system: var(--toris-color-ink);'
    )
    expect(source).toContain('--toris-control-border: #6B707A;')

    const darkContext = source.match(
      /\.dark,\s*\.cyberpunk,\s*\[data-toris-theme=['"]dark['"]\]\s*{([\s\S]*?)\n}/
    )?.[1]
    expect(darkContext).toContain(
      '--toris-control-border: var(--toris-color-steel);'
    )
  })

  it('meets WCAG contrast for action copy and interactive boundaries', () => {
    expect(contrastRatio('#0E0F12', '#10A37F')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio('#0E0F12', '#2B8FFF')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio('#6B707A', '#F5F7FA')).toBeGreaterThanOrEqual(3)
    expect(contrastRatio('#9EA1AA', '#202123')).toBeGreaterThanOrEqual(3)
  })

  it('keeps destructive surfaces and text readable in both contexts', () => {
    expect(source).toContain('--toris-destructive: #B42318;')
    expect(source).toContain('--toris-on-destructive: #FFFFFF;')
    expect(source).toContain('--toris-destructive-text: #B42318;')

    const darkContext = source.match(
      /\.dark,\s*\.cyberpunk,\s*\[data-toris-theme=['"]dark['"]\]\s*{([\s\S]*?)\n}/
    )?.[1]
    expect(darkContext).toContain('--toris-destructive: #F97066;')
    expect(darkContext).toContain(
      '--toris-on-destructive: var(--toris-color-ink);'
    )
    expect(darkContext).toContain('--toris-destructive-text: #F97066;')

    expect(contrastRatio('#B42318', '#FFFFFF')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio('#B42318', '#F5F7FA')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio('#F97066', '#202123')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio('#0E0F12', '#F97066')).toBeGreaterThanOrEqual(4.5)
  })

  it('loads brand tokens before legacy variables and removes the body dot grid', () => {
    const globals = readStyle('globals.css')
    const brandImport = globals.indexOf("@import './brand-tokens.css';")
    const legacyImport = globals.indexOf("@import './variables.css';")

    expect(brandImport).toBeGreaterThanOrEqual(0)
    expect(brandImport).toBeLessThan(legacyImport)
    expect(globals).not.toMatch(/body\s*{[^}]*background-image:\s*radial-gradient/s)
    expect(globals).not.toMatch(/body\s*{[^}]*transition:\s*background-color/s)
    expect(globals).toContain('--primary-foreground: var(--toris-hsl-on-signal);')
    expect(globals).toContain('--secondary-foreground: var(--toris-hsl-on-system);')
    expect(globals).toContain('--input: var(--toris-hsl-control-border);')
    expect(globals).toContain('--destructive: var(--toris-hsl-destructive);')
    expect(globals).toContain(
      '--destructive-foreground: var(--toris-hsl-on-destructive);'
    )
    expect(globals).toMatch(/\.dark,\s*\.cyberpunk\s*{/)
  })
})
