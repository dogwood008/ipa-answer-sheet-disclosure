export interface UserInput { name: string; examNumber: string }

function pad10(n: number): string {
  const s = String(n)
  return s.length >= 10 ? s : '0'.repeat(10 - s.length) + s
}
function esc(s: string): string {
  return String(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')
}

export function generateAnswerSheetPdf(_config: unknown, data: UserInput): Uint8Array {
  if (!data || typeof data.name !== 'string' || typeof data.examNumber !== 'string') {
    throw new Error('InvalidInput')
  }
  const name = String(data.name)
  const exam = String(data.examNumber)

  const chunks: string[] = []
  let off = 0
  const enc = new TextEncoder()
  const push = (s: string)=>{ chunks.push(s); off += enc.encode(s).byteLength }
  push('%PDF-1.4\n')
  const off1 = off; push('1 0 obj\n'); push('<< /Type /Catalog /Pages 2 0 R >>\n'); push('endobj\n')
  const off2 = off; push('2 0 obj\n'); push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n'); push('endobj\n')
  const off3 = off; push('3 0 obj\n'); push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\n'); push('endobj\n')
  const off4 = off; push('4 0 obj\n'); push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n'); push('endobj\n')
  const content = `BT /F1 16 Tf 72 720 Td (${esc(name)}) Tj ET\nBT /F1 12 Tf 72 700 Td (${esc(exam)}) Tj ET\n`
  const len = enc.encode(content).byteLength
  const off5 = off; push('5 0 obj\n'); push(`<< /Length ${len} >>\n`); push('stream\n'); push(content); push('endstream\n'); push('endobj\n')
  const xref = off
  push('xref\n'); push('0 6\n'); push('0000000000 65535 f \n'); push(`${pad10(off1)} 00000 n \n`); push(`${pad10(off2)} 00000 n \n`); push(`${pad10(off3)} 00000 n \n`); push(`${pad10(off4)} 00000 n \n`); push(`${pad10(off5)} 00000 n \n`)
  push('trailer\n'); push('<< /Size 6 /Root 1 0 R >>\n'); push('startxref\n'); push(String(xref)+'\n'); push('%%EOF\n')
  return enc.encode(chunks.join(''))
}
