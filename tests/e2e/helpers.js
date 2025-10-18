const puppeteer = require('puppeteer-core')

const PORT = process.env.PORT || '8000'
const BASE_URL = `http://localhost:${PORT}`

async function launchBrowser() {
  const execPath = process.env.CHROME_PATH || '/usr/bin/chromium-browser'
  const browser = await puppeteer.launch({ executablePath: execPath, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()

  async function close() {
    const proc = typeof browser.process === 'function' ? browser.process() : null
    try {
      if (!page.isClosed()) {
        await page.close({ runBeforeUnload: false }).catch((err) => {
          if (process.env.DEBUG) {
            console.error('[e2e] Failed to close page', err)
          }
        })
      }
    } catch (err) {
      if (process.env.DEBUG) {
        console.error('[e2e] Unexpected error while closing page', err)
      }
    }

    try {
      await browser.close()
    } catch (err) {
      if (process.env.DEBUG) {
        console.error('[e2e] Failed to close browser', err)
      }
    } finally {
      if (proc && proc.exitCode === null) {
        try {
          proc.kill('SIGKILL')
        } catch (err) {
          if (process.env.DEBUG) {
            console.error('[e2e] Failed to kill browser process', err)
          }
        }
      }
    }
  }

  return { browser, page, close }
}

module.exports = { BASE_URL, launchBrowser }
