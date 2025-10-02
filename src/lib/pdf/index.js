"use strict";

/**
 * @typedef {Object} UserInput
 * @property {string} name
 * @property {string} examNumber
 */

/**
 * @typedef {Object} GenerateConfig
 * @property {any} [template] - Reserved for future use (PDF template bytes/path)
 */

function pad10(n) {
  const s = String(n);
  return s.length >= 10 ? s : '0'.repeat(10 - s.length) + s;
}

function escapePdfString(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * Generate a minimal, valid single-page PDF with Helvetica and simple text drawing.
 * No external dependencies; offsets and xref are computed for correctness.
 *
 * @param {GenerateConfig} config
 * @param {UserInput} data
 * @returns {Uint8Array}
 */
function generateAnswerSheetPdf(config, data) {
  if (!data || typeof data.name !== 'string' || typeof data.examNumber !== 'string') {
    throw new Error('InvalidInput');
  }

  const name = data.name;
  const exam = data.examNumber;

  const chunks = [];
  let offset = 0;
  const push = (str) => { chunks.push(str); offset += Buffer.byteLength(str, 'utf8'); };

  push('%PDF-1.4\n');

  // 1: Catalog
  const off1 = offset; push('1 0 obj\n');
  push('<< /Type /Catalog /Pages 2 0 R >>\n');
  push('endobj\n');

  // 2: Pages
  const off2 = offset; push('2 0 obj\n');
  push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n');
  push('endobj\n');

  // 3: Page
  const off3 = offset; push('3 0 obj\n');
  push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
       '/Resources << /Font << /F1 4 0 R >> >> ' +
       '/Contents 5 0 R >>\n');
  push('endobj\n');

  // 4: Font (Helvetica)
  const off4 = offset; push('4 0 obj\n');
  push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n');
  push('endobj\n');

  // 5: Contents stream
  const content = [
    'BT /F1 16 Tf 72 720 Td (' + escapePdfString(name) + ') Tj ET\n',
    'BT /F1 12 Tf 72 700 Td (' + escapePdfString(exam) + ') Tj ET\n',
  ].join('');
  const contentLen = Buffer.byteLength(content, 'utf8');
  const off5 = offset; push('5 0 obj\n');
  push('<< /Length ' + contentLen + ' >>\n');
  push('stream\n');
  push(content);
  push('endstream\n');
  push('endobj\n');

  // xref
  const xrefOff = offset;
  push('xref\n');
  push('0 6\n');
  push('0000000000 65535 f \n');
  push(pad10(off1) + ' 00000 n \n');
  push(pad10(off2) + ' 00000 n \n');
  push(pad10(off3) + ' 00000 n \n');
  push(pad10(off4) + ' 00000 n \n');
  push(pad10(off5) + ' 00000 n \n');

  // trailer
  push('trailer\n');
  push('<< /Size 6 /Root 1 0 R >>\n');
  push('startxref\n');
  push(String(xrefOff) + '\n');
  push('%%EOF\n');

  const pdfStr = chunks.join('');
  return new Uint8Array(Buffer.from(pdfStr, 'utf8'));
}

module.exports = { generateAnswerSheetPdf };
