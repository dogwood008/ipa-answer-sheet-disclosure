const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function run(){
  const browser = await puppeteer.launch({ headless: true, executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  await page.goto('http://localhost:8000/');

  // Fill fields
  await page.type('#name', '自動 太郎');
  await page.type('#examNumber', '98765432');

  // Click generate and wait for new tab
  const [popup] = await Promise.all([
    new Promise(resolve=> page.once('popup', resolve)),
    page.click('#generate')
  ]);

  // popup is a Page object
  await popup.waitForLoadState?.();

  // try to get blob URL from the download link
  const downloadHref = await page.$eval('#download', a => a.href || '');
  if(!downloadHref){
    console.log('No download href found, trying to inspect popup URL...');
  }

  // If popup opened with blob URL, fetch it in node
  const href = downloadHref || '';
  if(href && href.startsWith('blob:')){
    // Puppeteer can't fetch blob: directly; retrieve PDF bytes from the popup
    const pdfBytes = await popup.evaluate(async ()=>{
      // find any embed or object or iframe with src
      const el = document.querySelector('embed, iframe, object')
      if(el && el.src) {
        try{
          const r = await fetch(el.src)
          const ab = await r.arrayBuffer()
          return Array.from(new Uint8Array(ab)).slice(0,8)
        }catch(e){ return null }
      }
      // fallback: return null
      return null
    });
    if(pdfBytes && pdfBytes.length>0){
      const header = Buffer.from(pdfBytes).toString('utf8')
      if(header.startsWith('%PDF')){
        console.log('E2E: PDF header OK')
        await browser.close();
        process.exit(0)
      }
    }
  }

  // Alternative: try to download the generated pdf via evaluating pdf bytes in main page
  const mainPdfStart = await page.evaluate(()=>window.__lastPdfFirstBytes || null)
  if(mainPdfStart){
    const header = mainPdfStart.map(b=>String.fromCharCode(b)).join('')
    if(header.startsWith('%PDF')){
      console.log('E2E: PDF header OK (via main page)')
      await browser.close();
      process.exit(0)
    }
  }

  console.error('E2E: Could not verify generated PDF')
  await browser.close();
  process.exit(2)
}

run().catch(e=>{ console.error(e); process.exit(2) })
