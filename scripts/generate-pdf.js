#!/usr/bin/env node
"use strict";

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { input: null, out: 'out.pdf' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--input' || a === '-i') args.input = argv[++i];
    else if (a === '--out' || a === '-o') args.out = argv[++i];
  }
  if (!args.input) {
    console.error('Usage: node scripts/generate-pdf.js --input data.json [--out out.pdf]');
    process.exit(2);
  }
  return args;
}

function main() {
  const { generateAnswerSheetPdf } = require('../src/lib/pdf/index.js');
  const args = parseArgs(process.argv);
  const json = JSON.parse(fs.readFileSync(path.resolve(args.input), 'utf8'));
  const bytes = generateAnswerSheetPdf({}, json);
  fs.writeFileSync(path.resolve(args.out), Buffer.from(bytes));
  console.log(`Wrote ${args.out} (${bytes.byteLength} bytes)`);
}

if (require.main === module) {
  main();
}

