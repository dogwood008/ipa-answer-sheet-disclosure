const puppeteer = require('puppeteer-core')
const { BASE_URL } = require('./helpers')

describe('002-poc React UI E2E', () => {
  test('form -> generate -> preview/download', async () => {
    const execPath = process.env.CHROME_PATH || '/usr/bin/chromium-browser'
    const browser = await puppeteer.launch({ executablePath: execPath, args: ['--no-sandbox','--disable-setuid-sandbox'] })
    const page = await browser.newPage()

    // Capture console for debug on failure
    const logs = []
    page.on('console', msg => { try { logs.push({type: msg.type(), text: msg.text()}) } catch(_){} })

    await page.goto(BASE_URL)

    // Fill inputs
    await page.type('#name', 'テスト 太郎')
    await page.type('#examNumber', '00001234')

    // Generate
    await page.click('#generate')

    // Wait until href is populated with blob URL
    await page.waitForFunction(() => {
      const a = document.querySelector('#download');
      return !!a && !!a.getAttribute('href') && a.getAttribute('href').startsWith('blob:');
    }, { timeout: 8000 })
    const href = await page.$eval('#download', a => a.getAttribute('href'))
    expect(href).toMatch(/^blob:/)

    // Optional preview check
    const hasIframe = await page.$('iframe')
    expect(!!hasIframe).toBe(true)

    await browser.close()
  }, 20000)
})
