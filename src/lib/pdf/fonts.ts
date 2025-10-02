// Typed wrapper around the JS helper for loading default Japanese font bytes
export function loadDefaultJapaneseFont(): Uint8Array | null {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const { loadDefaultJapaneseFont } = require('./fonts.js') as {
    loadDefaultJapaneseFont: () => Uint8Array | null
  }
  return loadDefaultJapaneseFont()
}

