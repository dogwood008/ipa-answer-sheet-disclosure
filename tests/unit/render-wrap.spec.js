const fs = require('fs')
const { JSDOM } = require('jsdom')

describe('renderTextToPngBytes wrap/shrink', ()=>{
  test('returns ArrayBuffer for long text with maxWidth and maxLines', ()=>{
    const dom = new JSDOM('<!doctype html><html><body></body></html>')
    global.window = dom.window
    global.document = dom.window.document
    if (dom.window && dom.window.HTMLCanvasElement) {
      dom.window.HTMLCanvasElement.prototype.getContext = () => null
    }
    const { renderTextToPngBytes } = require('../../specs/001-a4-pdf-pdf/poc/script.js')
    const long = '非常に長い名前がここに入ります非常に長い名前がここに入ります'
    const buf = renderTextToPngBytes(long, 'NotoSansJP', 18, 100, 2)
    expect(buf).toBeDefined()
    expect(buf.byteLength).toBeGreaterThan(0)
  })
})
