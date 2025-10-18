const { BASE_URL, launchBrowser } = require('./helpers')

describe('002-poc React UI E2E - PDF content contract', () => {
  test('generated PDF bytes contain the examNumber ascii', async () => {
    const { page, close } = await launchBrowser()
    try {
      await page.goto(BASE_URL)

      const name = 'E2E User'
      const examNumber = '12340000'
      await page.type('#name', name)
      await page.type('#examNumber', examNumber)
      await page.click('#generate')

      await page.waitForFunction(() => {
        const a = document.querySelector('#download')
        return !!a && !!a.getAttribute('href') && a.getAttribute('href').startsWith('blob:')
      }, { timeout: 8000 })

      const ok = await page.evaluate(async () => {
        const a = document.querySelector('#download')
        if (!a) return false
        const href = a.getAttribute('href')
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
  }, 20000)
})

