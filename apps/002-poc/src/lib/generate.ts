export interface UserInput { name: string; examNumber: string }

export function generateAnswerSheetPdf(_config: any, data: UserInput): Uint8Array {
  if (!data || typeof data.name !== 'string' || typeof data.examNumber !== 'string') {
    throw new Error('InvalidInput')
  }
  const pdf = [
    '%PDF-1.4\n',
    '1 0 obj\n',
    '<< /Type /Catalog /Pages 2 0 R >>\n',
    'endobj\n',
    '2 0 obj\n',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n',
    'endobj\n',
    '3 0 obj\n',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\n',
    'endobj\n',
    'xref\n',
    '0 4\n',
    '0000000000 65535 f \n',
    '0000000010 00000 n \n',
    '0000000061 00000 n \n',
    '0000000124 00000 n \n',
    'trailer\n',
    '<< /Size 4 /Root 1 0 R >>\n',
    'startxref\n',
    '188\n',
    '%%EOF\n'
  ].join('')
  return new TextEncoder().encode(pdf)
}

