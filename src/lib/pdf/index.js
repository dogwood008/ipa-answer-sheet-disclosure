"use strict";

/**
 * @typedef {Object} UserInput
 * @property {string} name
 * @property {string} examNumber
 * @property {string} [furigana]
 * @property {string} [color] - hex (#RRGGBB/#RGB) or named (black/red/green/blue/white)
 * @property {boolean} [drawCircle]
 * @property {{ enabled?: boolean, x:number, yTop:number, w:number, h:number }} [rect]
 */

/**
 * @typedef {Object} GenerateConfig
 * @property {any} [template] - Reserved for future use (compat)
 * @property {Uint8Array} [templateBytes]
 * @property {string} [templatePath]
 */

const NAMED_COLOR_HEX = { black:'#000000', red:'#FF0000', green:'#008000', blue:'#0000FF', white:'#FFFFFF' };
function normalizeHex(hex){
  if(!hex || typeof hex !== 'string') return null;
  const v = hex.trim();
  if(!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return null;
  if(v.length === 4){ const r=v[1], g=v[2], b=v[3]; return ('#'+r+r+g+g+b+b).toUpperCase() }
  return v.toUpperCase();
}
function normalizeColor(input){
  if(typeof input !== 'string') return '#000000';
  const t = input.trim();
  const hx = normalizeHex(t); if(hx) return hx;
  const nm = NAMED_COLOR_HEX[t.toLowerCase()]; if(nm) return nm;
  return '#000000';
}
function hexToRgb01(hex){
  const h = normalizeHex(hex) || '#000000';
  return {
    r: parseInt(h.slice(1,3),16)/255,
    g: parseInt(h.slice(3,5),16)/255,
    b: parseInt(h.slice(5,7),16)/255,
  };
}

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

      const size = page.getSize ? page.getSize() : { width: 612, height: 792 };
      const pageH = size.height || 792;

      // Resolve color
      const hex = normalizeColor(data.color || '#000000');
      const c = hexToRgb01(hex);
      const col = rgb(c.r, c.g, c.b);

      const name = String(data.name);
      const exam = String(data.examNumber);
      const furigana = data.furigana != null ? String(data.furigana) : '';

      // Layout helper similar to PoC: shrink-to-fit across maxLines and width
      function drawWrappedText(text, x, yTop, sizePt, maxWidthPt, maxLines){
        const y0 = pageH - yTop; // convert top-origin to PDF bottom-origin
        if (!maxWidthPt || !font.widthOfTextAtSize){
          page.drawText(text, { x, y: y0, size: sizePt, font, color: col });
          return;
        }
        let pt = sizePt;
        const minPt = 6;
        const words = String(text).split(/(\s+)/);
        const layout = (fs)=>{
          const lines = [];
          let cur = '';
          for(const w of words){
            const test = cur ? (cur + w) : w;
            const width = font.widthOfTextAtSize(test, fs);
            if(width <= maxWidthPt || cur === ''){ cur = test } else { lines.push(cur.trimEnd()); cur = w.trimStart() }
          }
          if(cur) lines.push(cur);
          return lines;
        };
        let lines = layout(pt);
        while(lines.length > (maxLines||1) && pt > minPt){ pt=Math.max(minPt, pt-1); lines = layout(pt) }
        if(lines.length > (maxLines||1)){
          lines = lines.slice(0, maxLines||1);
          let last = lines[lines.length-1];
          while(font.widthOfTextAtSize(last + '…', pt) > maxWidthPt && last.length>0){ last = last.slice(0, -1) }
          lines[lines.length-1] = last + '…';
        }
        const leading = pt * 1.2;
        for(let i=0;i<lines.length;i++){
          page.drawText(lines[i], { x, y: y0 - i*leading, size: pt, font, color: col });
        }
      }

      // Draw fields (positions ported from PoC)
      drawWrappedText(furigana, 218, 146, 11, (386-146), 2);
      drawWrappedText(name,     218, 162, 14, (386-146), 2);
      // examNumber uses absolute bottom-origin y in PoC for 720 when page height=792; convert from top-origin for generality
      page.drawText(exam, { x: 420, y: (pageH === 792 ? 720 : (pageH - (pageH-720))), size: 12, font, color: col });

      // Optional circle
      if (data.drawCircle) {
        const cx = 100, cy = pageH - (pageH-680); // 680 from bottom in PoC
        if (typeof page.drawCircle === 'function') {
          page.drawCircle({ x: 100, y: 680, size: 10, borderColor: col, borderWidth: 1 });
        } else if (typeof page.drawEllipse === 'function') {
          page.drawEllipse({ x: 100, y: 680, xScale: 10, yScale: 10, borderColor: col, borderWidth: 1 });
        }
      }

      // Optional rectangle
      if (data.rect && (data.rect.enabled === undefined || !!data.rect.enabled)){
        const rx = Number(data.rect.x)||0;
        const ryTop = Number(data.rect.yTop)||0;
        const rw = Number(data.rect.w)||0;
        const rh = Number(data.rect.h)||0;
        if (rw>0 && rh>0){
          const ry = pageH - ryTop - rh;
          if (typeof page.drawRectangle === 'function'){
            page.drawRectangle({ x: rx, y: ry, width: rw, height: rh, borderColor: col, borderWidth: 1 });
          }
        }
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
  const furigana = data.furigana || '';
  const hex = normalizeColor(data.color || '#000000');

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

  // 5: Contents stream (very small: draw three text strings; optional simple rectangle/circle)
  const toRGB = (h)=>{
    const r = parseInt(h.slice(1,3),16)/255;
    const g = parseInt(h.slice(3,5),16)/255;
    const b = parseInt(h.slice(5,7),16)/255;
    return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
  };
  const strokeRGB = toRGB(hex);
  const contentParts = [];
  contentParts.push(`BT /F1 11 Tf 218 ${842-146} Td (${escapePdfString(furigana)}) Tj ET\n`);
  contentParts.push(`BT /F1 16 Tf 218 ${842-162} Td (${escapePdfString(name)}) Tj ET\n`);
  contentParts.push(`BT /F1 12 Tf 420 720 Td (${escapePdfString(exam)}) Tj ET\n`);
  // Optional rectangle
  try{
    if (data.rect && (data.rect.enabled === undefined || !!data.rect.enabled)){
      const rx = Number(data.rect.x)||0;
      const ryTop = Number(data.rect.yTop)||0;
      const rw = Number(data.rect.w)||0;
      const rh = Number(data.rect.h)||0;
      if (rw>0 && rh>0){
        const ry = 842 - ryTop - rh;
        contentParts.push(`${strokeRGB} RG 1 w ${rx} ${ry} ${rw} ${rh} re S\n`);
      }
    }
  }catch(_){}
  // Note: circle drawing omitted in minimal path for simplicity
  const content = contentParts.join('');
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
