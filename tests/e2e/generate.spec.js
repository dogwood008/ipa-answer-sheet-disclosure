const puppeteer = require('puppeteer')
const fs = require('fs')

describe('PoC E2E generate', ()=>{
  test('opens page and attempts generation', async ()=>{
    const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']})
    const page = await browser.newPage()
    await page.goto('http://localhost:8000')
    await page.type('#name','テスト 太郎')
    await page.type('#examNumber','00001234')
    await page.click('#generate')
    // wait for download link to be enabled
    await page.waitForSelector('#download[download]')
    const href = await page.$eval('#download', a=>a.href)
    expect(href).toMatch(/^blob:/)
    await browser.close()
  }, 20000)
})
