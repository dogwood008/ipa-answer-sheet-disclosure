const puppeteer = require('puppeteer-core')

const PORT = process.env.PORT || '8000'
const BASE_URL = `http://localhost:${PORT}`

async function launchBrowser() {
  const execPath = process.env.CHROME_PATH || '/usr/bin/chromium-browser'
  const browser = await puppeteer.launch({ executablePath: execPath, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()

  async function close() {
    try {
      await browser.close()
    } catch (err) {
      // Swallow errors on close to avoid masking earlier test failures
      if (process.env.DEBUG) {
        console.error('[e2e] Failed to close browser', err)
      }
    }
  }

  return { browser, page, close }
}

module.exports = { BASE_URL, launchBrowser }
