const path = require('path')
const { BASE_URL, launchBrowser } = require('./helpers')

describe('Color select - named valid', () => {
  test('CSS named color green', async () => {
    const { page, close } = await launchBrowser()
    try {
      await page.goto(BASE_URL)

      // 円は常に描画（UI選択なし）
      await page.type('#colorName', 'green')
      await page.$eval('#colorName', el => el.dispatchEvent(new Event('change', { bubbles:true })))

      const templatePath = path.resolve(__dirname, '../../specs/001-a4-pdf-pdf/poc/in.pdf')
      await (await page.$('#templateFile')).uploadFile(templatePath)
      const fontPath = path.resolve(__dirname, '../../specs/001-a4-pdf-pdf/poc/NotoSansJP-Regular.ttf')
      await (await page.$('#fontFile')).uploadFile(fontPath)

      await page.click('#generate')
      await page.waitForFunction(()=> window.__lastPdfColorRGB && window.__circleDrawn !== undefined, { timeout: 5000 }).catch(()=>{})
      const color = await page.evaluate(()=> window.__lastPdfColorRGB )
      // green ~ (0, 0.5, 0) depending on browser name
      expect(color.r).toBeCloseTo(0)
      expect(color.g).toBeGreaterThan(0.4)
      expect(color.b).toBeCloseTo(0)
    } finally {
      await close()
    }
  }, 20000)
})
