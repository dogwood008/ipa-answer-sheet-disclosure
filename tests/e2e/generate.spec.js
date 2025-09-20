const puppeteer = require('puppeteer-core')
const fs = require('fs')

describe('PoC E2E generate', ()=>{
  test('opens page and attempts generation', async ()=>{
  const execPath = process.env.CHROME_PATH || '/usr/bin/chromium-browser'
  const browser = await puppeteer.launch({executablePath: execPath, args:['--no-sandbox','--disable-setuid-sandbox']})
    const page = await browser.newPage()
    // capture browser console for debugging
    const logs = []
    page.on('console', msg=>{
      try{ logs.push({type: msg.type(), text: msg.text()}) }catch(e){}
    })
  await page.goto('http://localhost:8000')
  // upload local template to avoid CORS when fetching external template
  const templatePath = require('path').resolve(__dirname, '../../specs/001-a4-pdf-pdf/poc/in.pdf')
  const input = await page.$('#templateFile')
  if(input) await input.uploadFile(templatePath)
  // upload local ttf to test pdf-lib embedding path
  const fontPath = require('path').resolve(__dirname, '../../specs/001-a4-pdf-pdf/poc/NotoSansJP-Regular.ttf')
  const fontInput = await page.$('#fontFile')
  if(fontInput) await fontInput.uploadFile(fontPath)
  await page.type('#name','テスト 太郎')
  await page.type('#examNumber','00001234')
  await page.click('#generate')
    // wait up to 5s for download link to populate
    await page.waitForFunction(()=>{
      const el = document.getElementById('download')
      return el && el.getAttribute('download') && el.href && el.href.length>0
    }, { timeout: 5000 }).catch(()=>{})
  const href = await page.$eval('#download', a=>a.href)
    // dump logs to stderr if href is empty for debugging
    if(!href || href.length===0){
      // print browser logs to node stdout for test output
      for(const l of logs) console.log('[BROWSER]',l.type, l.text)
    }
  // verify that pdf-lib embedding path was exercised by checking a window flag
  const embeddedFlag = await page.evaluate(()=>{ try{ return !!window.__embeddedFontEmbedded }catch(e){ return false } })
  expect(embeddedFlag).toBe(true)
    expect(href).toMatch(/^blob:/)
    await browser.close()
  }, 20000)
})
