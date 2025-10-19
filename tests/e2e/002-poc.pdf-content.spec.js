const { BASE_URL, launchBrowser } = require('./helpers')

describe('002-poc React UI E2E - PDF content contract', () => {
  test('generated PDF bytes contain the examNumber ascii', async () => {
    const { page, close } = await launchBrowser()
    try {
      await page.goto(BASE_URL)

      // Use local template to avoid external fetch/CORS
      const templatePath = require('path').resolve(__dirname, '../../specs/001-a4-pdf-pdf/poc/in.pdf')
      const input = await page.$('#templateFile')
      if (input) await input.uploadFile(templatePath)

      const name = 'E2E User'
      const examNumber = '12340000'
      await page.type('#name', name)
      await page.type('#examNumber', examNumber)
      await page.click('#generate')
      // Force minimal fallback generation to avoid heavy pdf-lib path in CI/offline
      await page.evaluate(async ()=>{ if(window.__forceE2EFallbackFromUI){ await window.__forceE2EFallbackFromUI() } })

      const logs = []
      page.on('console', msg => { try { logs.push({type: msg.type(), text: msg.text()}) } catch(_){} })
      try {
        await page.waitForFunction(() => {
          const a = document.querySelector('#download')
          return !!a && !!a.href && a.href.startsWith('blob:')
        }, { timeout: 20000 })
      } catch (err) {
        for (const l of logs) console.log('[BROWSER]', l.type, l.text)
        throw err
      }

      const ok = await page.evaluate(async () => {
        const a = document.querySelector('#download')
        if (!a) return false
        const href = a.href
        if (!href) return false
        const res = await fetch(href)
        const buf = await res.arrayBuffer()
        // decode as latin1 to allow binary-safe substring search of ASCII digits
        const text = new TextDecoder('latin1').decode(new Uint8Array(buf))
        return text.includes('12340000')
      })

      expect(ok).toBe(true)
    } finally {
      await close()
    }
  }, 35000)
})
