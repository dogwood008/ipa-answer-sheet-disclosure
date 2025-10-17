const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || '8000'
const BASE_URL = `http://localhost:${PORT}`

let cachedChromiumPath = null
function resolveChromiumExecutable(){
  if (cachedChromiumPath) return cachedChromiumPath

  const candidates = [
    process.env.CHROME_PATH,
    process.env.CHROMIUM_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        cachedChromiumPath = candidate
        return candidate
      }
    } catch (_) {
      // ignore fs errors and continue to next candidate
    }
  }

  throw new Error('Chromium executable not found. Please set CHROME_PATH to the browser binary path.')
}

function resolveFixturePath(rel){
  return path.resolve(__dirname, '../../specs/001-a4-pdf-pdf/poc', rel)
}

module.exports = { BASE_URL, resolveChromiumExecutable, resolveFixturePath }
