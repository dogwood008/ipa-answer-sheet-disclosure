const path = require('path')
const { BASE_URL, launchBrowser } = require('./helpers')

describe('Color select - preset black', () => {
  test('preset Black applies to text and circle', async () => {
    const { page, close } = await launchBrowser()
    try {
      await page.goto(BASE_URL)

      // 円は常に描画（UI選択なし）
      await page.click('#presetBlack')

      // upload local files to avoid network
      const templatePath = path.resolve(__dirname, '../../specs/001-a4-pdf-pdf/poc/in.pdf')
      await (await page.$('#templateFile')).uploadFile(templatePath)
      const fontPath = path.resolve(__dirname, '../../specs/001-a4-pdf-pdf/poc/NotoSansJP-Regular.ttf')
      await (await page.$('#fontFile')).uploadFile(fontPath)

      await page.click('#generate')
      await page.waitForFunction(()=> window.__lastPdfColorRGB && window.__circleDrawn !== undefined, { timeout: 5000 }).catch(()=>{})
      const { color, circle } = await page.evaluate(()=>({ color: window.__lastPdfColorRGB, circle: window.__circleDrawn }))
      expect(circle).toBe(true)
      expect(color).toBeTruthy()
      expect(color.r).toBeCloseTo(0)
      expect(color.g).toBeCloseTo(0)
      expect(color.b).toBeCloseTo(0)
    } finally {
      await close()
    }
  }, 20000)
})
