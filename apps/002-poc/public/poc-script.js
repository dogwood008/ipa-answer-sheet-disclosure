// This is a direct port of the PoC logic (specs/001-a4-pdf-pdf/poc/script.js)
// with a tiny addition: when a PDF is generated, if an <iframe id="preview"> exists,
// it will be pointed to the generated blob URL for inline preview in the React app.

let PDFDocument, rgb, StandardFonts
if (typeof PDFLib !== 'undefined' && PDFLib){
  ({ PDFDocument, rgb, StandardFonts } = PDFLib)
}else{
  PDFDocument = undefined
  rgb = function(){ return { r:0, g:0, b:0 } }
  StandardFonts = {}
}

const TEMPLATE_URL = 'https://www.ipa.go.jp/privacy/hjuojm000000f2fl-att/02.pdf'
const NOTO_CSS_URL = 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap'

const log = (s)=>{ try{ document.getElementById('log').textContent += s+"\n" }catch(_){} }

const NAMED_COLOR_HEX = { black:'#000000', red:'#FF0000', green:'#008000', blue:'#0000FF', white:'#FFFFFF' }
function normalizeHex(hex){
  if(!hex || typeof hex !== 'string') return null
  const v = hex.trim()
  if(!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return null
  if(v.length === 4){ const r=v[1], g=v[2], b=v[3]; return ('#'+r+r+g+g+b+b).toUpperCase() }
  return v.toUpperCase()
}
function namedToHex(name){
  if(!name || typeof name !== 'string') return null
  const key = name.trim().toLowerCase()
  if(NAMED_COLOR_HEX[key]) return NAMED_COLOR_HEX[key]
  try{
    if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') return null
    const el = document.createElement('span')
    try { el.style.all = 'initial' } catch(_) { }
    el.style.position = 'fixed'
    el.style.left = '-9999px'
    el.style.top = '-9999px'
    el.style.visibility = 'hidden'
    el.style.display = 'block'
    el.style.pointerEvents = 'none'
    el.style.color = key
    const parent = document.body || document.documentElement
    parent.appendChild(el)
    const rgbStr = getComputedStyle(el).color || ''
    parent.removeChild(el)
    const m = rgbStr.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)
    if(m){
      const r=parseInt(m[1],10), g=parseInt(m[2],10), b=parseInt(m[3],10)
      const to2=(n)=>n.toString(16).padStart(2,'0')
      return ('#'+to2(r)+to2(g)+to2(b)).toUpperCase()
    }
  }catch(err){ console.warn('namedToHex failed to resolve color:', err) }
  return null
}
function normalizeColor(input){
  if(typeof input !== 'string') return '#000000'
  const t = input.trim()
  const hx = normalizeHex(t); if(hx) return hx
  const nm = namedToHex(t); if(nm) return nm
  return '#000000'
}
function hexToRgb01(hex){
  const h = normalizeHex(hex) || '#000000'
  return {
    r: parseInt(h.slice(1,3),16)/255,
    g: parseInt(h.slice(3,5),16)/255,
    b: parseInt(h.slice(5,7),16)/255
  }
}
let __selectedColorHex = '#000000'
function setSelectedColor(hex){
  __selectedColorHex = normalizeColor(hex)
  try{
    const picker = document.getElementById('colorPicker')
    if(picker && typeof picker.value !== 'undefined'){
      try{ picker.value = __selectedColorHex }catch(err){ console.warn('Failed to sync color picker value:', err) }
    }
    const sw = document.getElementById('colorSwatch')
    const val = document.getElementById('colorValue')
    if(sw){ sw.style.background = __selectedColorHex; sw.title = __selectedColorHex }
    if(val){ val.textContent = __selectedColorHex }
    if(typeof window !== 'undefined') window.__lastSelectedColorHex = __selectedColorHex
  }catch(err){ console.warn('Failed to update selected color UI:', err) }
}
function setupColorControls(){
  try{
    const btnBlack = document.getElementById('presetBlack')
    const btnRed = document.getElementById('presetRed')
    const picker = document.getElementById('colorPicker')
    const nameInput = document.getElementById('colorName')
    if(btnBlack) btnBlack.addEventListener('click', ()=> setSelectedColor('#000000'))
    if(btnRed) btnRed.addEventListener('click', ()=> setSelectedColor('#FF0000'))
    if(picker) picker.addEventListener('input', (e)=> setSelectedColor(e.target.value))
    if(nameInput) nameInput.addEventListener('change', (e)=> setSelectedColor(String(e.target.value||'')))
    setSelectedColor('#000000')
  }catch(err){ console.warn('Failed to setup color controls:', err) }
}

