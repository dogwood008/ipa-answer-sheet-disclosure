const puppeteer = require('puppeteer-core')
const path = require('path')

describe('Color select - preset black', () => {
  test('preset Black applies to text and circle', async () => {
    const execPath = process.env.CHROME_PATH || '/usr/bin/chromium-browser'
    const browser = await puppeteer.launch({ executablePath: execPath, args:['--no-sandbox','--disable-setuid-sandbox'] })
    const page = await browser.newPage()
    await page.goto('http://localhost:8000')

    // choose draw circle and preset black
    await page.click('#drawCircleOn')
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

    await browser.close()
  }, 20000)
})

