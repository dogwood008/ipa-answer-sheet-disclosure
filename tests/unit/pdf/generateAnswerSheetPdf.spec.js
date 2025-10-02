const path = require('path')

describe('src/lib/pdf/generateAnswerSheetPdf', () => {
  const mod = require(path.resolve(process.cwd(), 'src/lib/pdf/index.js'))

  test('returns Uint8Array and starts with %PDF', () => {
    const bytes = mod.generateAnswerSheetPdf({}, { name: 'Taro', examNumber: 'AB1234' })
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.byteLength).toBeGreaterThan(0)
    const header = String.fromCharCode(...Array.from(bytes.slice(0, 4)))
    expect(header).toBe('%PDF')
  })

  test('throws on invalid input', () => {
    expect(() => mod.generateAnswerSheetPdf({}, null)).toThrow('InvalidInput')
    expect(() => mod.generateAnswerSheetPdf({}, { name: 123, examNumber: 'X' })).toThrow('InvalidInput')
    expect(() => mod.generateAnswerSheetPdf({}, { name: 'Taro', examNumber: 123 })).toThrow('InvalidInput')
  })
})

