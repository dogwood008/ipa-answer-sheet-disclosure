const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

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
    'chromium-browser',
    'chromium',
    'google-chrome-stable',
    'google-chrome',
  ].filter(Boolean)

  for (const candidate of candidates) {
    const resolved = resolveCandidatePath(candidate)
    if (!resolved) continue
    try {
      if (fs.existsSync(resolved)) {
        cachedChromiumPath = resolved
        return resolved
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

function resolveCandidatePath(candidate){
  if (!candidate) return null
  const trimmed = String(candidate).trim()
  if (!trimmed) return null

  if (trimmed.includes(path.sep) || path.isAbsolute(trimmed)) {
    return trimmed
  }

  try {
    const result = spawnSync('which', [trimmed], { encoding: 'utf8' })
    if (result.status === 0) {
      const stdout = result.stdout.split('\n').map(line => line.trim()).filter(Boolean)
      if (stdout.length > 0) {
        return stdout[0]
      }
    }
  } catch (_) {
    // ignore lookup failure
  }

  return null
}

module.exports = { BASE_URL, resolveChromiumExecutable, resolveFixturePath }
