const path = require('path')
const { BASE_URL, launchBrowser } = require('./helpers')

describe('Rectangle draw - invalid inputs', ()=>{
  test('does not draw rectangle when invalid', async()=>{
    const { page, close } = await launchBrowser()
    try {
      await page.goto(BASE_URL)

      await page.$eval('#drawRect', el=>{ el.checked = true; el.dispatchEvent(new Event('change',{bubbles:true})) })
      await page.$eval('#rectX', (el)=> el.value = '')
      await page.type('#rectX','10')
      await page.$eval('#rectY', (el)=> el.value = '')
      await page.type('#rectY','20')
      await page.$eval('#rectW', (el)=> el.value = '')
      await page.type('#rectW','0') // invalid width
      await page.$eval('#rectH', (el)=> el.value = '')
      await page.type('#rectH','40')

      const templatePath = path.resolve(__dirname, '../../specs/001-a4-pdf-pdf/poc/in.pdf')
      await (await page.$('#templateFile')).uploadFile(templatePath)
      const fontPath = path.resolve(__dirname, '../../specs/001-a4-pdf-pdf/poc/NotoSansJP-Regular.ttf')
      await (await page.$('#fontFile')).uploadFile(fontPath)

      await page.click('#generate')
      await page.waitForFunction(()=> typeof window.__rectDrawn !== 'undefined', { timeout: 5000 }).catch(()=>{})
      const drawn = await page.evaluate(()=> window.__rectDrawn )
      expect(drawn).toBe(false)
    } finally {
      await close()
    }
  }, 20000)
})

