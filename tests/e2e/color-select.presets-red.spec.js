const puppeteer = require('puppeteer-core')
const path = require('path')
const { BASE_URL } = require('./helpers')

describe('Color select - preset red', () => {
  test('preset Red applies to text and circle', async () => {
    const execPath = process.env.CHROME_PATH || '/usr/bin/chromium-browser'
    const browser = await puppeteer.launch({ executablePath: execPath, args:['--no-sandbox','--disable-setuid-sandbox'] })
    const page = await browser.newPage()
    await page.goto(BASE_URL)

    await page.click('#drawCircleOn')
    await page.click('#presetRed')

    const templatePath = path.resolve(__dirname, '../../specs/001-a4-pdf-pdf/poc/in.pdf')
    await (await page.$('#templateFile')).uploadFile(templatePath)
    const fontPath = path.resolve(__dirname, '../../specs/001-a4-pdf-pdf/poc/NotoSansJP-Regular.ttf')
    await (await page.$('#fontFile')).uploadFile(fontPath)

    await page.click('#generate')
    await page.waitForFunction(()=> window.__lastPdfColorRGB && window.__circleDrawn !== undefined, { timeout: 5000 }).catch(()=>{})
    const color = await page.evaluate(()=> window.__lastPdfColorRGB )
    expect(color.r).toBeCloseTo(1)
    expect(color.g).toBeCloseTo(0)
    expect(color.b).toBeCloseTo(0)

    await browser.close()
  }, 20000)
})
