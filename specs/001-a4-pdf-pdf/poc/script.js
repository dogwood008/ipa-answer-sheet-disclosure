// Use the UMD build loaded via <script src="https://unpkg.com/pdf-lib/dist/pdf-lib.min.js"></script>
// This avoids CORS issues that occur when importing the ESM build from unpkg in some setups.
let PDFDocument, rgb, StandardFonts
if (typeof PDFLib !== 'undefined' && PDFLib){
  ({ PDFDocument, rgb, StandardFonts } = PDFLib)
}else{
  // Running in Node (Jest) or environment without PDFLib. Provide safe fallbacks
  PDFDocument = undefined
  rgb = function(){ return { r:0, g:0, b:0 } }
  StandardFonts = {}
}

const TEMPLATE_URL = 'https://www.ipa.go.jp/privacy/hjuojm000000f2fl-att/02.pdf'
const NOTO_CSS_URL = 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap'

const log = (s)=>{document.getElementById('log').textContent += s+"\n"}

// ============ Color Selection Utilities ============
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
    const el = document.createElement('span')
    // Isolate from page CSS so that global styles don't affect computed color
    try { el.style.all = 'initial' } catch(_) { /* older browsers may not support 'all' */ }
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
    // keep native color picker in sync
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

const fieldMap = [
  // width is in PDF points, maxLines is integer
  { key:'name', x: 50, y: 720, size: 14, type:'text', width: 300, maxLines: 2 },
  { key:'examNumber', x: 420, y: 720, size: 12, type:'text', width: 120, maxLines: 1 }
]

// Circle drawing constants (PDF points)
const CIRCLE_POS = { x: 100, y: 680, r: 10 }

// Track radio selection changes
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
  }catch(_){ /* no-op in non-browser env */ }
}

function getDrawCircleOption(){
  try{
    const checked = document.querySelector('input[name="drawCircle"]:checked')
    return checked ? checked.value : 'nodraw'
  }catch(_){ return 'nodraw' }
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

// Load an uploaded font into document.fonts via FontFace API and return the family name
async function loadFontFaceFromFile(file){
  const blobUrl = URL.createObjectURL(file)
  const family = 'UploadedFont_' + Date.now()
  try{
    const fontFace = new FontFace(family, `url(${blobUrl})`)
    await fontFace.load()
    document.fonts.add(fontFace)
    // revoke blob url later
    URL.revokeObjectURL(blobUrl)
    return family
  }catch(e){
    console.error('FontFace load failed', e)
    try{ URL.revokeObjectURL(blobUrl) }catch(_){}
    throw e
  }
}

// Best-effort: load Noto Sans JP from Google Fonts CSS and register via FontFace API.
// Returns the family name registered, or throws on fatal errors.
async function loadNotoFromGoogleFonts(){
  try{
    const cssRes = await fetch(NOTO_CSS_URL, { mode: 'cors' })
    if(!cssRes.ok) throw new Error('failed to fetch Google Fonts CSS: '+cssRes.status)
    const cssText = await cssRes.text()
    // find first url(...) occurrence (woff2 hosted on fonts.gstatic.com)
    const m = cssText.match(/url\((https?:[^)]+)\) format\('woff2'\)/i) || cssText.match(/url\((https?:[^)]+)\)/i)
    if(!m) throw new Error('no font URL found in CSS')
    const fontUrl = m[1].replace(/"/g,'').replace(/'/g,'')
    const family = 'NotoSansJP_Google'
    // Create FontFace using the remote woff2 URL. Many Google Fonts endpoints allow cross-origin font use.
    const fontFace = new FontFace(family, `url(${fontUrl}) format('woff2')`)
    await fontFace.load()
    document.fonts.add(fontFace)
    return family
  }catch(err){
    console.warn('loadNotoFromGoogleFonts failed', err)
    throw err
  }
}

// Expose in browser for tests and in module exports for Node
if (typeof window !== 'undefined') {
  try{ window.loadNotoFromGoogleFonts = loadNotoFromGoogleFonts }catch(e){}
}

