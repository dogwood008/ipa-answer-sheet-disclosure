/*
  TS port of public/poc-script.js with minimal typing.
  Depends on global UMD: PDFLib, pdfjsLib, fontkit (loaded in index.html).
*/

declare const PDFLib: any
declare const pdfjsLib: any
declare const fontkit: any

declare global {
  interface Window {
    __lastSelectedColorHex?: string
    __lastPdfColorRGB?: { r: number; g: number; b: number }
    __embeddedFontEmbedded?: boolean
    __embeddedFontName?: string
    __circleDrawn?: boolean
    __rectDrawn?: boolean
    __lastRect?: { x: number; y: number; w: number; h: number }
  }
}

let PDFDocument: any, rgb: any, StandardFonts: any
if (typeof PDFLib !== 'undefined' && PDFLib) { ({ PDFDocument, rgb, StandardFonts } = PDFLib) }
else { PDFDocument = undefined; rgb = () => ({ r: 0, g: 0, b: 0 }); StandardFonts = {} }

const NOTO_CSS_URL = 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap'
const log = (s: string) => { try { const el = document.getElementById('log'); if (el) el.textContent += s + "\n" } catch { } }

const NAMED_COLOR_HEX: Record<string, string> = { black: '#000000', red: '#FF0000', green: '#008000', blue: '#0000FF', white: '#FFFFFF' }
function normalizeHex(hex?: string | null) {
  if (!hex || typeof hex !== 'string') return null
  const v = hex.trim()
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return null
  if (v.length === 4) { const r = v[1], g = v[2], b = v[3]; return ('#' + r + r + g + g + b + b).toUpperCase() }
  return v.toUpperCase()
}
function namedToHex(name?: string | null) {
  if (!name || typeof name !== 'string') return null
  const key = name.trim().toLowerCase()
  if (NAMED_COLOR_HEX[key]) return NAMED_COLOR_HEX[key]
  try {
    if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') return null
    const el = document.createElement('span')
    try { (el.style as any).all = 'initial' } catch { }
    el.style.position = 'fixed'; el.style.left = '-9999px'; el.style.top = '-9999px'
    el.style.visibility = 'hidden'; el.style.display = 'block'; el.style.pointerEvents = 'none'
    el.style.color = key
    const parent = document.body || document.documentElement
    parent.appendChild(el)
    const rgbStr = getComputedStyle(el).color || ''
    parent.removeChild(el)
    const m = rgbStr.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)
    if (m) {
      const r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10)
      const to2 = (n: number) => n.toString(16).padStart(2, '0')
      return ('#' + to2(r) + to2(g) + to2(b)).toUpperCase()
    }
  } catch { }
  return null
}
function normalizeColor(input?: string) {
  if (typeof input !== 'string') return '#000000'
  const t = input.trim(); const hx = normalizeHex(t); if (hx) return hx; const nm = namedToHex(t); if (nm) return nm; return '#000000'
}
function hexToRgb01(hex?: string) {
  const h = normalizeHex(hex) || '#000000'
  return { r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 }
}
let __selectedColorHex = '#000000'
function setSelectedColor(hex: string) {
  __selectedColorHex = normalizeColor(hex)
  try {
    const picker = document.getElementById('colorPicker') as HTMLInputElement | null
    if (picker && typeof picker.value !== 'undefined') { try { picker.value = __selectedColorHex } catch { } }
    const sw = document.getElementById('colorSwatch') as HTMLElement | null
    const val = document.getElementById('colorValue') as HTMLElement | null
    if (sw) { (sw.style as any).background = __selectedColorHex; sw.setAttribute('title', __selectedColorHex) }
    if (val) val.textContent = __selectedColorHex
    window.__lastSelectedColorHex = __selectedColorHex
  } catch { }
}
function setupColorControls() {
  try {
    const btnBlack = document.getElementById('presetBlack')
    const btnRed = document.getElementById('presetRed')
    const picker = document.getElementById('colorPicker')
    const nameInput = document.getElementById('colorName')
    if (btnBlack) btnBlack.addEventListener('click', () => setSelectedColor('#000000'))
    if (btnRed) btnRed.addEventListener('click', () => setSelectedColor('#FF0000'))
    if (picker) picker.addEventListener('input', (e: any) => setSelectedColor(e.target.value))
    if (nameInput) nameInput.addEventListener('change', (e: any) => setSelectedColor(String(e.target.value || '')))
    setSelectedColor('#000000')
  } catch { }
}

