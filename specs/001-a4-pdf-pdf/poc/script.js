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

    log('PDFを読み込み中...')
    const pdfDoc = await PDFDocument.load(templateBytes)

    // try to fetch font
    let notoBytes = null
    try{
      log('Noto Sans を取得しようとしています（失敗しても続行）...')
      // placeholder fetch; in many environments CORS may block font fetch
      // notoBytes = await fetchArrayBuffer(NOTO_CSS_URL)
    }catch(e){
      log('フォント取得に失敗しました。標準フォントで代替します。')
    }

    const pages = pdfDoc.getPages()
    const page = pages[0]

    // font fallback: use StandardFonts.Helvetica
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

    // collect input
    const name = document.getElementById('name').value
    const examNumber = document.getElementById('examNumber').value
    const data = { name, examNumber }

    // Draw fields
    fieldMap.forEach(f=>{
      const v = data[f.key] || ''
      page.drawText(String(v), {
        x: f.x,
        y: f.y,
        size: f.size,
        font: helvetica,
        color: rgb(0,0,0)
      })
    })

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