// Render text to a PNG using a given fontFamily and return PNG bytes (ArrayBuffer)
function renderTextToPngBytes(text, fontFamily, fontSizePx, maxWidthPx = null, maxLines = 1){
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  // jsdom in Node does not implement canvas; provide a simple fallback PNG
  if(!ctx){
    // 1x1 transparent PNG base64
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='
    const binary = atob(base64)
    const len = binary.length
    const buf = new Uint8Array(len)
    for(let i=0;i<len;i++) buf[i]=binary.charCodeAt(i)
    return buf.buffer
  }
  // when canvas is available, support wrapping and auto-shrink
  const padding = 8
  ctx.fillStyle = '#000'
  let fontPx = fontSizePx
  ctx.textBaseline = 'top'
  // determine maxWidthPx from parameter or fallback heuristic
  if(!maxWidthPx){
    // if no constraint provided, assume a reasonable width proportional to font size
    maxWidthPx = Math.round(fontPx * 20)
  }

  // Helper to measure and layout lines for given font size
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

  // Try to layout with given font size; if exceeds maxLines try shrinking
  let lines = layoutLinesForFontSize(fontPx)
  const minFontPx = 8
  while(lines.length > maxLines && fontPx > minFontPx){
    fontPx = Math.max(minFontPx, fontPx - 1)
    lines = layoutLinesForFontSize(fontPx)
  }

  // If still too many lines, clamp to maxLines and truncate last line with ellipsis
  if(lines.length > maxLines){
    lines = lines.slice(0, maxLines)
    const last = lines[lines.length-1]
    // truncate last to fit
    ctx.font = `${fontPx}px "${fontFamily}", sans-serif`
    let truncated = last
    while(ctx.measureText(truncated + '…').width + padding*2 > maxWidthPx && truncated.length>0){
      truncated = truncated.slice(0, -1)
    }
    lines[lines.length-1] = truncated + '…'
  }

  // compute canvas size
  ctx.font = `${fontPx}px "${fontFamily}", sans-serif`
  let maxW = 0
  for(const l of lines){
    const m = ctx.measureText(l)
    if(m.width > maxW) maxW = m.width
  }
  const width = Math.ceil(maxW) + padding*2
  const height = Math.ceil(fontPx * 1.3 * lines.length) + padding*2
  canvas.width = width
  canvas.height = height
  // draw text lines
  ctx.clearRect(0,0,width,height)
  ctx.fillStyle = '#000'
  ctx.font = `${fontPx}px "${fontFamily}", sans-serif`
  for(let i=0;i<lines.length;i++){
    ctx.fillText(lines[i], padding, padding + i * Math.ceil(fontPx * 1.3))
  }
  const dataUrl = canvas.toDataURL('image/png')
  // convert dataURL to ArrayBuffer
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const len = binary.length
  const buf = new Uint8Array(len)
  for(let i=0;i<len;i++) buf[i]=binary.charCodeAt(i)
  return buf.buffer
}

// Helper: embed PNG bytes into pdf-lib document and return image + dimensions in PDF points
const CSS_DPI = 96
const PDF_DPI = 72
const PIXELS_PER_POINT = CSS_DPI / PDF_DPI // typically 1.333...
async function embedPngBytesAsPdfImage(targetDoc, pngBytes){
  const pngImage = await targetDoc.embedPng(pngBytes)
  // pngImage.width/height are in pixels; convert to PDF points
  const widthPts = pngImage.width / PIXELS_PER_POINT
  const heightPts = pngImage.height / PIXELS_PER_POINT
  return { pngImage, widthPts, heightPts }
}