const HEIGHT_PT = 842
const fieldMap = [
  { key:'furigana', x: 218, y: HEIGHT_PT - 146, size: 11, type:'text', width: 386 - 146, maxLines: 2 },
  { key:'name', x: 218, y: HEIGHT_PT - 162, size: 14, type:'text', width: 386 - 146, maxLines: 2 },
  { key:'examNumber', x: 420, y: 720, size: 12, type:'text', width: 120, maxLines: 1 }
]

const CIRCLE_POS = { x: 100, y: 680, r: 10 }
function setupCircleRadioListener(){
  try{
    const radios = document.querySelectorAll('input[name="drawCircle"]')
    radios.forEach(r=>{
      r.addEventListener('change', ()=>{
        try{ window.__drawCircleOptionChanged = true }catch(_){}
        const sel = getDrawCircleOption()
        log(`円の描画オプションが変更されました: ${sel}`)
      })
    })
  }catch(_){ }
}
function getDrawCircleOption(){
  try{
    const checked = document.querySelector('input[name="drawCircle"]:checked')
    return checked ? checked.value : 'nodraw'
  }catch(_){ return 'nodraw' }
}

function parseRectInputs(xv, yv, wv, hv){
  const x = Number.parseFloat(xv)
  const y = Number.parseFloat(yv)
  const w = Number.parseFloat(wv)
  const h = Number.parseFloat(hv)
  const valid = Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0
  return { x, y, w, h, valid }
}

async function fetchArrayBuffer(url){
  const r = await fetch(url)
  if(!r.ok) throw new Error(`fetch failed ${r.status}`)
  return await r.arrayBuffer()
}

function readFileAsArrayBuffer(file){
  return new Promise((res, rej)=>{
    const fr = new FileReader()
    fr.onload = ()=>res(fr.result)
    fr.onerror = rej
    fr.readAsArrayBuffer(file)
  })
}

async function loadFontFaceFromFile(file){
  const blobUrl = URL.createObjectURL(file)
  const family = 'UploadedFont_' + Date.now()
  try{
    const fontFace = new FontFace(family, `url(${blobUrl})`)
    await fontFace.load()
    document.fonts.add(fontFace)
    URL.revokeObjectURL(blobUrl)
    return family
  }catch(e){
    console.error('FontFace load failed', e)
    try{ URL.revokeObjectURL(blobUrl) }catch(_){}
    throw e
  }
}

async function loadNotoFromGoogleFonts(){
  try{
    const cssRes = await fetch(NOTO_CSS_URL, { mode: 'cors' })
    if(!cssRes.ok) throw new Error('failed to fetch Google Fonts CSS: '+cssRes.status)
    const cssText = await cssRes.text()
    const m = cssText.match(/url\((https?:[^)]+)\) format\('woff2'\)/i) || cssText.match(/url\((https?:[^)]+)\)/i)
    if(!m) throw new Error('no font URL found in CSS')
    const fontUrl = m[1].replace(/"/g,'').replace(/'/g,'')
    const family = 'NotoSansJP_Google'
    const fontFace = new FontFace(family, `url(${fontUrl}) format('woff2')`)
    await fontFace.load()
    document.fonts.add(fontFace)
    return family
  }catch(err){
    console.warn('loadNotoFromGoogleFonts failed', err)
    throw err
  }
}
if (typeof window !== 'undefined'){
  try{ window.loadNotoFromGoogleFonts = loadNotoFromGoogleFonts }catch(_){}
}

