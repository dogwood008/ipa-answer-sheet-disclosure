const puppeteer = require('puppeteer-core')
const path = require('path')
const { BASE_URL } = require('./helpers')

describe('Draw circle option', ()=>{
  test('selecting "draw" renders circle path', async()=>{
    const execPath = process.env.CHROME_PATH || '/usr/bin/chromium-browser'
    const browser = await puppeteer.launch({executablePath: execPath, args:['--no-sandbox','--disable-setuid-sandbox']})
    const page = await browser.newPage()

    await page.goto(BASE_URL)

    // Select draw option
    await page.click('#drawCircleOn')

    // Upload local template and font to avoid network
    const templatePath = path.resolve(__dirname, '../../specs/001-a4-pdf-pdf/poc/in.pdf')
    const input = await page.$('#templateFile')
    if(input) await input.uploadFile(templatePath)

    const fontPath = path.resolve(__dirname, '../../specs/001-a4-pdf-pdf/poc/NotoSansJP-Regular.ttf')
    const fontInput = await page.$('#fontFile')
    if(fontInput) await fontInput.uploadFile(fontPath)

    await page.type('#name','円 描画テスト')
    await page.type('#examNumber','12345678')
    await page.click('#generate')

    // Wait for download link
    await page.waitForFunction(()=>{
      const el = document.getElementById('download')
      return el && el.getAttribute('download') && el.href && el.href.length>0
    }, { timeout: 5000 }).catch(()=>{})

    // Verify that code path executed
    const flag = await page.evaluate(()=>{ try{ return !!window.__circleDrawn }catch(e){ return false } })
    expect(flag).toBe(true)

    await browser.close()
  }, 20000)
})
