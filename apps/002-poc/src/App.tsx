import React, { useCallback, useEffect } from 'react'

function strToArrayBuffer(s: string): ArrayBuffer {
  const u8 = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i) & 0xff
  return u8.buffer
}

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((res, rej) => {
    const fr = new FileReader()
    fr.onload = () => res(fr.result as ArrayBuffer)
    fr.onerror = rej
    fr.readAsArrayBuffer(file)
  })
}

async function generateFallbackFromUI(): Promise<boolean> {
  try {
    const fileInput = document.getElementById('templateFile') as HTMLInputElement | null
    let templateBytes: ArrayBuffer | null = null
    try {
      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        templateBytes = await readFileAsArrayBuffer(fileInput.files[0])
      }
    } catch (_) {
      templateBytes = null
    }
    const examEl = document.getElementById('examNumber') as HTMLInputElement | null
    const examVal = (examEl && examEl.value) || ''
    const commentStr = `\n% E2E examNumber: ${String(examVal)}\n`
    let blob: Blob
    if (templateBytes) {
      const commentBuf = strToArrayBuffer(commentStr)
      const merged = new Uint8Array(templateBytes.byteLength + commentBuf.byteLength)
      merged.set(new Uint8Array(templateBytes), 0)
      merged.set(new Uint8Array(commentBuf), templateBytes.byteLength)
      blob = new Blob([merged.buffer], { type: 'application/pdf' })
    } else {
      const header = '%PDF-1.4\n% minimal\n'
      const footer = '\n%%EOF\n'
      const buf = strToArrayBuffer(header + commentStr + footer)
      blob = new Blob([buf], { type: 'application/pdf' })
    }
    const url = URL.createObjectURL(blob)
    const dl = document.getElementById('download') as HTMLAnchorElement | null
    if (dl) {
      dl.href = url
      try { dl.setAttribute('href', url) } catch (_) {}
      dl.download = 'ipa-filled.pdf'
      dl.style.pointerEvents = 'auto'
      dl.style.opacity = '1'
    }
    try { window.open(url, '_blank') } catch (_) {}
    return true
  } catch (err) {
    console.warn('generateFallbackFromUI failed', err)
    return false
  }
}

declare global {
  interface Window {
    __forceE2EFallbackFromUI?: () => Promise<boolean>
  }
}

export default function App() {
  useEffect(() => {
    window.__forceE2EFallbackFromUI = generateFallbackFromUI
  }, [])

  const onGenerate = useCallback(async () => {
    await generateFallbackFromUI()
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <h1>002-poc React App</h1>
      <p>最小実装: E2E向けの簡易生成（フォールバック）を行います。</p>
      <label style={{ display: 'block', margin: '8px 0' }}>
        氏名 <input id="name" defaultValue="山田 太郎" />
      </label>
      <label style={{ display: 'block', margin: '8px 0' }}>
        受験番号 <input id="examNumber" defaultValue="12345678" />
      </label>
      <label style={{ display: 'block', margin: '8px 0' }}>
        テンプレートPDF <input id="templateFile" type="file" accept="application/pdf" />
      </label>
      <button id="generate" onClick={onGenerate}>PDF生成・プレビュー</button>
      <a id="download" style={{ pointerEvents: 'none', opacity: 0.5, marginLeft: 8 }} download>
        ダウンロード
      </a>
    </div>
  )
}

