// Use the UMD build loaded via <script src="https://unpkg.com/pdf-lib/dist/pdf-lib.min.js"></script>
// This avoids CORS issues that occur when importing the ESM build from unpkg in some setups.
const { PDFDocument, rgb, StandardFonts } = PDFLib

const TEMPLATE_URL = 'https://www.ipa.go.jp/privacy/hjuojm000000f2fl-att/02.pdf'
const NOTO_CSS_URL = 'https://fonts.gstatic.com/s/notosansjp/v.../NotoSansJP-Regular.otf' // best-effort placeholder

const log = (s)=>{document.getElementById('log').textContent += s+"\n"}

const fieldMap = [
  { key:'name', x: 50, y: 720, size: 14, type:'text' },
  { key:'examNumber', x: 420, y: 720, size: 12, type:'text' }
]

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

// Render text to a PNG using a given fontFamily and return PNG bytes (ArrayBuffer)
function renderTextToPngBytes(text, fontFamily, fontSizePx){
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  // use a conservative padding
  const padding = 8
  ctx.font = `${fontSizePx}px "${fontFamily}", sans-serif`
  const metrics = ctx.measureText(text)
  const width = Math.ceil(metrics.width) + padding*2
  const height = Math.ceil(fontSizePx * 1.3) + padding*2
  canvas.width = width
  canvas.height = height
  // draw white transparent background
  ctx.clearRect(0,0,width,height)
  ctx.fillStyle = '#000'
  ctx.font = `${fontSizePx}px "${fontFamily}", sans-serif`
  ctx.textBaseline = 'top'
  ctx.fillText(text, padding, padding)
  const dataUrl = canvas.toDataURL('image/png')
  // convert dataURL to ArrayBuffer
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const len = binary.length
  const buf = new Uint8Array(len)
  for(let i=0;i<len;i++) buf[i]=binary.charCodeAt(i)
  return buf.buffer
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

    // Register fontkit so pdf-lib can embed custom TTF/OTF
    try{
      if (typeof fontkit !== 'undefined' && typeof pdfDoc.registerFontkit === 'function') {
        pdfDoc.registerFontkit(fontkit)
        log('fontkit を登録しました（カスタムフォント埋め込み有効）')
      } else {
        log('fontkit が見つかりません。カスタムフォントの埋め込みに失敗する可能性があります。')
      }
    }catch(regErr){
      console.warn('fontkit register failed', regErr)
      log('fontkit の登録に失敗しました: '+(regErr && regErr.message))
    }

    // try to use uploaded font if provided
    let embeddedFont = null
    let uploadedFontFamily = null
    let uploadedFontFile = null
    const fontInput = document.getElementById('fontFile')
    if(fontInput && fontInput.files && fontInput.files.length>0){
      uploadedFontFile = fontInput.files[0]
      try{
        log('アップロードされたフォントをpdf-libに埋め込もうとしています...')
        const fontBytes = await readFileAsArrayBuffer(uploadedFontFile)
        embeddedFont = await pdfDoc.embedFont(fontBytes)
        log('pdf-libへのフォント埋め込みに成功しました')
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

    if(typeof pdfDoc.getPages !== 'function'){
      throw new Error('PDFドキュメントのページを取得できません。読み込みに失敗しています。')
    }
    const pages = pdfDoc.getPages()
    if(!pages || pages.length===0) throw new Error('PDFにページが含まれていません')
    const page = pages[0]

  // font fallback: use uploaded font or StandardFonts.Helvetica
  const helvetica = embeddedFont || await pdfDoc.embedFont(StandardFonts.Helvetica)

    // collect input
    const name = document.getElementById('name').value
    const examNumber = document.getElementById('examNumber').value
    const data = { name, examNumber }

    // Draw fields (use for..of so we can await inside the loop)
    for(const f of fieldMap){
      const v = data[f.key] || ''
      try{
        if(f.type === 'text' || !f.type){
          try{
            page.drawText(String(v), {
              x: f.x,
              y: f.y,
              size: f.size,
              font: helvetica,
              color: rgb(0,0,0)
            })
          }catch(errDraw){
            // If drawing fails (encoding), try rasterizing using uploaded font (if available)
            console.warn('drawText failed, will try canvas raster fallback', errDraw)
            if(uploadedFontFamily){
              try{
                const fontPx = Math.round(f.size * 1.3)
                const pngBytes = renderTextToPngBytes(String(v), uploadedFontFamily, fontPx)
                const pngImage = await pdfDoc.embedPng(pngBytes)
                const pngDims = pngImage.scale(1)
                page.drawImage(pngImage, { x: f.x, y: f.y, width: pngDims.width, height: pngDims.height })
                log('canvasラスタフォールバックで描画しました')
              }catch(rasterErr){
                log('canvasラスタリングでの描画に失敗しました: '+(rasterErr && rasterErr.message))
                console.error(rasterErr)
              }
            }else{
              throw errDraw
            }
          }
        }else if(f.type === 'checkbox'){
          // simple checkbox/cross rendering using unicode glyphs for reliability
          const mark = (v && String(v).toLowerCase() !== 'false') ? '☑' : '☐'
          page.drawText(mark, { x: f.x, y: f.y, size: f.size, font: helvetica, color: rgb(0,0,0) })
        }else if(f.type === 'circle'){
          const mark = (v && String(v).toLowerCase() !== 'false') ? '◯' : '○'
          page.drawText(mark, { x: f.x, y: f.y, size: f.size, font: helvetica, color: rgb(0,0,0) })
        }else{
          // unknown type: fallback to text
          page.drawText(String(v), { x: f.x, y: f.y, size: f.size, font: helvetica, color: rgb(0,0,0) })
        }
      }catch(drawErr){
        log('描画エラー: '+drawErr.message)
        if(!embeddedFont){
          log('日本語など非ASCII文字を描画するには日本語対応フォントを選択してください（例: Noto Sans JP の .ttf）。')
        }
      }
    }

  const pdfBytes = await pdfDoc.save()
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

document.getElementById('generate').addEventListener('click', ()=>{generate()})
document.getElementById('download').addEventListener('click', ()=>{/* a tag handled by href */})
