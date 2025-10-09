// Typed wrapper around the JS helper for loading default Japanese font bytes
export async function loadDefaultJapaneseFont(): Promise<Uint8Array | null> {
  const { loadDefaultJapaneseFont } = await import('./fonts.js') as {
    loadDefaultJapaneseFont: () => Uint8Array | null
  }
  return loadDefaultJapaneseFont()
}