const HEIGHT_PT = 842
const fieldMap = [
  { key: 'furigana', x: 218, y: HEIGHT_PT - 146, size: 11, type: 'text', width: 386 - 146, maxLines: 2 },
  { key: 'name', x: 218, y: HEIGHT_PT - 162, size: 14, type: 'text', width: 386 - 146, maxLines: 2 },
  { key: 'examNumber', x: 420, y: 720, size: 12, type: 'text', width: 120, maxLines: 1 },
  { key: 'emojiCheck', x: 250, y: HEIGHT_PT - 150, size: 12, type: 'text', maxLines: 1 },
] as const

const CIRCLE_POS = { x: 100, y: 680, r: 10 }
// Fixed-position check mark (always rendered; no HTML input)
const EMOJI_CHECK_POS = { x: 140, y: 660, size: 16 }
function setupCircleRadioListener() {
  try {
    const radios = document.querySelectorAll('input[name="drawCircle"]')
    radios.forEach((r) => {
      r.addEventListener('change', () => {
        const checked = document.querySelector('input[name="drawCircle"]:checked') as HTMLInputElement | null
        log(`円の描画オプションが変更されました: ${checked ? checked.value : 'nodraw'}`)
      })
    })
  } catch { }
}
function getDrawCircleOption() {
  try { const checked = document.querySelector('input[name="drawCircle"]:checked') as HTMLInputElement | null; return checked ? checked.value : 'nodraw' } catch { return 'nodraw' }
}

function parseRectInputs(xv: any, yv: any, wv: any, hv: any) {
  const x = Number.parseFloat(xv), y = Number.parseFloat(yv), w = Number.parseFloat(wv), h = Number.parseFloat(hv)
  const valid = Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0
  return { x, y, w, h, valid }
}

function readFileAsArrayBuffer(file: File) {
  return new Promise<ArrayBuffer>((res, rej) => {
    const fr = new FileReader()
    fr.onload = () => res(fr.result as ArrayBuffer)
    fr.onerror = rej
    fr.readAsArrayBuffer(file)
  })
}
async function loadFontFaceFromFile(file: File) {
  const blobUrl = URL.createObjectURL(file)
  const family = 'UploadedFont_' + Date.now()
  try {
    const fontFace = new FontFace(family, `url(${blobUrl})`)
    await fontFace.load(); (document as any).fonts.add(fontFace)
    URL.revokeObjectURL(blobUrl)
    return family
  } catch (e) { try { URL.revokeObjectURL(blobUrl) } catch { } throw e }
}
async function loadNotoFromGoogleFonts() {
  const cssRes = await fetch(NOTO_CSS_URL, { mode: 'cors' })
  if (!cssRes.ok) throw new Error('failed to fetch Google Fonts CSS: ' + cssRes.status)
  const cssText = await cssRes.text()
  const m = cssText.match(/url\((https?:[^)]+)\) format\('woff2'\)/i) || cssText.match(/url\((https?:[^)]+)\)/i)
  if (!m) throw new Error('no font URL found in CSS')
  const fontUrl = m[1].replace(/"/g, '').replace(/'/g, '')
  const family = 'NotoSansJP_Google'
  const fontFace = new FontFace(family, `url(${fontUrl}) format('woff2')`)
  await fontFace.load(); (document as any).fonts.add(fontFace)
  return family
}

const CSS_DPI = 96, PDF_DPI = 72, PIXELS_PER_POINT = CSS_DPI / PDF_DPI
async function renderFirstPageToPngViaPDFJS(arrayBuffer: ArrayBuffer, scale = 2) {
  if (typeof pdfjsLib === 'undefined') throw new Error('PDF.js が読み込まれていません')
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale })
  const baseViewport = page.getViewport({ scale: 1 })
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  await page.render({ canvasContext: ctx, viewport }).promise
  const dataUrl = canvas.toDataURL('image/png')
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const len = binary.length
  const buf = new Uint8Array(len)
  for (let i = 0; i < len; i++) buf[i] = binary.charCodeAt(i)
  return { bytes: buf.buffer, width: canvas.width, height: canvas.height, widthPts: baseViewport.width, heightPts: baseViewport.height }
}

