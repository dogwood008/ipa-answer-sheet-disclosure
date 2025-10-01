const path = require('path')

describe('color normalization utils', () => {
  const mod = require(path.resolve(__dirname, '../../specs/001-a4-pdf-pdf/poc/script.js'))

  test('#RGB expands to #RRGGBB', () => {
    expect(mod.normalizeHex('#0fA')).toBe('#00FFAA')
  })

  test('#RRGGBB stays uppercase', () => {
    expect(mod.normalizeHex('#00ffaa')).toBe('#00FFAA')
  })

  test('normalizeColor hex and invalid fallback', () => {
    expect(mod.normalizeColor('#123')).toBe('#112233')
    expect(mod.normalizeColor('')).toBe('#000000')
    expect(mod.normalizeColor('not-a-color')).toBe('#000000')
  })

  test('hexToRgb01 converts correctly', () => {
    const { r, g, b } = mod.hexToRgb01('#FF0000')
    expect(r).toBeCloseTo(1)
    expect(g).toBeCloseTo(0)
    expect(b).toBeCloseTo(0)
  })

  test('normalizeColor resolves named color via DOM/getComputedStyle mock (green → #008000)', () => {
    const origDoc = global.document
    const origGetCS = global.getComputedStyle
    try{
      // Minimal DOM shim for namedToHex
      global.document = {
        createElement: () => ({ style: {} }),
        body: { appendChild: () => {}, removeChild: () => {} },
        documentElement: { appendChild: () => {}, removeChild: () => {} },
      }
      global.getComputedStyle = () => ({ color: 'rgb(0, 128, 0)' })
      const hex = mod.normalizeColor('green')
      expect(hex).toBe('#008000')
    } finally {
      global.document = origDoc
      global.getComputedStyle = origGetCS
    }
  })
})
