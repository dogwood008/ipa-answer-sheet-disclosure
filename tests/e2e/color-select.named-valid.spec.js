const puppeteer = require('puppeteer-core')
const path = require('path')

describe('Color select - named valid', () => {
  test('CSS named color green', async () => {
    const execPath = process.env.CHROME_PATH || '/usr/bin/chromium-browser'
    const browser = await puppeteer.launch({ executablePath: execPath, args:['--no-sandbox','--disable-setuid-sandbox'] })
    const page = await browser.newPage()
    await page.goto('http://localhost:8000')

    await page.click('#drawCircleOn')
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

    await browser.close()
  }, 20000)
})

