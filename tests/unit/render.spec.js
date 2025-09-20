const fs = require('fs')
const { JSDOM } = require('jsdom')

// Minimal unit test to ensure renderTextToPngBytes returns a buffer-like
describe('renderTextToPngBytes', ()=>{
  test('creates png bytes', async ()=>{
    const dom = new JSDOM('<!doctype html><html><body></body></html>')
    global.window = dom.window
    global.document = dom.window.document
    // jsdom は canvas を未実装のため、エラーログを抑止するために getContext をモック
    if (dom.window && dom.window.HTMLCanvasElement) {
      dom.window.HTMLCanvasElement.prototype.getContext = () => null
    }
    const { renderTextToPngBytes } = require('../../specs/001-a4-pdf-pdf/poc/script.js')
    const buf = renderTextToPngBytes('テスト', 'Arial', 24)
    expect(buf).toBeDefined()
    expect(buf.byteLength).toBeGreaterThan(0)
  })
})
