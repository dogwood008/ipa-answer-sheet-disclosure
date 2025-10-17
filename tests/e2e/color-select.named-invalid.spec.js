const puppeteer = require('puppeteer-core')
const { BASE_URL, resolveChromiumExecutable, resolveFixturePath } = require('./helpers')

describe('Color select - named invalid', () => {
  test('invalid name falls back to black', async () => {
    const browser = await puppeteer.launch({ executablePath: resolveChromiumExecutable(), args:['--no-sandbox','--disable-setuid-sandbox'] })
    const page = await browser.newPage()
    await page.goto(BASE_URL)

    await page.click('#drawCircleOn')
    await page.type('#colorName', 'not-a-color')
    await page.$eval('#colorName', el => el.dispatchEvent(new Event('change', { bubbles:true })))

    const templatePath = resolveFixturePath('in.pdf')
    await (await page.$('#templateFile')).uploadFile(templatePath)
    const fontPath = resolveFixturePath('NotoSansJP-Regular.ttf')
    await (await page.$('#fontFile')).uploadFile(fontPath)

    await page.click('#generate')
    await page.waitForFunction(()=> window.__lastPdfColorRGB && window.__circleDrawn !== undefined, { timeout: 5000 }).catch(()=>{})
    const color = await page.evaluate(()=> window.__lastPdfColorRGB )
    expect(color.r).toBeCloseTo(0)
    expect(color.g).toBeCloseTo(0)
    expect(color.b).toBeCloseTo(0)

    await browser.close()
  }, 20000)
})