// Render first page of a PDF (ArrayBuffer) to PNG using PDF.js.
// scale: rendering scale where 1.0 means 72dpi. For 300dpi use 300/72.
// Returns { bytes: ArrayBuffer, width: px, height: px, widthPts: pt, heightPts: pt }
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
    log('テンプレートPDFを取得中...')
    let templateBytes = null
    const fileInput = document.getElementById('templateFile')
    if(fileInput && fileInput.files && fileInput.files.length>0){
      log('ローカル選択されたテンプレートを使用します')
      templateBytes = await readFileAsArrayBuffer(fileInput.files[0])
    }else{
      log('リモートテンプレートをダウンロードしようとします（CORSで失敗する場合は手動でダウンロードしてローカル選択してください）')
      templateBytes = await fetchArrayBuffer(TEMPLATE_URL)
    }

  log('PDFを読み込み中...（暗号化があっても読み込み可能にします）')

  // Validate that the bytes look like a PDF (starts with '%PDF')
  function looksLikePdf(arrayBuffer){
    try{
      const sig = new Uint8Array(arrayBuffer.slice(0,4))
      const s = String.fromCharCode.apply(null, Array.from(sig))
      return s === '%PDF'
    }catch(e){ return false }
  }

  if(!templateBytes || !looksLikePdf(templateBytes)){
    throw new Error('選択されたテンプレートがPDFではないか破損しています。ローカルで正しいPDFを選択してください。')
  }

  let pdfDoc
  try{
    pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true })
  }catch(loadErr){
    log('PDF読み込み時にエラーが発生しました: '+loadErr.message)
    console.error('PDF load error, first bytes:', new Uint8Array(templateBytes).slice(0,16))
    throw loadErr
  }

    // 1) 暗号化フラグを簡易検出（ヒューリスティック）
    const hasEncryptToken = (()=>{
      try{
        const head = new TextDecoder('latin1').decode(new Uint8Array(templateBytes).slice(0, 20000))
        return head.includes('/Encrypt') || head.includes('/Filter/Standard')
      }catch(_){ return false }
    })()
    if (hasEncryptToken) {
      log('注意: このテンプレートPDFは暗号化情報を含む可能性があります（/Encrypt）。')
    }

    // 2) 可能なら一度保存→再読み込みして正規化（暗号化やレイヤの癖を軽減）
    let sourceDoc = pdfDoc
    try{
      const normalizedBytes = await pdfDoc.save()
      sourceDoc = await PDFDocument.load(normalizedBytes)
      log('テンプレートPDFを一度正規化して再読み込みしました')
    }catch(normErr){
      console.warn('normalize failed (save→reload)', normErr)
      log('テンプレートの正規化に失敗しました（処理は継続します）')
    }

    // 3) 新規PDFを作成し、テンプレートの1ページ目をインポート
    const outDoc = await PDFDocument.create()
    // Register fontkit on the output document for custom font embedding
    try{
      if (typeof fontkit !== 'undefined' && typeof outDoc.registerFontkit === 'function') {
        outDoc.registerFontkit(fontkit)
        log('fontkit を登録しました（カスタムフォント埋め込み有効）')
      }
    }catch(regErr){
      console.warn('fontkit register failed', regErr)
      log('fontkit の登録に失敗しました: '+(regErr && regErr.message))
    }

    let page = null
    let docToSave = outDoc
    try{
      const [imported] = await outDoc.copyPages(sourceDoc, [0])
      page = outDoc.addPage(imported)
    }catch(copyErr){
      console.warn('copyPages failed, fallback to drawing on sourceDoc directly', copyErr)
      log('テンプレートのインポートに失敗しました。PDF.js で背景をラスタ化（300dpi）して新規PDFへ貼り込みます。')
      try{
        const DPI_SCALE = 300/72
        const bg = await renderFirstPageToPngViaPDFJS(templateBytes, DPI_SCALE)
        const bgImage = await outDoc.embedPng(bg.bytes)
        // PDFの実寸（ポイント）でページを作り、画像を実寸で配置（300dpi相当で高精細）
        const pageDims = [bg.widthPts, bg.heightPts]
        page = outDoc.addPage(pageDims)
        page.drawImage(bgImage, { x: 0, y: 0, width: bg.widthPts, height: bg.heightPts })
        docToSave = outDoc
      }catch(rastErr){
        console.error('PDF.js raster fallback failed', rastErr)
        log('PDF.js ラスタ化のフォールバックにも失敗しました。')
        // 最終手段：sourceDoc に直接描画（見えない可能性あり）
        try{
          const pages = sourceDoc.getPages()
          page = pages && pages[0]
          docToSave = sourceDoc
          log('最終フォールバック: 直接描画モードに移行します。')
        }catch(getPagesErr){
          console.error(getPagesErr)
        }
      }
    }

  // try to use uploaded font if provided
  let embeddedFont = null
  let uploadedFontFamily = null
  let notoFontFamily = null
    let uploadedFontFile = null
    const fontInput = document.getElementById('fontFile')
    if(fontInput && fontInput.files && fontInput.files.length>0){
      uploadedFontFile = fontInput.files[0]
      try{
        log('アップロードされたフォントをpdf-libに埋め込もうとしています...')
        const fontBytes = await readFileAsArrayBuffer(uploadedFontFile)
        const targetDoc = (docToSave || outDoc)
        embeddedFont = await targetDoc.embedFont(fontBytes)
        log('pdf-libへのフォント埋め込みに成功しました')
  try{ if(typeof window !== 'undefined'){ window.__embeddedFontEmbedded = true; window.__embeddedFontName = uploadedFontFile.name } }catch(e){}
      }catch(fe){
        log('pdf-libへのフォント埋め込みに失敗しました。フォールバック処理を試みます。')
        console.error('embedFont error:', fe)
        // try to register via FontFace so we can rasterize to canvas later
        try{
          uploadedFontFamily = await loadFontFaceFromFile(uploadedFontFile)
          log('FontFace API でフォントをロードしました: '+uploadedFontFamily)
        }catch(ffErr){
          log('FontFace 経由のロードにも失敗しました: '+(ffErr && ffErr.message))
          console.error(ffErr)
        }
      }
    }

    // If user didn't upload a font, try to load Noto Sans JP via Google Fonts for canvas rendering
    if(!uploadedFontFamily){
      try{
        log('Google Fonts (Noto Sans JP) を読み込み中...')
        notoFontFamily = await loadNotoFromGoogleFonts()
        log('Google Fonts を FontFace として読み込みました: '+notoFontFamily)
      }catch(ntErr){
        log('Google Fonts の読み込みに失敗しました: '+(ntErr && ntErr.message))
        console.warn(ntErr)
      }
    }

    if(!page) throw new Error('テンプレートPDFからページを取り込めませんでした')

  // font fallback: use uploaded font or StandardFonts.Helvetica
  const targetDoc = (docToSave || outDoc)
  const helvetica = embeddedFont || await targetDoc.embedFont(StandardFonts.Helvetica)
  // determine selected color (hex → pdf-lib rgb)
  const selHex = (typeof __selectedColorHex === 'string') ? __selectedColorHex : '#000000'
  const pdfRGB = hexToRgb01(selHex)
  try{ if(typeof window !== 'undefined'){ window.__lastPdfColorRGB = { ...pdfRGB } } }catch(_){ }

    // collect input
    const name = document.getElementById('name').value
    const examNumber = document.getElementById('examNumber').value
    const data = { name, examNumber }

    // Draw fields (use for..of so we can await inside the loop)
    for (const f of fieldMap) {
      const v = data[f.key] || ''
      try {
        if (f.type === 'text' || !f.type) {
          // Attempt PDF-native layout using font metrics when width/maxLines provided
          const maxWidthPts = f.width || null
          const maxLines = f.maxLines || 1
          let didPdfLayout = false
          try {
            if (maxWidthPts && helvetica && typeof helvetica.widthOfTextAtSize === 'function'){
              // layout using pdf-lib font metrics
              let fontPt = f.size
              const minFontPt = 8
              function layoutLinesForFont(fs){
                const words = String(v).split(/(\s+)/)
                const lines = []
                let cur = ''
                for(const w of words){
                  const test = cur ? (cur + w) : w
                  const wPts = helvetica.widthOfTextAtSize(test, fs)
                  if(wPts <= maxWidthPts || cur === ''){
                    cur = test
                  } else {
                    lines.push(cur.trimEnd())
                    cur = w.trimStart()
                  }
                }
                if(cur) lines.push(cur)
                return lines
              }
              let lines = layoutLinesForFont(fontPt)
              while(lines.length > maxLines && fontPt > minFontPt){
                fontPt = Math.max(minFontPt, fontPt - 1)
                lines = layoutLinesForFont(fontPt)
              }
              if(lines.length > maxLines){
                lines = lines.slice(0, maxLines)
                let last = lines[lines.length-1]
                while(helvetica.widthOfTextAtSize(last + '…', fontPt) > maxWidthPts && last.length>0){
                  last = last.slice(0, -1)
                }
                lines[lines.length-1] = last + '…'
              }
              // draw lines using pdf-lib at PDF points; use leading 1.2
              const leading = fontPt * 1.2
              for(let i=0;i<lines.length;i++){
                page.drawText(lines[i], { x: f.x, y: f.y - i*leading, size: fontPt, font: helvetica, color: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b) })
              }
              didPdfLayout = true
            }
            if(!didPdfLayout){
              page.drawText(String(v), {
                x: f.x,
                y: f.y,
                size: f.size,
                font: helvetica,
                color: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b)
              })
            }
          } catch (errDraw) {
            // If drawing fails (encoding), try rasterizing using uploaded font or Noto loaded via FontFace
            console.warn('drawText failed, will try canvas raster fallback', errDraw)
            const rasterFontFamily = uploadedFontFamily || notoFontFamily
            if (rasterFontFamily) {
              try {
                const fontPx = Math.round(f.size * 1.3)
                // convert maxWidth in points to pixels for canvas rasterization if provided
                const maxWidthPx = f.width ? Math.round(f.width * PIXELS_PER_POINT) : null
                const pngBytes = renderTextToPngBytes(String(v), rasterFontFamily, fontPx, maxWidthPx, f.maxLines || 1)
                const { pngImage, widthPts, heightPts } = await embedPngBytesAsPdfImage(targetDoc, pngBytes)
                page.drawImage(pngImage, { x: f.x, y: f.y, width: widthPts, height: heightPts })
                log('canvasラスタフォールバックで描画しました')
              } catch (rasterErr) {
                log('canvasラスタリングでの描画に失敗しました: ' + (rasterErr && rasterErr.message))
                console.error(rasterErr)
              }
            } else {
              throw errDraw
            }
          }
        } else if (f.type === 'checkbox') {
          // simple checkbox/cross rendering using unicode glyphs for reliability
          const mark = (v && String(v).toLowerCase() !== 'false') ? '☑' : '☐'
          page.drawText(mark, { x: f.x, y: f.y, size: f.size, font: helvetica, color: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b) })
        } else if (f.type === 'circle') {
          const mark = (v && String(v).toLowerCase() !== 'false') ? '◯' : '○'
          page.drawText(mark, { x: f.x, y: f.y, size: f.size, font: helvetica, color: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b) })
        } else {
          // unknown type: fallback to text
          page.drawText(String(v), { x: f.x, y: f.y, size: f.size, font: helvetica, color: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b) })
        }
      } catch (drawErr) {
        log('描画エラー: ' + (drawErr && drawErr.message))
        if (!embeddedFont) {
          log('日本語など非ASCII文字を描画するには日本語対応フォントを選択してください（例: Noto Sans JP の .ttf）。')
        }
      }
    }

    // Optional: draw a circle using pdf-lib when selected
    try{
      const opt = getDrawCircleOption()
      if(opt === 'draw'){
        if (typeof page.drawCircle === 'function'){
          page.drawCircle({
            x: CIRCLE_POS.x,
            y: CIRCLE_POS.y,
            size: CIRCLE_POS.r,
            borderColor: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b),
            borderWidth: 1
          })
        } else {
          page.drawEllipse({
            x: CIRCLE_POS.x,
            y: CIRCLE_POS.y,
            xScale: CIRCLE_POS.r,
            yScale: CIRCLE_POS.r,
            borderColor: rgb(pdfRGB.r, pdfRGB.g, pdfRGB.b),
            borderWidth: 1
          })
        }
        try{ if(typeof window !== 'undefined'){ window.__circleDrawn = true } }catch(_){ }
        log('円を描画しました')
      } else {
        try{ if(typeof window !== 'undefined'){ window.__circleDrawn = false } }catch(_){ }
        log('円は描画しませんでした（オプション）')
      }
    }catch(circleErr){
      console.warn('circle draw failed', circleErr)
      log('円の描画に失敗しました: '+(circleErr && circleErr.message))
    }

  const pdfBytes = await (docToSave||outDoc).save()
  try{
    // expose first bytes to test harness
    if(typeof window !== 'undefined'){
      try{ window.__lastPdfFirstBytes = Array.from(new Uint8Array(pdfBytes.slice(0,8))) }catch(e){}
    }
  }catch(_){}
  const blob = new Blob([pdfBytes],{type:'application/pdf'})
  const url = URL.createObjectURL(blob)

  // open preview in new tab
  window.open(url, '_blank')
  const dl = document.getElementById('download')
  dl.href = url
  dl.download = 'ipa-filled.pdf'
  dl.style.pointerEvents = 'auto'
  dl.style.opacity = '1'
    log('生成完了')
  }catch(e){
    log('エラー: '+e.message)
    console.error(e)
  }
}

const _genEl = (typeof document !== 'undefined') ? document.getElementById('generate') : null
if(_genEl && typeof _genEl.addEventListener === 'function') _genEl.addEventListener('click', ()=>{generate()})
const _dlEl = (typeof document !== 'undefined') ? document.getElementById('download') : null
if(_dlEl && typeof _dlEl.addEventListener === 'function') _dlEl.addEventListener('click', ()=>{/* a tag handled by href */})

// Initialize listeners when DOM is ready (browser only)
try{
  if (typeof document !== 'undefined'){
    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', ()=>{ setupCircleRadioListener(); setupColorControls() })
    } else {
      setupCircleRadioListener(); setupColorControls()
    }
  }
}catch(err){ console.warn('Failed to initialize listeners:', err) }

// Exports for Node/Jest tests
if (typeof module !== 'undefined' && module.exports){
  module.exports = {
    renderTextToPngBytes,
    readFileAsArrayBuffer,
    loadFontFaceFromFile,
    normalizeHex,
    normalizeColor,
    hexToRgb01
  }
}
