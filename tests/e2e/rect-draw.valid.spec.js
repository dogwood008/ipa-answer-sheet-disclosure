const puppeteer = require('puppeteer-core')
const { BASE_URL, resolveChromiumExecutable, resolveFixturePath } = require('./helpers')

describe('Rectangle draw - valid', ()=>{
  test('draws rectangle with given dimensions', async()=>{
    const browser = await puppeteer.launch({executablePath: resolveChromiumExecutable(), args:['--no-sandbox','--disable-setuid-sandbox']})
    const page = await browser.newPage()
    await page.goto(BASE_URL)

    // enable rect drawing and set inputs
    await page.$eval('#drawRect', el=>{ el.checked = true; el.dispatchEvent(new Event('change',{bubbles:true})) })
    await page.$eval('#rectX', (el)=> el.value = '')
    await page.type('#rectX','50')
    await page.$eval('#rectY', (el)=> el.value = '')
    await page.type('#rectY','60')
    await page.$eval('#rectW', (el)=> el.value = '')
    await page.type('#rectW','100')
    await page.$eval('#rectH', (el)=> el.value = '')
    await page.type('#rectH','80')

    const templatePath = resolveFixturePath('in.pdf')
    await (await page.$('#templateFile')).uploadFile(templatePath)
    const fontPath = resolveFixturePath('NotoSansJP-Regular.ttf')
    await (await page.$('#fontFile')).uploadFile(fontPath)

    await page.click('#generate')
    await page.waitForFunction(()=> typeof window.__rectDrawn !== 'undefined', { timeout: 5000 }).catch(()=>{})
    const rectInfo = await page.evaluate(()=>({ drawn: window.__rectDrawn, rect: window.__lastRect }))
    expect(rectInfo.drawn).toBe(true)
    expect(rectInfo.rect).toBeTruthy()
    expect(rectInfo.rect.w).toBeGreaterThan(0)
    expect(rectInfo.rect.h).toBeGreaterThan(0)
    await browser.close()
  }, 20000)
})

