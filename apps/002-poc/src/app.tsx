import React, { useEffect, useRef, useState } from 'react';
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import * as pdfjsLib from 'pdfjs-dist'
// Vite worker url for PDF.js (use .mjs in v5+)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  ; (pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import notoAssetUrl from '../NotoSansJP-Regular.ttf?url'

type RGB01 = { r: number; g: number; b: number }

const NOTO_CSS_URL = 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap'
const CSS_DPI = 96, PDF_DPI = 72, PIXELS_PER_POINT = CSS_DPI / PDF_DPI
const CIRCLE_POS = { x: 100, y: 680, r: 10 }
const HEIGHT_PT = 842

declare global {
  interface Window {
    __lastSelectedColorHex?: string
    __embeddedFontEmbedded?: boolean
    __embeddedFontName?: string
    __lastPdfColorRGB?: RGB01
    __circleDrawn?: boolean
    __rectDrawn?: boolean
    __lastRect?: { x: number; y: number; w: number; h: number }
  }
}

type FieldText = { type: 'text'; key: 'furigana' | 'name' | 'examNumber' | 'tel1' | 'tel2' | 'tel3'; x: number; y: number; size: number; width?: number; maxLines?: number }
type FieldCheck = { type: 'check'; x: number; y: number; size: number }
type Field = FieldText | FieldCheck

