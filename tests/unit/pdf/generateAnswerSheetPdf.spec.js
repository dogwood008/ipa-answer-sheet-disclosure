const path = require('path')

describe('src/lib/pdf/generateAnswerSheetPdf', () => {
  const mod = require(path.resolve(process.cwd(), 'src/lib/pdf/index.js'))

  test('returns Uint8Array and starts with %PDF', async () => {
    const bytes = await mod.generateAnswerSheetPdf({}, { name: 'Taro', examNumber: 'AB1234' })
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.byteLength).toBeGreaterThan(0)
    const header = String.fromCharCode(...Array.from(bytes.slice(0, 4)))
    expect(header).toBe('%PDF')
  })

  test('throws on invalid input', async () => {
    await expect(mod.generateAnswerSheetPdf({}, null)).rejects.toThrow('InvalidInput')
    await expect(mod.generateAnswerSheetPdf({}, { name: 123, examNumber: 'X' })).rejects.toThrow('InvalidInput')
    await expect(mod.generateAnswerSheetPdf({}, { name: 'Taro', examNumber: 123 })).rejects.toThrow('InvalidInput')
  })
})

