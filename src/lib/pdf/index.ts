import type { GenerateConfig, UserInput } from './types'

let impl: ((config: GenerateConfig, data: UserInput) => Uint8Array) | undefined

async function loadImpl(): Promise<(config: GenerateConfig, data: UserInput) => Uint8Array> {
  if (impl) return impl
  try {
    const mod: unknown = await import('./pdfImpl.js')
    if (
      typeof mod !== 'object' ||
      mod === null ||
      !('generateAnswerSheetPdf' in mod) ||
      typeof (mod as Record<string, unknown>).generateAnswerSheetPdf !== 'function'
    ) {
      throw new Error('generateAnswerSheetPdf is not a function in ./index.js')
    }
    impl = (mod as { generateAnswerSheetPdf: (config: GenerateConfig, data: UserInput) => Uint8Array }).generateAnswerSheetPdf
    return impl
  } catch (err) {
    throw new Error(`Failed to load generateAnswerSheetPdf implementation: ${String(err)}`)
  }
}

export async function generateAnswerSheetPdf(
  config: GenerateConfig,
  data: UserInput
): Promise<Uint8Array> {
  const fn = await loadImpl()
  return fn(config, data)
}
