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

/**
 * Generate a minimal PDF as Uint8Array.
 * NOTE: This is a placeholder implementation to satisfy TDD and API shape.
 * Future work will integrate pdf-lib and the official template.
 *
 * @param {GenerateConfig} config
 * @param {UserInput} data
 * @returns {Uint8Array}
 */
function generateAnswerSheetPdf(config, data) {
  if (!data || typeof data.name !== 'string' || typeof data.examNumber !== 'string') {
    throw new Error('InvalidInput');
  }

  // Minimal, lenient PDF bytes (single blank page). Viewers often accept even if xref offsets are not precise.
  // This is enough for unit contract: starts with %PDF- and is a Uint8Array.
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
  ].join('');

  return new Uint8Array(Buffer.from(pdf, 'utf8'));
}

module.exports = { generateAnswerSheetPdf };