let __uiInited = false
function ensureUiInit() { if (__uiInited) return; try { setupCircleRadioListener() } catch { } try { setupColorControls() } catch { } __uiInited = true }
function syncSelectedColorFromInputs() {
  try {
    const picker = document.getElementById('colorPicker') as HTMLInputElement | null
    const nameInput = document.getElementById('colorName') as HTMLInputElement | null
    const v = (picker && picker.value) ? picker.value : ((nameInput && nameInput.value) ? nameInput.value : null)
    if (v) setSelectedColor(String(v))
  } catch { }
}

function renderTextToPngBytes(text: string, fontFamily: string, fontSizePx: number, maxWidthPx: number | null = null, maxLines = 1, colorHex = '#000000') {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='
    const binary = atob(base64); const len = binary.length; const buf = new Uint8Array(len); for (let i = 0; i < len; i++) buf[i] = binary.charCodeAt(i); return { bytes: buf.buffer, widthPx: 1, heightPx: 1, ascentPx: 0, paddingTop: 0 }
  }
  const sidePadding = 10
  ctx.fillStyle = colorHex
  let fontPx = fontSizePx
  ctx.textBaseline = 'alphabetic'
  if (!maxWidthPx) maxWidthPx = Math.round(fontPx * 20)
  function layoutLinesForFontSize(fs: number) {
    ctx.font = `${fs}px "${fontFamily}", sans-serif`
    const words = String(text).split(/(\s+)/)
    const lines: string[] = []
    let cur = ''
    for (const w of words) {
      const test = cur ? (cur + w) : w
      const m = ctx.measureText(test)
      if (m.width + sidePadding * 2 <= (maxWidthPx as number) || cur === '') { cur = test } else { lines.push(cur.trimEnd()); cur = (w as string).trimStart() }
    }
    if (cur) lines.push(cur)
    return lines
  }
  let lines = layoutLinesForFontSize(fontPx)
  const minFontPx = 8
  while (lines.length > maxLines && fontPx > minFontPx) { fontPx = Math.max(minFontPx, fontPx - 1); lines = layoutLinesForFontSize(fontPx) }
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines)
    const last = lines[lines.length - 1]
    ctx.font = `${fontPx}px "${fontFamily}", sans-serif`
    let truncated = last
    while (ctx.measureText(truncated + '…').width + sidePadding * 2 > (maxWidthPx as number) && truncated.length > 0) { truncated = truncated.slice(0, -1) }
    lines[lines.length - 1] = truncated + '…'
  }
  ctx.font = `${fontPx}px "${fontFamily}", sans-serif`
  let maxW = 0, maxAsc = 0, maxDesc = 0
  for (const l of lines) {
    const m = ctx.measureText(l)
    if (m.width > maxW) maxW = m.width
    const asc = Number.isFinite((m as any).actualBoundingBoxAscent) ? (m as any).actualBoundingBoxAscent : fontPx * 0.88
    const desc = Number.isFinite((m as any).actualBoundingBoxDescent) ? (m as any).actualBoundingBoxDescent : fontPx * 0.26
    if (asc > maxAsc) maxAsc = asc
    if (desc > maxDesc) maxDesc = desc
  }
  const lineH = Math.max(Math.ceil(fontPx * 1.3), Math.ceil((maxAsc + maxDesc) * 1.05))
  const paddingTop = Math.max(sidePadding, Math.ceil(maxAsc * 0.25) + 6)
  const width = Math.ceil(maxW) + sidePadding * 2
  const height = paddingTop + (lineH * lines.length) + sidePadding
  canvas.width = width; canvas.height = height
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = colorHex; ctx.font = `${fontPx}px "${fontFamily}", sans-serif`
  ctx.textBaseline = 'alphabetic'
  const baselineY0 = paddingTop + maxAsc
  for (let i = 0; i < lines.length; i++) { const y = baselineY0 + i * lineH; ctx.fillText(lines[i], sidePadding, y) }
  const dataUrl = canvas.toDataURL('image/png')
  const base64 = dataUrl.split(',')[1]; const binary = atob(base64); const len = binary.length; const buf = new Uint8Array(len); for (let i = 0; i < len; i++) buf[i] = binary.charCodeAt(i)
  return { bytes: buf.buffer, widthPx: width, heightPx: height, ascentPx: Math.round(maxAsc), paddingTop }
}
async function embedPngBytesAsPdfImage(targetDoc: any, png: { bytes: ArrayBuffer }) { const pngImage = await targetDoc.embedPng(png.bytes); const widthPts = pngImage.width / PIXELS_PER_POINT; const heightPts = pngImage.height / PIXELS_PER_POINT; return { pngImage, widthPts, heightPts } }

