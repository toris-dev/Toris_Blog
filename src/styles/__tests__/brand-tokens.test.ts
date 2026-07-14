import fs from 'node:fs'
import path from 'node:path'

const readStyle = (fileName: string) =>
  fs.readFileSync(path.join(process.cwd(), 'src', 'styles', fileName), 'utf8')

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
    'inverse',
    'focus',
    'shadow-sm',
    'shadow-md'
  ])('defines the --toris-%s semantic token', token => {
    expect(source).toMatch(new RegExp(`--toris-${token}:\\s*[^;]+;`))
  })

  it('provides both default and dark semantic contexts', () => {
    expect(source).toMatch(/:root\s*{/)
    expect(source).toMatch(/\.dark,\s*\[data-toris-theme=['"]dark['"]\]\s*{/)
  })

  it('loads brand tokens before legacy variables and removes the body dot grid', () => {
    const globals = readStyle('globals.css')
    const brandImport = globals.indexOf("@import './brand-tokens.css';")
    const legacyImport = globals.indexOf("@import './variables.css';")

    expect(brandImport).toBeGreaterThanOrEqual(0)
    expect(brandImport).toBeLessThan(legacyImport)
    expect(globals).not.toMatch(/body\s*{[^}]*background-image:\s*radial-gradient/s)
    expect(globals).not.toMatch(/body\s*{[^}]*transition:\s*background-color/s)
  })
})