function renderTextToPngBytes(text, fontFamily, fontSizePx, maxWidthPx = null, maxLines = 1){
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if(!ctx){
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='
    const binary = atob(base64)
    const len = binary.length
    const buf = new Uint8Array(len)
    for(let i=0;i<len;i++) buf[i]=binary.charCodeAt(i)
    return buf.buffer
  }
  const padding = 8
  ctx.fillStyle = '#000'
  let fontPx = fontSizePx
  ctx.textBaseline = 'top'
  if(!maxWidthPx){ maxWidthPx = Math.round(fontPx * 20) }
  function layoutLinesForFontSize(fs){
    ctx.font = `${fs}px "${fontFamily}", sans-serif`
    const words = text.split(/(\s+)/)
    const lines = []
    let cur = ''
    for (const w of words){
      const test = cur ? (cur + w) : w
      const m = ctx.measureText(test)
      if (m.width + padding*2 <= maxWidthPx || cur === ''){
        cur = test
      } else {
        lines.push(cur.trimEnd())
        cur = w.trimStart()
      }
    }
    if(cur) lines.push(cur)
    return lines
  }
  let lines = layoutLinesForFontSize(fontPx)
  const minFontPx = 8
  while(lines.length > maxLines && fontPx > minFontPx){ fontPx = Math.max(minFontPx, fontPx - 1); lines = layoutLinesForFontSize(fontPx) }
  if(lines.length > maxLines){
    lines = lines.slice(0, maxLines)
    const last = lines[lines.length-1]
    ctx.font = `${fontPx}px "${fontFamily}", sans-serif`
    let truncated = last
    while(ctx.measureText(truncated + '…').width + padding*2 > maxWidthPx && truncated.length>0){ truncated = truncated.slice(0, -1) }
    lines[lines.length-1] = truncated + '…'
  }
  ctx.font = `${fontPx}px "${fontFamily}", sans-serif`
  let maxW = 0
  for(const l of lines){ const m = ctx.measureText(l); if(m.width > maxW) maxW = m.width }
  const width = Math.ceil(maxW) + padding*2
  const height = Math.ceil(fontPx * 1.3 * lines.length) + padding*2
  canvas.width = width
  canvas.height = height
  ctx.clearRect(0,0,width,height)
  ctx.fillStyle = '#000'
  ctx.font = `${fontPx}px "${fontFamily}", sans-serif`
  for(let i=0;i<lines.length;i++){ ctx.fillText(lines[i], padding, padding + i * Math.ceil(fontPx * 1.3)) }
  const dataUrl = canvas.toDataURL('image/png')
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const len = binary.length
  const buf = new Uint8Array(len)
  for(let i=0;i<len;i++) buf[i]=binary.charCodeAt(i)
  return buf.buffer
}

const CSS_DPI = 96, PDF_DPI = 72, PIXELS_PER_POINT = CSS_DPI / PDF_DPI
async function embedPngBytesAsPdfImage(targetDoc, pngBytes){
  const pngImage = await targetDoc.embedPng(pngBytes)
  const widthPts = pngImage.width / PIXELS_PER_POINT
  const heightPts = pngImage.height / PIXELS_PER_POINT
  return { pngImage, widthPts, heightPts }
}

async function renderFirstPageToPngViaPDFJS(arrayBuffer, scale=2){
  if (typeof pdfjsLib === 'undefined') throw new Error('PDF.js が読み込まれていません')
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale })
  const baseViewport = page.getViewport({ scale: 1 })
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  await page.render({ canvasContext: ctx, viewport }).promise
  const dataUrl = canvas.toDataURL('image/png')
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const len = binary.length
  const buf = new Uint8Array(len)
  for(let i=0;i<len;i++) buf[i]=binary.charCodeAt(i)
  return { bytes: buf.buffer, width: canvas.width, height: canvas.height, widthPts: baseViewport.width, heightPts: baseViewport.height }
}

