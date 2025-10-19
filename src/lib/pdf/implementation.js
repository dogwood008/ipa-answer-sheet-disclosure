"use strict";

const fs = require('fs');
const path = require('path');

const NAMED_COLOR_HEX = { black: '#000000', red: '#FF0000', green: '#008000', blue: '#0000FF', white: '#FFFFFF' };

function normalizeHex(hex) {
  if (!hex || typeof hex !== 'string') return null;
  const v = hex.trim();
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return null;
  if (v.length === 4) {
    const r = v[1], g = v[2], b = v[3];
    return ('#' + r + r + g + g + b + b).toUpperCase();
  }
  return v.toUpperCase();
}

function normalizeColor(input) {
  if (typeof input !== 'string') return '#000000';
  const t = input.trim();
  const hx = normalizeHex(t);
  if (hx) return hx;
  const nm = NAMED_COLOR_HEX[t.toLowerCase()];
  if (nm) return nm;
  return '#000000';
}

function hexToRgb01(hex) {
  const h = normalizeHex(hex) || '#000000';
  return {
    r: parseInt(h.slice(1, 3), 16) / 255,
    g: parseInt(h.slice(3, 5), 16) / 255,
    b: parseInt(h.slice(5, 7), 16) / 255,
  };
}

function pad10(n) {
  const s = String(n);
  return s.length >= 10 ? s : '0'.repeat(10 - s.length) + s;
}

function escapePdfString(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

async function tryGenerateWithPdfLib(config, safeData, colorHex) {
  let PDFDocument, StandardFonts, rgb;
  try {
    ({ PDFDocument, StandardFonts, rgb } = require('pdf-lib'));
  } catch (_) {
    return null;
  }

  let fontkit = null;
  try { fontkit = require('@pdf-lib/fontkit'); } catch (_) { /* optional dependency */ }

  let templateBytes = null;
  if (config && config.templateBytes instanceof Uint8Array) {
    templateBytes = config.templateBytes;
  } else {
    const templatePath = (config && typeof config.templatePath === 'string')
      ? path.resolve(config.templatePath)
      : path.join(process.cwd(), 'specs', '001-a4-pdf-pdf', 'poc', 'in.pdf');
    try {
      templateBytes = new Uint8Array(fs.readFileSync(templatePath));
    } catch (_) {
      templateBytes = null;
    }
  }

  const doc = templateBytes
    ? await PDFDocument.load(templateBytes, { ignoreEncryption: true })
    : await PDFDocument.create();

  if (!templateBytes) {
    doc.addPage([612, 792]);
  }

  if (fontkit && typeof doc.registerFontkit === 'function') {
    try { doc.registerFontkit(fontkit); } catch (_) { /* ignore fontkit registration failures */ }
  }

  const pages = doc.getPages();
  const page = pages[0] || doc.addPage([612, 792]);

  let font = null;
  try {
    const { loadDefaultJapaneseFont } = require('./fonts.js');
    const bytes = loadDefaultJapaneseFont();
    if (bytes) {
      font = await doc.embedFont(bytes, { subset: true });
    }
  } catch (_) {
    font = null;
  }
  if (!font) {
    font = await doc.embedFont(StandardFonts.Helvetica);
  }

  const size = typeof page.getSize === 'function' ? page.getSize() : { width: 612, height: 792 };
  const pageH = size.height || 792;

  const rgbColor = hexToRgb01(colorHex);
  const col = rgb(rgbColor.r, rgbColor.g, rgbColor.b);

  function drawWrappedText(text, x, yTop, sizePt, maxWidthPt, maxLines) {
    const y0 = pageH - yTop;
    if (!maxWidthPt || !font.widthOfTextAtSize) {
      page.drawText(text, { x, y: y0, size: sizePt, font, color: col });
      return;
    }
    let pt = sizePt;
    const minPt = 6;
    const words = String(text).split(/(\s+)/);
    const layout = (fs) => {
      const lines = [];
      let cur = '';
      for (const w of words) {
        const test = cur ? (cur + w) : w;
        const width = font.widthOfTextAtSize(test, fs);
        if (width <= maxWidthPt || cur === '') { cur = test; } else { lines.push(cur.trimEnd()); cur = w.trimStart(); }
      }
      if (cur) lines.push(cur);
      return lines;
    };
    let lines = layout(pt);
    while (lines.length > (maxLines || 1) && pt > minPt) {
      pt = Math.max(minPt, pt - 1);
      lines = layout(pt);
    }
    if (lines.length > (maxLines || 1)) {
      lines = lines.slice(0, maxLines || 1);
      let last = lines[lines.length - 1];
      while (font.widthOfTextAtSize(last + '…', pt) > maxWidthPt && last.length > 0) {
        last = last.slice(0, -1);
      }
      lines[lines.length - 1] = last + '…';
    }
    const leading = pt * 1.2;
    for (let i = 0; i < lines.length; i++) {
      page.drawText(lines[i], { x, y: y0 - i * leading, size: pt, font, color: col });
    }
  }

  drawWrappedText(safeData.furigana, 218, 146, 11, (386 - 146), 2);
  drawWrappedText(safeData.name, 218, 162, 14, (386 - 146), 2);
  const examY = pageH === 792 ? 720 : pageH - (pageH - 720);
  page.drawText(safeData.examNumber, { x: 420, y: examY, size: 12, font, color: col });

  if (safeData.drawCircle) {
    const cx = 100;
    const cy = pageH - (pageH - 680);
    if (typeof page.drawCircle === 'function') {
      page.drawCircle({ x: cx, y: cy, size: 10, borderColor: col, borderWidth: 1 });
    } else if (typeof page.drawEllipse === 'function') {
      page.drawEllipse({ x: cx, y: cy, xScale: 10, yScale: 10, borderColor: col, borderWidth: 1 });
    }
  }

  if (safeData.rect && safeData.rect.valid) {
    const { x, yTop, w, h } = safeData.rect;
    const ry = pageH - yTop - h;
    if (typeof page.drawRectangle === 'function') {
      page.drawRectangle({ x, y: ry, width: w, height: h, borderColor: col, borderWidth: 1 });
    }
  }

  const pdfBytes = await doc.save();
  return new Uint8Array(pdfBytes);
}

function generateMinimalPdf(safeData, colorHex) {
  const { name, examNumber, furigana } = safeData;
  const hex = colorHex;

  const chunks = [];
  let offset = 0;
  const push = (str) => { chunks.push(str); offset += Buffer.byteLength(str, 'utf8'); };

  push('%PDF-1.4\n');

  const off1 = offset; push('1 0 obj\n');
  push('<< /Type /Catalog /Pages 2 0 R >>\n');
  push('endobj\n');

  const off2 = offset; push('2 0 obj\n');
  push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n');
  push('endobj\n');

  const off3 = offset; push('3 0 obj\n');
  push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
       '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\n');
  push('endobj\n');

  const off4 = offset; push('4 0 obj\n');
  push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n');
  push('endobj\n');

  const toRGB = (h) => {
    const r = parseInt(h.slice(1, 3), 16) / 255;
    const g = parseInt(h.slice(3, 5), 16) / 255;
    const b = parseInt(h.slice(5, 7), 16) / 255;
    return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
  };
  const strokeRGB = toRGB(hex);
  const contentParts = [];
  contentParts.push(`BT /F1 11 Tf 218 ${842 - 146} Td (${escapePdfString(furigana)}) Tj ET\n`);
  contentParts.push(`BT /F1 16 Tf 218 ${842 - 162} Td (${escapePdfString(name)}) Tj ET\n`);
  contentParts.push(`BT /F1 12 Tf 420 720 Td (${escapePdfString(examNumber)}) Tj ET\n`);

  if (safeData.rect && safeData.rect.valid) {
    const { x, yTop, w, h } = safeData.rect;
    const ry = 842 - yTop - h;
    contentParts.push(`${strokeRGB} RG 1 w ${x} ${ry} ${w} ${h} re S\n`);
  }

  const content = contentParts.join('');
  const contentLen = Buffer.byteLength(content, 'utf8');
  const off5 = offset; push('5 0 obj\n');
  push('<< /Length ' + contentLen + ' >>\n');
  push('stream\n');
  push(content);
  push('endstream\n');
  push('endobj\n');

  const xrefOff = offset;
  push('xref\n');
  push('0 6\n');
  push('0000000000 65535 f \n');
  push(pad10(off1) + ' 00000 n \n');
  push(pad10(off2) + ' 00000 n \n');
  push(pad10(off3) + ' 00000 n \n');
  push(pad10(off4) + ' 00000 n \n');
  push(pad10(off5) + ' 00000 n \n');

  push('trailer\n');
  push('<< /Size 6 /Root 1 0 R >>\n');
  push('startxref\n');
  push(String(xrefOff) + '\n');
  push('%%EOF\n');

  const pdfStr = chunks.join('');
  return new Uint8Array(Buffer.from(pdfStr, 'utf8'));
}