export async function generate() {
  try {
    ensureUiInit(); syncSelectedColorFromInputs()
    let templateBytes: ArrayBuffer | null = null
    const fileInput = document.getElementById('templateFile') as HTMLInputElement | null
    if (fileInput && fileInput.files && fileInput.files.length > 0) { templateBytes = await readFileAsArrayBuffer(fileInput.files[0]) }

    const outDoc = PDFDocument ? await PDFDocument.create() : null
    let page: any = null
    if (PDFDocument) {
      if (templateBytes) {
        try {
          const DPI_SCALE = 300 / 72
          const bg = await renderFirstPageToPngViaPDFJS(templateBytes, DPI_SCALE)
          const bgImage = await outDoc.embedPng(bg.bytes)
          page = outDoc.addPage([bg.widthPts, bg.heightPts])
          page.drawImage(bgImage, { x: 0, y: 0, width: bg.widthPts, height: bg.heightPts })
        } catch (e: any) {
          log('テンプレートのラスタ化に失敗: ' + (e && e.message)); page = outDoc.addPage([612, 792])
        }
      } else { page = outDoc.addPage([612, 792]) }
    }

    // Fonts
    let font: any = null
    let uploadedFontFamily: string | null = null
    let notoFontFamily: string | null = null
    if (PDFDocument) {
      try { if (typeof fontkit !== 'undefined' && typeof outDoc.registerFontkit === 'function') outDoc.registerFontkit(fontkit) } catch { }
      try {
        const fontInput = document.getElementById('fontFile') as HTMLInputElement | null
        if (fontInput && fontInput.files && fontInput.files.length > 0) {
          const fontBytes = await readFileAsArrayBuffer(fontInput.files[0]); font = await outDoc.embedFont(fontBytes); window.__embeddedFontEmbedded = true
          try { uploadedFontFamily = await loadFontFaceFromFile(fontInput.files[0]) } catch { }
        }
      } catch { }
      if (!font) {
        const candidates = ['/NotoSansJP-Regular.ttf', 'NotoSansJP-Regular.ttf']
        for (const path of candidates) {
          try { const res = await fetch(path); if (res && res.ok) { const ab = await res.arrayBuffer(); font = await outDoc.embedFont(new Uint8Array(ab)); window.__embeddedFontEmbedded = true; window.__embeddedFontName = 'NotoSansJP-Regular.ttf'; break } } catch { }
        }
      }
      if (!font) { try { font = await outDoc.embedFont(StandardFonts.Helvetica) } catch { } }
      if (!uploadedFontFamily) { try { notoFontFamily = await loadNotoFromGoogleFonts() } catch { } }
    }

    const textInputs = {
      furigana: (document.getElementById('furigana') as HTMLInputElement | null)?.value,
      name: (document.getElementById('name') as HTMLInputElement | null)?.value,
      examNumber: (document.getElementById('examNumber') as HTMLInputElement | null)?.value,
    }
    const selHex = (typeof __selectedColorHex === 'string') ? __selectedColorHex : '#000000'
    const pdfRGB = hexToRgb01(selHex); window.__lastPdfColorRGB = pdfRGB

    if (PDFDocument) {
      for (const f of fieldMap as readonly any[]) {
        const v = (textInputs as any)[f.key]; if (v == null) continue
        const x = f.x, y = f.y
        const tryPdfText = async () => {
          if (!font) throw new Error('no font')
          if (f.width) {
            let pt = f.size; const minPt = 6; const maxW = f.width
            const layout = (p: number) => { const words = String(v).split(/(\s+)/); const lines: string[] = []; let cur = ''; for (const w of words) { const test = cur ? (cur + w) : w; const m = font.widthOfTextAtSize(test, p); if (m <= maxW || cur === '') { cur = test } else { lines.push(cur.trimEnd()); cur = (w as string).trimStart() } } if (cur) lines.push(cur); return lines }
            let lines = layout(pt); while (lines.length > (f.maxLines || 1) && pt > minPt) { pt = Math.max(minPt, pt - 1); lines = layout(pt) }
            if (lines.length > (f.maxLines || 1)) { lines = lines.slice(0, f.maxLines || 1); let last = lines[lines.length - 1]; while (font.widthOfTextAtSize(last + '…', pt) > maxW && last.length > 0) { last = last.slice(0, -1) } lines[lines.length - 1] = last + '…' }
            const leading = pt * 1.2
            for (let i = 0; i < lines.length; i++) { page.drawText(lines[i], { x, y: y - i * leading, size: pt, font, color: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b) }) }
          } else {
            page.drawText(String(v), { x, y, size: f.size, font, color: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b) })
          }
        }
        try { if (font) { await tryPdfText() } else { throw new Error('no-embedded-font') } }
        catch {
          const family = uploadedFontFamily || notoFontFamily || 'Noto Sans JP, NotoSansJP, system-ui, sans-serif'
          const px = Math.round(f.size * PIXELS_PER_POINT)
          const maxWidthPx = f.width ? Math.round(f.width * PIXELS_PER_POINT) : null
          const png = renderTextToPngBytes(String(v), family, px, maxWidthPx, f.maxLines || 1, __selectedColorHex)
          try {
            const { pngImage, widthPts, heightPts } = await embedPngBytesAsPdfImage(outDoc, png)
            const ascentPts = (png.ascentPx != null ? png.ascentPx : Math.round(px * 0.86)) / PIXELS_PER_POINT
            const topPaddingPts = (png.paddingTop || 0) / PIXELS_PER_POINT
            const topY = y - (ascentPts + topPaddingPts)
            page.drawImage(pngImage, { x, y: topY, width: widthPts, height: heightPts })
          } catch { }
        }
      }

      // Draw fixed-position emoji check (✔) as vector when possible
      // Fallback to vector path: draw a simple check mark with two lines
      try {
        const colorV = rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b)
        const x = EMOJI_CHECK_POS.x, y = EMOJI_CHECK_POS.y
        const t = Math.max(1, Math.min(2.4, EMOJI_CHECK_POS.size / 10))
        page.drawLine({ start: { x: x - 3, y: y + 2 }, end: { x: x + 1, y: y - 4 }, thickness: t, color: colorV })
        page.drawLine({ start: { x: x + 1, y: y - 4 }, end: { x: x + 10, y: y + 6 }, thickness: t, color: colorV })
      } catch {}

      try {
        const opt = getDrawCircleOption();
        if (opt === 'draw') {
          if (typeof page.drawCircle === 'function') page.drawCircle({ x: CIRCLE_POS.x, y: CIRCLE_POS.y, size: CIRCLE_POS.r, borderColor: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b), borderWidth: 1 })
          else if (typeof page.drawEllipse === 'function') page.drawEllipse({ x: CIRCLE_POS.x, y: CIRCLE_POS.y, xScale: CIRCLE_POS.r, yScale: CIRCLE_POS.r, borderColor: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b), borderWidth: 1 })
          window.__circleDrawn = true
        } else { window.__circleDrawn = false }
      } catch { }

      try {
        const rectToggle = document.getElementById('drawRect') as HTMLInputElement | null
        const wantRect = !!(rectToggle && rectToggle.checked)
        if (wantRect) {
          const rx = (document.getElementById('rectX') as HTMLInputElement).value
          const ry = (document.getElementById('rectY') as HTMLInputElement).value
          const rw = (document.getElementById('rectW') as HTMLInputElement).value
          const rh = (document.getElementById('rectH') as HTMLInputElement).value
          const parsed = parseRectInputs(rx, ry, rw, rh)
          if (parsed.valid) {
            let yBottom = parsed.y; try { const size = page.getSize ? page.getSize() : { width: 595, height: 842 }; yBottom = size.height - parsed.y - parsed.h } catch { }
            if (typeof page.drawRectangle === 'function') page.drawRectangle({ x: parsed.x, y: yBottom, width: parsed.w, height: parsed.h, borderColor: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b), borderWidth: 1 })
            window.__rectDrawn = true; window.__lastRect = { x: parsed.x, y: yBottom, w: parsed.w, h: parsed.h }
          } else { window.__rectDrawn = false }
        } else { window.__rectDrawn = false }
      } catch { }
    }

    let pdfBuffer: ArrayBuffer
    if (PDFDocument) { const pdfBytes = await outDoc.save(); pdfBuffer = pdfBytes } else {
      const enc = new TextEncoder(); const esc = (s: string) => String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
      const chunks: string[] = []; let off = 0; const push = (t: string) => { chunks.push(t); off += enc.encode(t).byteLength }
      push('%PDF-1.4\n'); const off1 = off; push('1 0 obj\n'); push('<< /Type /Catalog /Pages 2 0 R >>\n'); push('endobj\n'); const off2 = off; push('2 0 obj\n'); push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n'); push('endobj\n'); const off3 = off; push('3 0 obj\n'); push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\n'); push('endobj\n'); const off4 = off; push('4 0 obj\n'); push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n'); push('endobj\n'); const content = `BT /F1 16 Tf 72 720 Td (${esc(textInputs.name || '')}) Tj ET\nBT /F1 12 Tf 72 700 Td (${esc(textInputs.examNumber || '')}) Tj ET\n`; const len = enc.encode(content).byteLength; const off5 = off; push('5 0 obj\n'); push(`<< /Length ${len} >>\n`); push('stream\n'); push(content); push('endstream\n'); push('endobj\n'); const xref = off; push('xref\n'); push('0 6\n'); push('0000000000 65535 f \n'); const pad10 = (n: number) => { const s = String(n); return s.length >= 10 ? s : '0'.repeat(10 - s.length) + s }; push(`${pad10(off1)} 00000 n \n`); push(`${pad10(off2)} 00000 n \n`); push(`${pad10(off3)} 00000 n \n`); push(`${pad10(off4)} 00000 n \n`); push(`${pad10(off5)} 00000 n \n`); push('trailer\n'); push('<< /Size 6 /Root 1 0 R >>\n'); push('startxref\n'); push(String(xref) + '\n'); push('%%EOF\n'); pdfBuffer = enc.encode(chunks.join('')).buffer
    }

    const blob = new Blob([pdfBuffer], { type: 'application/pdf' }); const url = URL.createObjectURL(blob)
    try { window.open(url, '_blank') } catch { }
    const dl = document.getElementById('download') as HTMLAnchorElement | null; if (dl) { dl.href = url; dl.download = 'ipa-filled.pdf'; (dl.style as any).pointerEvents = 'auto'; (dl.style as any).opacity = '1' }
    const ifr = document.getElementById('preview') as HTMLIFrameElement | null; if (ifr && ifr.tagName === 'IFRAME') { try { ifr.src = url } catch { } }
    log('生成完了')
  } catch (e: any) { log('エラー: ' + (e && e.message || String(e))); console.error(e) }
}

try {
  const btn = document.getElementById('generate'); if (btn) btn.addEventListener('click', () => { ensureUiInit(); generate() })
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => ensureUiInit()); else ensureUiInit()
  document.addEventListener('click', (ev: any) => {
    const t = ev.target && ev.target.closest ? ev.target.closest('button, a, input, span') : null
    if (!t) return; const id = t.id || ''
    if (id === 'presetBlack') setSelectedColor('#000000')
    else if (id === 'presetRed') setSelectedColor('#FF0000')
  })
  document.addEventListener('input', (ev: any) => { const t = ev.target || {} as any; if (t && t.id === 'colorPicker') { try { setSelectedColor(t.value) } catch { } } })
  document.addEventListener('change', (ev: any) => { const t = ev.target || {} as any; if (t && t.id === 'colorName') { try { setSelectedColor(String(t.value || '')) } catch { } } })
} catch (e) { console.warn('init failed', e) }

// Expose for existing onClick handlers (compat with previous global script)
;(window as any).generate = generate
