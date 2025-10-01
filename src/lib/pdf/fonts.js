"use strict";

const fs = require('fs');
const path = require('path');

/**
 * Load NotoSansJP-Regular.ttf bytes from the repository if present.
 * Returns Uint8Array or null if not found.
 */
function loadDefaultJapaneseFont() {
  const candidates = [
    path.join(process.cwd(), 'NotoSansJP-Regular.ttf'),
    path.join(process.cwd(), 'assets', 'NotoSansJP-Regular.ttf'),
  ];
  for (const p of candidates) {
    try {
      const buf = fs.readFileSync(p);
      return new Uint8Array(buf);
    } catch (_) {
      // continue
    }
  }
  return null;
}

module.exports = { loadDefaultJapaneseFont };

