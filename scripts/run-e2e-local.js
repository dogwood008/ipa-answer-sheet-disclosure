#!/usr/bin/env node
const { spawn } = require('child_process')
const path = require('path')

const SERVER_DIR = path.resolve(__dirname, '../specs/001-a4-pdf-pdf/poc')
const PORT = process.env.PORT || 8000

function delay(ms){ return new Promise(res=>setTimeout(res, ms)) }

async function main(){
  const chromePath = process.env.CHROME_PATH || '/usr/bin/chromium-browser'
  const env = { ...process.env, CHROME_PATH: chromePath }

  console.log(`[e2e-local] Starting static server at ${SERVER_DIR} on :${PORT}`)
  const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
    cwd: SERVER_DIR,
    stdio: 'inherit',
  })

  const cleanup = ()=>{
    if (!server.killed) {
      try { process.kill(server.pid) } catch(_) {}
    }
  }
  process.on('exit', cleanup)
  process.on('SIGINT', ()=>{ cleanup(); process.exit(130) })
  process.on('SIGTERM', ()=>{ cleanup(); process.exit(143) })

  // small wait for server readiness
  await delay(800)

  console.log('[e2e-local] Running jest tests/e2e ...')
  const jestBin = path.resolve(__dirname, '../node_modules/.bin/jest')
  const jest = spawn(jestBin, ['tests/e2e', '--runInBand'], {
    stdio: 'inherit',
    env,
  })

  jest.on('exit', (code)=>{
    cleanup()
    process.exit(code ?? 1)
  })
}

main().catch(err=>{
  console.error('[e2e-local] Failed:', err)
  process.exit(1)
})