function sanitizeRect(rect) {
  if (!rect || typeof rect !== 'object') return null;
  const x = Number(rect.x);
  const yTop = Number(rect.yTop);
  const w = Number(rect.w);
  const h = Number(rect.h);
  const valid = Number.isFinite(x) && Number.isFinite(yTop) && Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0;
  return { x: Number.isFinite(x) ? x : 0, yTop: Number.isFinite(yTop) ? yTop : 0, w: Number.isFinite(w) ? w : 0, h: Number.isFinite(h) ? h : 0, valid };
}

async function generateAnswerSheetPdf(config, data) {
  if (!data || typeof data.name !== 'string' || typeof data.examNumber !== 'string') {
    throw new Error('InvalidInput');
  }

  const safeData = {
    name: String(data.name),
    examNumber: String(data.examNumber),
    furigana: data.furigana != null ? String(data.furigana) : '',
    drawCircle: Boolean(data.drawCircle),
    rect: sanitizeRect(data.rect),
  };
  const colorHex = normalizeColor(data.color || '#000000');

  try {
    const pdfLibBytes = await tryGenerateWithPdfLib(config, safeData, colorHex);
    if (pdfLibBytes) {
      return pdfLibBytes;
    }
  } catch (err) {
    if (process && process.env && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('pdf-lib generation failed, falling back to minimal generator:', err);
    }
  }

  return generateMinimalPdf(safeData, colorHex);
}

module.exports = { generateAnswerSheetPdf };
