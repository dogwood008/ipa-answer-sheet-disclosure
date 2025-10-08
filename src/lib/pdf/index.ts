import type { GenerateConfig, UserInput } from './types'

// Bridge to the JS implementation to avoid duplication while providing TS types
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { generateAnswerSheetPdf: impl } = require('./index.js') as {
  generateAnswerSheetPdf: (config: GenerateConfig, data: UserInput) => Uint8Array
}

export function generateAnswerSheetPdf(config: GenerateConfig, data: UserInput): Uint8Array {
  return impl(config, data)
}
