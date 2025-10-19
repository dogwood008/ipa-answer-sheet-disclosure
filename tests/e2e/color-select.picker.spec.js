const path = require('path')
const { BASE_URL, launchBrowser } = require('./helpers')

describe('Color select - native picker', () => {
  test('picker applies custom color (blue)', async () => {
    const { page, close } = await launchBrowser()
    try {
      await page.goto(BASE_URL)

      await page.click('#drawCircleOn')
      // Set color input value programmatically
      await page.$eval('#colorPicker', el => { el.value = '#0000FF'; el.dispatchEvent(new Event('input', { bubbles:true })) })

      const templatePath = path.resolve(__dirname, '../../specs/001-a4-pdf-pdf/poc/in.pdf')
      await (await page.$('#templateFile')).uploadFile(templatePath)
      const fontPath = path.resolve(__dirname, '../../specs/001-a4-pdf-pdf/poc/NotoSansJP-Regular.ttf')
      await (await page.$('#fontFile')).uploadFile(fontPath)

      await page.click('#generate')
      await page.waitForFunction(()=> window.__lastPdfColorRGB && window.__circleDrawn !== undefined, { timeout: 5000 }).catch(()=>{})
      const color = await page.evaluate(()=> window.__lastPdfColorRGB )
      expect(color.r).toBeCloseTo(0)
      expect(color.g).toBeCloseTo(0)
      expect(color.b).toBeCloseTo(1)
    } finally {
      await close()
    }
  }, 20000)
})
