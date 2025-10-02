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

  // Try to use pdf-lib if available; otherwise fall back to minimal generator
  try {
    // Lazy-require to avoid hard dependency in restricted environments
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
    // Optional: fontkit for TrueType embedding
    let fontkit = null; try { fontkit = require('@pdf-lib/fontkit'); } catch(_) {}
    const fs = require('fs');
    const path = require('path');
    // Load template bytes: config.templateBytes | config.templatePath | default path
    let templateBytes = null;
    if (config && config.templateBytes instanceof Uint8Array) {
      templateBytes = config.templateBytes;
    } else {
      const templatePath = (config && config.templatePath) || path.join(process.cwd(), 'specs', '001-a4-pdf-pdf', 'poc', 'in.pdf');
      try { templateBytes = new Uint8Array(fs.readFileSync(templatePath)); } catch(_) { templateBytes = null }
    }

    const init = async () => {
      let doc = null;
      if (templateBytes) {
        doc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
      } else {
        doc = await PDFDocument.create();
        doc.addPage([612, 792]);
      }
      if (fontkit && typeof doc.registerFontkit === 'function') {
        try { doc.registerFontkit(fontkit); } catch(_) {}
      }

      const pages = doc.getPages();
      const page = pages[0] || doc.addPage([612,792]);

      // Try to embed local Japanese font; fallback to Helvetica
      let font = null;
      try {
        const { loadDefaultJapaneseFont } = require('./fonts.js');
        const bytes = loadDefaultJapaneseFont();
        if (bytes) font = await doc.embedFont(bytes, { subset: true });
      } catch(_) {}
      if (!font) {
        const helv = await doc.embedFont(StandardFonts.Helvetica);
        font = helv;
      }

      const black = rgb(0,0,0);
      // A4 height points
      const HEIGHT_PT = 842; // fallback if template uses A4; our page is 792 if newly created
      const size = page.getSize ? page.getSize() : { width: 612, height: 792 };
      const h = size.height || HEIGHT_PT;

      const name = String(data.name);
      const exam = String(data.examNumber);

      // Field positions (approx, derived from PoC). Use page height to convert from top-based to PDF bottom origin if needed.
      const fields = [
        { text: name, x: 218, yTop: 162, size: 14 }, // name at y from top 162
        { text: exam, x: 420, yTop: (size.height === 792 ? (792-720) : (h-720)), size: 12, absolute: true }, // if PDF height differs, keep absolute y when given in bottom origin
      ];
      for (const f of fields) {
        const y = f.absolute ? (typeof f.yTop === 'number' ? f.yTop : (h - (f.yTop||0))) : (h - (f.yTop||0));
        page.drawText(f.text, { x: f.x, y, size: f.size, font, color: black });
      }

      const pdfBytes = await doc.save();
      return new Uint8Array(pdfBytes);
    };

    // Run the async path synchronously to keep API stable (blocking)
    const wait = (p) => {
      let done = false, result, error;
      p.then((r)=>{ done=true; result=r }).catch((e)=>{ done=true; error=e });
      // crude sync wait loop (Node-only); bounded by small iterations since operations are in-memory
      const start = Date.now();
      while(!done) {
        if (Date.now() - start > 2000) { throw new Error('pdf-lib generation timeout') }
        Atomics.wait ? Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10) : require('deasync').runLoopOnce();
      }
      if (error) throw error; return result;
    };

    try {
      return wait(init());
    } catch (_) {
      // fall back below
    }
  } catch (_) {
    // pdf-lib not installed or failed
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