async function generate(){
  try{
    // Fallback minimal PDF builder when pdf-lib is unavailable (offline/CDN blocked)
    function buildMinimalPdf(nameStr, examStr){
      function pad10(n){ const s=String(n); return s.length>=10?s:'0'.repeat(10-s.length)+s }
      function esc(s){ return String(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)') }
      const chunks=[]; let off=0; const push=(t)=>{ chunks.push(t); off += new TextEncoder().encode(t).byteLength }
      push('%PDF-1.4\n');
      const off1=off; push('1 0 obj\n'); push('<< /Type /Catalog /Pages 2 0 R >>\n'); push('endobj\n')
      const off2=off; push('2 0 obj\n'); push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n'); push('endobj\n')
      const off3=off; push('3 0 obj\n'); push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\n'); push('endobj\n')
      const off4=off; push('4 0 obj\n'); push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n'); push('endobj\n')
      const content = `BT /F1 16 Tf 72 720 Td (${esc(nameStr)}) Tj ET\nBT /F1 12 Tf 72 700 Td (${esc(examStr)}) Tj ET\n`
      const len = new TextEncoder().encode(content).byteLength
      const off5=off; push('5 0 obj\n'); push(`<< /Length ${len} >>\n`); push('stream\n'); push(content); push('endstream\n'); push('endobj\n')
      const xref=off; push('xref\n'); push('0 6\n'); push('0000000000 65535 f \n'); push(`${pad10(off1)} 00000 n \n`); push(`${pad10(off2)} 00000 n \n`); push(`${pad10(off3)} 00000 n \n`); push(`${pad10(off4)} 00000 n \n`); push(`${pad10(off5)} 00000 n \n`)
      push('trailer\n'); push('<< /Size 6 /Root 1 0 R >>\n'); push('startxref\n'); push(String(xref)+'\n'); push('%%EOF\n')
      return new TextEncoder().encode(chunks.join('')).buffer
    }
    log('テンプレートPDFを取得中...')
    let templateBytes = null
    const fileInput = document.getElementById('templateFile')
    if(fileInput && fileInput.files && fileInput.files.length>0){
      log('ローカル選択されたテンプレートを使用します')
      templateBytes = await readFileAsArrayBuffer(fileInput.files[0])
    }else{
      log('ローカルテンプレート未選択: 白紙PDFで生成します（オフライン対応）')
      templateBytes = null
    }

    log('PDFを読み込み中...（暗号化があっても読み込み可能にします）')
    function looksLikePdf(arrayBuffer){
      try{
        const sig = new Uint8Array(arrayBuffer.slice(0,4))
        const s = String.fromCharCode.apply(null, Array.from(sig))
        return s === '%PDF'
      }catch(e){ return false }
    }
    if(templateBytes && !looksLikePdf(templateBytes)){
      throw new Error('選択されたテンプレートがPDFではないか破損しています。ローカルで正しいPDFを選択してください。')
    }

    let pdfDoc
    if (templateBytes){
      try{ pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true }) }
      catch(loadErr){ log('PDF読み込み時にエラー: '+loadErr.message); console.error('load error', loadErr); throw loadErr }
    }

    const hasEncryptToken = templateBytes ? (()=>{
      try{ const head = new TextDecoder('latin1').decode(new Uint8Array(templateBytes).slice(0, 20000)); return head.includes('/Encrypt') || head.includes('/Filter/Standard') }catch(_){ return false }
    })() : false
    if (hasEncryptToken) { log('注意: 暗号化情報を含む可能性があります（/Encrypt）。') }

    let sourceDoc = pdfDoc
    if (PDFDocument && pdfDoc){
      try{ const normalizedBytes = await pdfDoc.save(); sourceDoc = await PDFDocument.load(normalizedBytes); log('テンプレートPDFを正規化して再読み込み') }catch(normErr){ console.warn('normalize failed', normErr) }
    }

    const outDoc = await PDFDocument.create()
    try{ if (typeof fontkit !== 'undefined' && typeof outDoc.registerFontkit === 'function') outDoc.registerFontkit(fontkit) }catch(_){ }

    let page = null
    let docToSave = outDoc
    try{ if(sourceDoc){ const [imported] = await outDoc.copyPages(sourceDoc, [0]); page = outDoc.addPage(imported) } else { page = outDoc.addPage([612,792]) } }
    catch(copyErr){
      console.warn('copyPages failed, fallback raster', copyErr)
      log('PDF.js で背景をラスタ化（300dpi）して貼り込みます。')
      try{
        const DPI_SCALE = 300/72
        const bg = await renderFirstPageToPngViaPDFJS(templateBytes, DPI_SCALE)
        const bgImage = await outDoc.embedPng(bg.bytes)
        const pageDims = [bg.widthPts, bg.heightPts]
        page = outDoc.addPage(pageDims)
        page.drawImage(bgImage, { x: 0, y: 0, width: bg.widthPts, height: bg.heightPts })
        docToSave = outDoc
      }catch(rastErr){ console.error('raster fallback failed', rastErr); log('PDF.js ラスタ化のフォールバックにも失敗しました。'); try{ const pages = sourceDoc.getPages(); page = pages && pages[0]; docToSave = sourceDoc }catch(_){} }
    }

    let embeddedFont = null
    let uploadedFontFamily = null
    let notoFontFamily = null
    let uploadedFontFile = null
    const fontInput = document.getElementById('fontFile')
    if(fontInput && fontInput.files && fontInput.files.length>0){
      uploadedFontFile = fontInput.files[0]
      try{
        log('アップロードされたフォントをpdf-libに埋め込み中...')
        const fontBytes = await readFileAsArrayBuffer(uploadedFontFile)
        const targetDoc = (docToSave || outDoc)
        embeddedFont = await targetDoc.embedFont(fontBytes)
        log('pdf-libへのフォント埋め込みに成功')
        try{ window.__embeddedFontEmbedded = true; window.__embeddedFontName = uploadedFontFile.name }catch(_){ }
      }catch(fe){
        log('pdf-libへのフォント埋め込みに失敗。フォールバックを試みます。')
        console.error('embedFont error:', fe)
        try{ uploadedFontFamily = await loadFontFaceFromFile(uploadedFontFile); log('FontFace API でフォントをロードしました') }catch(_){ }
      }
    } else {
      try{ notoFontFamily = await loadNotoFromGoogleFonts(); log('Google Fonts から NotoSansJP を読み込みました') }catch(_){ }
    }

    const textInputs = { furigana: (document.getElementById('furigana')||{}).value, name: (document.getElementById('name')||{}).value, examNumber: (document.getElementById('examNumber')||{}).value }
    const selHex = (typeof __selectedColorHex === 'string') ? __selectedColorHex : '#000000'
    const pdfRGB = hexToRgb01(selHex)
    try{ window.__lastPdfColorRGB = pdfRGB }catch(_){ }

    let helvetica = null
    if (PDFDocument){ try{ helvetica = await outDoc.embedFont(StandardFonts.Helvetica) }catch(_){ } }
    for(const f of fieldMap){
      const v = textInputs[f.key]
      if(v == null) continue
      try{
        if (!PDFDocument){
          // Fallback handled after loop
        } else {
          const targetDoc = (docToSave || outDoc)
          if (embeddedFont){ helvetica = embeddedFont }
          if (f.type === 'text'){
            let didPdfLayout = false
          if(embeddedFont && helvetica && f.width){
            let fontPt = f.size
            const minFontPt = 6
            const maxWidthPts = f.width
            const layoutLinesForFont = (pt)=>{
              const words = String(v).split(/(\s+)/)
              const lines = []
              let cur = ''
              for(const w of words){ const test = cur ? (cur+w) : w; const m = helvetica.widthOfTextAtSize(test, pt); if(m <= maxWidthPts || cur===''){ cur=test } else { lines.push(cur.trimEnd()); cur = w.trimStart() } }
              if(cur) lines.push(cur)
              return lines
            }
            let lines = layoutLinesForFont(fontPt)
            while(lines.length > (f.maxLines||1) && fontPt > minFontPt){ fontPt = Math.max(minFontPt, fontPt-1); lines = layoutLinesForFont(fontPt) }
            if(lines.length > (f.maxLines||1)){
              lines = lines.slice(0, f.maxLines||1)
              let last = lines[lines.length-1]
              while(helvetica.widthOfTextAtSize(last + '…', fontPt) > maxWidthPts && last.length>0){ last = last.slice(0, -1) }
              lines[lines.length-1] = last + '…'
            }
            const leading = fontPt * 1.2
            for(let i=0;i<lines.length;i++){
              page.drawText(lines[i], { x: f.x, y: f.y - i*leading, size: fontPt, font: helvetica, color: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b) })
            }
            didPdfLayout = true
          }
          if(!didPdfLayout){
            page.drawText(String(v), { x: f.x, y: f.y, size: f.size, font: helvetica, color: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b) })
          }
        }
      }catch(drawErr){ log('描画エラー: ' + (drawErr && drawErr.message)) }
    }

    if (PDFDocument){ try{
      const opt = getDrawCircleOption()
      if(opt === 'draw'){
        if (typeof page.drawCircle === 'function'){
          page.drawCircle({ x: CIRCLE_POS.x, y: CIRCLE_POS.y, size: CIRCLE_POS.r, borderColor: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b), borderWidth: 1 })
        } else {
          page.drawEllipse({ x: CIRCLE_POS.x, y: CIRCLE_POS.y, xScale: CIRCLE_POS.r, yScale: CIRCLE_POS.r, borderColor: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b), borderWidth: 1 })
        }
        try{ window.__circleDrawn = true }catch(_){ }
        log('円を描画しました')
      } else {
        try{ window.__circleDrawn = false }catch(_){ }
        log('円は描画しませんでした（オプション）')
      }
    }catch(circleErr){ console.warn('circle draw failed', circleErr); log('円の描画に失敗しました: '+(circleErr && circleErr.message)) } }

    if (PDFDocument){ try{
      const rectToggle = document.getElementById('drawRect')
      const wantRect = !!(rectToggle && rectToggle.checked)
      if (wantRect){
        const rx = (document.getElementById('rectX')||{}).value
        const ry = (document.getElementById('rectY')||{}).value
        const rw = (document.getElementById('rectW')||{}).value
        const rh = (document.getElementById('rectH')||{}).value
        const parsed = parseRectInputs(rx, ry, rw, rh)
        if(parsed.valid){
          const selHex2 = (typeof __selectedColorHex === 'string') ? __selectedColorHex : '#000000'
          const pdfRGB2 = hexToRgb01(selHex2)
          let yBottom = parsed.y
          try{ const size = typeof page.getSize === 'function' ? page.getSize() : { width: 595, height: 842 }; yBottom = size.height - parsed.y - parsed.h }catch(_){ }
          if(typeof page.drawRectangle === 'function'){
            page.drawRectangle({ x: parsed.x, y: yBottom, width: parsed.w, height: parsed.h, color: rgb(pdfRGB2.r, pdfRGB2.g, pdfRGB2.b) })
          } else {
            page.drawRectangle({ x: parsed.x, y: yBottom, width: parsed.w, height: parsed.h, borderColor: rgb(pdfRGB2.r, pdfRGB2.g, pdfRGB2.b), borderWidth: 1 })
          }
          try{ window.__rectDrawn = true; window.__lastRect = { x: parsed.x, y: yBottom, w: parsed.w, h: parsed.h } }catch(_){ }
          log('矩形を描画しました')
        } else {
          try{ window.__rectDrawn = false }catch(_){ }
          log('矩形の入力が不正のため描画しませんでした')
        }
      } else { try{ window.__rectDrawn = false }catch(_){ } }
    }catch(rectErr){ console.warn('rectangle draw failed', rectErr); log('矩形の描画に失敗しました: '+(rectErr && rectErr.message)) } }

    let pdfBuffer
    if (!PDFDocument){
      pdfBuffer = buildMinimalPdf(String((document.getElementById('name')||{}).value||''), String((document.getElementById('examNumber')||{}).value||''))
    } else {
      const pdfBytes = await (docToSave||outDoc).save()
      pdfBuffer = pdfBytes
    }
    try{ if(typeof window !== 'undefined'){ try{ window.__lastPdfFirstBytes = Array.from(new Uint8Array(pdfBuffer.slice(0,8))) }catch(e){} } }catch(_){}
    const blob = new Blob([pdfBuffer],{type:'application/pdf'})
    const url = URL.createObjectURL(blob)

    try{ window.open(url, '_blank') }catch(_){ }
    const dl = document.getElementById('download')
    if (dl){ dl.href = url; dl.download = 'ipa-filled.pdf'; dl.style.pointerEvents = 'auto'; dl.style.opacity = '1' }
    // Port addition: if iframe#preview exists, set it to blob URL
    const ifr = document.getElementById('preview')
    if (ifr && ifr.tagName === 'IFRAME'){
      try { ifr.src = url } catch(_){}
    }
    log('生成完了')
  }catch(e){ log('エラー: '+e.message); console.error(e) }
}

const _genEl = (typeof document !== 'undefined') ? document.getElementById('generate') : null
if(_genEl && typeof _genEl.addEventListener === 'function') _genEl.addEventListener('click', ()=>{generate()})
const _dlEl = (typeof document !== 'undefined') ? document.getElementById('download') : null
if(_dlEl && typeof _dlEl.addEventListener === 'function') _dlEl.addEventListener('click', ()=>{})

try{
  if (typeof document !== 'undefined'){
    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', ()=>{ setupCircleRadioListener(); setupColorControls() })
    } else {
      setupCircleRadioListener(); setupColorControls()
    }
  }
}catch(err){ console.warn('Failed to initialize listeners:', err) }
