const puppeteer = require('puppeteer-core')
const { BASE_URL, resolveChromiumExecutable, resolveFixturePath } = require('./helpers')

describe('Draw circle option', ()=>{
  test('selecting "draw" renders circle path', async()=>{
    const browser = await puppeteer.launch({executablePath: resolveChromiumExecutable(), args:['--no-sandbox','--disable-setuid-sandbox']})
    const page = await browser.newPage()

    await page.goto(BASE_URL)

    // Select draw option
    await page.click('#drawCircleOn')

    // Upload local template and font to avoid network
    const templatePath = resolveFixturePath('in.pdf')
    const input = await page.$('#templateFile')
    if(input) await input.uploadFile(templatePath)

    const fontPath = resolveFixturePath('NotoSansJP-Regular.ttf')
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