const fieldMap: Field[] = [
  { type: 'text', key: 'furigana', x: 218, y: HEIGHT_PT - 146, size: 11, width: 386 - 146, maxLines: 2 },
  { type: 'text', key: 'name', x: 218, y: HEIGHT_PT - 162, size: 14, width: 386 - 146, maxLines: 2 },
  { type: 'text', key: 'examNumber', x: 420, y: 720, size: 12, width: 120, maxLines: 1 },
  { type: 'check', x: 140, y: 660, size: 16 },
]

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
    try { if ('all' in el.style) (el.style as unknown as { all?: string }).all = 'initial' } catch (e) { console.warn('namedToHex: reset style.all failed', e) }
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
  } catch (e) { console.warn('namedToHex: failed to resolve named color', e) }
  return null
}
function normalizeColor(input?: string) {
  if (typeof input !== 'string') return '#000000'
  const t = input.trim(); const hx = normalizeHex(t); if (hx) return hx; const nm = namedToHex(t); if (nm) return nm; return '#000000'
}
function hexToRgb01(hex?: string): RGB01 {
  const h = normalizeHex(hex) || '#000000'
  return { r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 }
}
function parseRectInputs(xv: string | number | null | undefined, yv: string | number | null | undefined, wv: string | number | null | undefined, hv: string | number | null | undefined) {
  const x = Number.parseFloat(String(xv)), y = Number.parseFloat(String(yv)), w = Number.parseFloat(String(wv)), h = Number.parseFloat(String(hv))
  const valid = Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0
  return { x, y, w, h, valid }
}
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
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
    await fontFace.load(); document.fonts.add(fontFace)
    URL.revokeObjectURL(blobUrl)
    return family
  } catch (e) { try { URL.revokeObjectURL(blobUrl) } catch (revokeErr) { console.warn('loadFontFaceFromFile: revokeObjectURL failed', revokeErr) } throw e }
}
async function loadNotoFromGoogleFonts() {
  const cssRes = await fetch(NOTO_CSS_URL, { mode: 'cors' })
  if (!cssRes.ok) throw new Error('failed to fetch Google Fonts CSS: ' + cssRes.status)
  const cssText = await cssRes.text()
  const m = cssText.match(/url\((https?:[^)]+)\) format\('woff2'\)/i) || cssText.match(/url\((https?:[^)]+)\)/i)
  if (!m) throw new Error('no font URL found in CSS')
  const fontUrl = m[1].replace(/\"/g, '').replace(/'/g, '')
  const family = 'NotoSansJP_Google'
  const fontFace = new FontFace(family, `url(${fontUrl}) format('woff2')`)
  await fontFace.load(); document.fonts.add(fontFace)
  return family
}
type FirstPagePng = { bytes: ArrayBuffer; width: number; height: number; widthPts: number; heightPts: number }
type PDFJSViewport = { width: number; height: number }
type PDFJSPage = { getViewport: (opts: { scale: number }) => PDFJSViewport; render: (params: { canvasContext: CanvasRenderingContext2D; viewport: PDFJSViewport }) => { promise: Promise<void> } }
type PDFJSDocument = { getPage: (pageNumber: number) => Promise<PDFJSPage> }
type PDFJSLoadingTask<T> = { promise: Promise<T> }
async function renderFirstPageToPngViaPDFJS(arrayBuffer: ArrayBuffer, scale = 2): Promise<FirstPagePng> {
  const getDocument = (pdfjsLib as unknown as { getDocument: (cfg: { data: ArrayBuffer }) => PDFJSLoadingTask<PDFJSDocument> }).getDocument
  const loadingTask = getDocument({ data: arrayBuffer })
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
  const effectiveMaxWidth = maxWidthPx ?? Math.round(fontPx * 20)
  function layoutLinesForFontSize(fs: number) {
    ctx.font = `${fs}px "${fontFamily}", sans-serif`
    const words = String(text).split(/(\s+)/)
    const lines: string[] = []
    let cur = ''
    for (const w of words) {
      const test = cur ? (cur + w) : w
      const m = ctx.measureText(test)
      if (m.width + sidePadding * 2 <= effectiveMaxWidth || cur === '') { cur = test } else { lines.push(cur.trimEnd()); cur = w.trimStart() }
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
    while (ctx.measureText(truncated + '…').width + sidePadding * 2 > effectiveMaxWidth && truncated.length > 0) { truncated = truncated.slice(0, -1) }
    lines[lines.length - 1] = truncated + '…'
  }
  ctx.font = `${fontPx}px "${fontFamily}", sans-serif`
  let maxW = 0, maxAsc = 0, maxDesc = 0
  for (const l of lines) {
    const m = ctx.measureText(l)
    if (m.width > maxW) maxW = m.width
    const asc = Number.isFinite((m as unknown as { actualBoundingBoxAscent?: number }).actualBoundingBoxAscent ?? NaN)
      ? ((m as unknown as { actualBoundingBoxAscent: number }).actualBoundingBoxAscent)
      : fontPx * 0.88
    const desc = Number.isFinite((m as unknown as { actualBoundingBoxDescent?: number }).actualBoundingBoxDescent ?? NaN)
      ? ((m as unknown as { actualBoundingBoxDescent: number }).actualBoundingBoxDescent)
      : fontPx * 0.26
    if (asc > maxAsc) maxAsc = asc
    if (desc > maxDesc) maxDesc = desc
  }
  const lineH = Math.max(Math.ceil(fontPx * 1.3), Math.ceil((maxAsc + maxDesc) * 1.05))
  const paddingTop = Math.max(10, Math.ceil(maxAsc * 0.25) + 6)
  const width = Math.ceil(maxW) + 20
  const height = paddingTop + (lineH * lines.length) + 10
  canvas.width = width; canvas.height = height
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = colorHex; ctx.font = `${fontPx}px "${fontFamily}", sans-serif`
  ctx.textBaseline = 'alphabetic'
  const baselineY0 = paddingTop + maxAsc
  for (let i = 0; i < lines.length; i++) { const y = baselineY0 + i * lineH; ctx.fillText(lines[i], 10, y) }
  const dataUrl = canvas.toDataURL('image/png')
  const base64 = dataUrl.split(',')[1]; const binary = atob(base64); const len = binary.length; const buf = new Uint8Array(len); for (let i = 0; i < len; i++) buf[i] = binary.charCodeAt(i)
  return { bytes: buf.buffer, widthPx: width, heightPx: height, ascentPx: Math.round(maxAsc), paddingTop }
}
async function embedPngBytesAsPdfImage(targetDoc: PDFDocument, png: { bytes: ArrayBuffer }) {
  const pngImage = await targetDoc.embedPng(png.bytes)
  const widthPts = pngImage.width / PIXELS_PER_POINT
  const heightPts = pngImage.height / PIXELS_PER_POINT
  return { pngImage, widthPts, heightPts }
}

export default function App() {
  const furiganaRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const examRef = useRef<HTMLInputElement>(null)
  const rectXRef = useRef<HTMLInputElement>(null)
  const rectYRef = useRef<HTMLInputElement>(null)
  const rectWRef = useRef<HTMLInputElement>(null)
  const rectHRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)

  const [drawCircle, setDrawCircle] = useState<'draw' | 'nodraw'>('nodraw')
  const [drawRect, setDrawRect] = useState<boolean>(false)
  const [selectedColor, setSelectedColor] = useState<string>('#000000')
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [fontFile, setFontFile] = useState<File | null>(null)
  const [downloadHref, setDownloadHref] = useState<string>('')

  useEffect(() => {
    // keep UI swatch/value in sync and expose selected color for tests
    try {
      const sw = document.getElementById('colorSwatch')
      const val = document.getElementById('colorValue')
      if (sw) { sw.style.background = selectedColor; sw.setAttribute('title', selectedColor) }
      if (val) val.textContent = selectedColor
      window.__lastSelectedColorHex = selectedColor
    } catch (e) { console.warn('color UI sync failed', e) }
  }, [selectedColor])

  const handlePresetBlack = () => setSelectedColor('#000000')
  const handlePresetRed = () => setSelectedColor('#FF0000')
  const handleColorPicker = (e: React.ChangeEvent<HTMLInputElement>) => setSelectedColor(normalizeColor(e.target.value))
  const handleColorName = (e: React.ChangeEvent<HTMLInputElement>) => setSelectedColor(normalizeColor(e.target.value))

  const handleGenerate = async () => {
    try {
      // Clear previous blob
      if (downloadHref) { try { URL.revokeObjectURL(downloadHref) } catch (e) { console.warn('revokeObjectURL(downloadHref) failed', e) } }

      const outDoc = await PDFDocument.create()
      // pdf-lib の Fontkit 型は外部パッケージのため型解決が難しいため、この行のみルールを抑制
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      try { outDoc.registerFontkit(fontkit as any) } catch (e) { console.warn('registerFontkit failed', e) }

      // Template background via PDF.js (if provided)
      let page: PDFPage
      if (templateFile) {
        try {
          const bytes = await readFileAsArrayBuffer(templateFile)
          const DPI_SCALE = 300 / 72
          const bg = await renderFirstPageToPngViaPDFJS(bytes, DPI_SCALE)
          const bgImage = await outDoc.embedPng(bg.bytes)
          page = outDoc.addPage([bg.widthPts, bg.heightPts])
          page.drawImage(bgImage, { x: 0, y: 0, width: bg.widthPts, height: bg.heightPts })
        } catch (e) { page = outDoc.addPage([612, 792]) }
      } else {
        page = outDoc.addPage([612, 792])
      }

      // Fonts
      let font: PDFFont | null = null
      let uploadedFontFamily: string | null = null
      let notoFontFamily: string | null = null
      try {
        if (fontFile) {
          const fontBytes = await readFileAsArrayBuffer(fontFile)
          font = await outDoc.embedFont(new Uint8Array(fontBytes))
          window.__embeddedFontEmbedded = true
          try { uploadedFontFamily = await loadFontFaceFromFile(fontFile) } catch (e) { console.warn('loadFontFaceFromFile failed', e) }
        }
      } catch (e) { console.warn('embed font from file failed', e) }
      if (!font) {
        const candidates = [notoAssetUrl, '/NotoSansJP-Regular.ttf', 'NotoSansJP-Regular.ttf']
        for (const path of candidates) {
          try {
            const res = await fetch(path);
            if (res && res.ok) {
              const ab = await res.arrayBuffer();
              font = await outDoc.embedFont(new Uint8Array(ab));
              window.__embeddedFontEmbedded = true;
              window.__embeddedFontName = 'NotoSansJP-Regular.ttf';
              break;
            }
          } catch (e) {
            console.warn('fallback font fetch/embed failed', e);
          }
        }
      }
      if (!font) { try { font = await outDoc.embedFont(StandardFonts.Helvetica) } catch (e) { console.warn('embed StandardFonts.Helvetica failed', e) } }
      if (!uploadedFontFamily) { try { notoFontFamily = await loadNotoFromGoogleFonts() } catch (e) { console.warn('loadNotoFromGoogleFonts failed', e) } }

      const textInputs = {
        furigana: furiganaRef.current?.value,
        name: nameRef.current?.value,
        examNumber: examRef.current?.value,
      }
      const selHex = (typeof selectedColor === 'string') ? selectedColor : '#000000'
      const pdfRGB = hexToRgb01(selHex); window.__lastPdfColorRGB = pdfRGB

      for (const f of fieldMap) {
        if (f.type === 'text') {
          const v = textInputs[f.key]
          if (v == null) continue
          const x = f.x, y = f.y
          const tryPdfText = (pdffont: PDFFont) => {
            if (f.width) {
              let pt = f.size; const minPt = 6; const maxW = f.width
              const layout = (p: number) => { const words = String(v).split(/(\s+)/); const lines: string[] = []; let cur = ''; for (const w of words) { const test = cur ? (cur + w) : w; const m = pdffont.widthOfTextAtSize(test, p); if (m <= maxW || cur === '') { cur = test } else { lines.push(cur.trimEnd()); cur = w.trimStart() } } if (cur) lines.push(cur); return lines }
              let lines = layout(pt); while (lines.length > (f.maxLines || 1) && pt > minPt) { pt = Math.max(minPt, pt - 1); lines = layout(pt) }
              if (lines.length > (f.maxLines || 1)) { lines = lines.slice(0, f.maxLines || 1); let last = lines[lines.length - 1]; while (pdffont.widthOfTextAtSize(last + '…', pt) > maxW && last.length > 0) { last = last.slice(0, -1) } lines[lines.length - 1] = last + '…' }
              const leading = pt * 1.2
              for (let i = 0; i < lines.length; i++) { page.drawText(lines[i], { x, y: y - i * leading, size: pt, font: pdffont, color: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b) }) }
            } else {
              page.drawText(String(v), { x, y, size: f.size, font: pdffont, color: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b) })
            }
          }
          if (font) {
            try { tryPdfText(font) } catch (e) { console.warn('draw text via embedded font failed; fallback to PNG', e) }
          } else {
            const family = uploadedFontFamily || notoFontFamily || 'Noto Sans JP, NotoSansJP, system-ui, sans-serif'
            const px = Math.round(f.size * PIXELS_PER_POINT)
            const maxWidthPx = f.width ? Math.round(f.width * PIXELS_PER_POINT) : null
            const png = renderTextToPngBytes(String(v), family, px, maxWidthPx, f.maxLines || 1, selectedColor)
            try {
              const { pngImage, widthPts, heightPts } = await embedPngBytesAsPdfImage(outDoc, png)
              const ascentPts = (png.ascentPx != null ? png.ascentPx : Math.round(px * 0.86)) / PIXELS_PER_POINT
              const topPaddingPts = (png.paddingTop || 0) / PIXELS_PER_POINT
              const topY = y - (ascentPts + topPaddingPts)
              page.drawImage(pngImage, { x, y: topY, width: widthPts, height: heightPts })
            } catch (e) { console.warn('embed/draw PNG text failed', e) }
          }
        } else if (f.type === 'check') {
          try {
            const colorV = rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b)
            const s = Math.max(0.5, f.size / 16)
            page.drawLine({ start: { x: f.x - 3 * s, y: f.y + 2 * s }, end: { x: f.x + 1 * s, y: f.y - 4 * s }, thickness: Math.max(1, 1.2 * s), color: colorV })
            page.drawLine({ start: { x: f.x + 1 * s, y: f.y - 4 * s }, end: { x: f.x + 10 * s, y: f.y + 6 * s }, thickness: Math.max(1, 1.2 * s), color: colorV })
          } catch (e) { console.warn('draw checkmark failed', e) }
        }
      }

      // Circle option
      try {
        if (drawCircle === 'draw') {
          page.drawCircle({ x: CIRCLE_POS.x, y: CIRCLE_POS.y, size: CIRCLE_POS.r, borderColor: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b), borderWidth: 1 })
          window.__circleDrawn = true
        } else { window.__circleDrawn = false }
      } catch (e) { console.warn('draw circle failed', e) }

      // Rect option
      try {
        if (drawRect) {
          const rx = rectXRef.current?.value
          const ry = rectYRef.current?.value
          const rw = rectWRef.current?.value
          const rh = rectHRef.current?.value
          const parsed = parseRectInputs(rx, ry, rw, rh)
          if (parsed.valid) {
            let yBottom = parsed.y; try { const size = page.getSize(); yBottom = size.height - parsed.y - parsed.h } catch (e) { console.warn('get page size failed', e) }
            page.drawRectangle({ x: parsed.x, y: yBottom, width: parsed.w, height: parsed.h, borderColor: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b), borderWidth: 1 })
            window.__rectDrawn = true; window.__lastRect = { x: parsed.x, y: yBottom, w: parsed.w, h: parsed.h }
          } else { window.__rectDrawn = false }
        } else { window.__rectDrawn = false }
      } catch (e) { console.warn('draw rectangle failed', e) }

      const pdfBytes = await outDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setDownloadHref(url)
      try { if (previewRef.current) previewRef.current.src = url } catch (e) { console.warn('update preview iframe failed', e) }
    } catch (e) {
      console.warn('handleGenerate failed', e)
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1>PoC: A4 PDF生成（IPA答案用紙） - 002 React</h1>

      <label htmlFor="furigana">ふりがな</label>
      <input id="furigana" ref={furiganaRef} defaultValue="やまだ たろう" />
      <label htmlFor="name">氏名</label>
      <input id="name" ref={nameRef} defaultValue="山田 太郎" />
      <label htmlFor="examNumber">受験番号</label>
      <input id="examNumber" ref={examRef} defaultValue="12345678" />

      <div id="circleOptions" style={{ margin: '8px 0' }}>
        <span style={{ marginRight: 8 }}>円の描画:</span>
        <input type="radio" name="drawCircle" id="drawCircleOn" value="draw" checked={drawCircle === 'draw'} onChange={() => setDrawCircle('draw')} />
        <label htmlFor="drawCircleOn" style={{ marginRight: 8 }}>描く</label>
        <input type="radio" name="drawCircle" id="drawCircleOff" value="nodraw" checked={drawCircle === 'nodraw'} onChange={() => setDrawCircle('nodraw')} />
        <label htmlFor="drawCircleOff">描かない</label>
      </div>

      <div id="rectOptions" style={{ margin: '8px 0' }}>
        <span style={{ marginRight: 8 }}>矩形の描画:</span>
        <input type="checkbox" id="drawRect" checked={drawRect} onChange={(e) => setDrawRect(e.target.checked)} />
        <label htmlFor="drawRect" style={{ marginRight: 8 }}>描く</label>
        <label htmlFor="rectX" style={{ marginRight: 8 }}>x:</label>
        <input id="rectX" ref={rectXRef} type="number" defaultValue={50} style={{ width: 80, marginRight: 8 }} />
        <label htmlFor="rectY" style={{ marginRight: 8 }}>y(上から):</label>
        <input id="rectY" ref={rectYRef} type="number" defaultValue={60} style={{ width: 80, marginRight: 8 }} />
        <label htmlFor="rectW" style={{ marginRight: 8 }}>width:</label>
        <input id="rectW" ref={rectWRef} type="number" defaultValue={100} style={{ width: 80, marginRight: 8 }} />
        <label htmlFor="rectH" style={{ marginRight: 8 }}>height:</label>
        <input id="rectH" ref={rectHRef} type="number" defaultValue={80} style={{ width: 80 }} />
      </div>

      <button id="generate" onClick={() => { void handleGenerate() }}>PDF生成・プレビュー</button>
      <a id="download" href={downloadHref || undefined} style={{ pointerEvents: downloadHref ? 'auto' : 'none', opacity: downloadHref ? 1 : 0.5, marginLeft: 8 }} download>ダウンロード</a>

      <h3>色の選択</h3>
      <div id="colorSection" style={{ margin: '8px 0' }}>
        <div style={{ marginBottom: 6 }}>
          <strong>プリセット:</strong>
          <button type="button" id="presetBlack" aria-label="黒に設定" style={{ marginLeft: 8, marginRight: 8 }} onClick={handlePresetBlack}>黒</button>
          <button type="button" id="presetRed" aria-label="赤に設定" onClick={handlePresetRed}>赤</button>
        </div>
        <div style={{ marginBottom: 6 }}>
          <label htmlFor="colorPicker"><strong>カラーピッカー:</strong></label>
          <input id="colorPicker" type="color" value={selectedColor} onChange={handleColorPicker} />
        </div>
        <div style={{ marginBottom: 6 }}>
          <label htmlFor="colorName"><strong>CSS 色名:</strong></label>
          <input id="colorName" type="text" placeholder="例: green" onChange={handleColorName} />
        </div>
        <div>
          <span>選択中の色プレビュー: </span>
          <span id="colorSwatch" aria-label="選択色プレビュー" title={selectedColor} style={{ display: 'inline-block', width: 20, height: 20, border: '1px solid #ccc', background: selectedColor, verticalAlign: 'middle' }}></span>
          <span id="colorValue" style={{ marginLeft: 6 }}>{selectedColor}</span>
        </div>
      </div>

      <h3>テンプレートPDF</h3>
      <p>
        <a id="templateLink" href="https://www.ipa.go.jp/privacy/hjuojm000000f2fl-att/02.pdf" target="_blank" rel="noopener">IPAテンプレートをこのリンクからダウンロード</a>
      </p>
      <label htmlFor="templateFile">またはローカルに保存したテンプレートPDFを選択:</label>
      <input id="templateFile" type="file" accept="application/pdf" onChange={(e) => setTemplateFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
      <label htmlFor="fontFile" style={{ display: 'block', marginTop: 6 }}>フォントファイル（日本語対応：.ttf/.otf）を選択:</label>
      <input id="fontFile" type="file" accept="font/ttf,font/otf,.ttf,.otf" onChange={(e) => setFontFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />

      <h3>プレビュー</h3>
      <iframe id="preview" ref={previewRef} style={{ width: '100%', height: 600, border: '1px solid #ddd' }} title="preview" />

      <h3>ログ</h3>
      <div id="log" style={{ whiteSpace: 'pre-wrap', border: '1px solid #ddd', padding: 8, height: 120, overflow: 'auto' }} />
    </div>
  );
}
