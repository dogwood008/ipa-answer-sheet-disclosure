const path = require('path');

describe('generateAnswerSheetPdf (library API)', () => {
  /**
   * Lazy import to allow test to define shape before implementation.
   */
  const libPath = path.join(process.cwd(), 'src', 'lib', 'pdf', 'index.js');

  test('exports a function generateAnswerSheetPdf(config, data)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { generateAnswerSheetPdf } = require(libPath);
    expect(typeof generateAnswerSheetPdf).toBe('function');
  });

  test('throws InvalidInput when required fields are missing', async () => {
    const { generateAnswerSheetPdf } = require(libPath);
    expect(() => generateAnswerSheetPdf({}, { name: 'Taro' })).toThrow('InvalidInput');
    expect(() => generateAnswerSheetPdf({}, { examNumber: 'AB1234' })).toThrow('InvalidInput');
  });

  test('returns a PDF byte array (starts with %PDF-)', async () => {
    const { generateAnswerSheetPdf } = require(libPath);
    const bytes = generateAnswerSheetPdf({}, { name: 'Taro', examNumber: 'AB1234' });
    expect(bytes).toBeInstanceOf(Uint8Array);
    const header = Buffer.from(bytes).subarray(0, 5).toString('utf8');
    expect(header).toBe('%PDF-');
  });
});

