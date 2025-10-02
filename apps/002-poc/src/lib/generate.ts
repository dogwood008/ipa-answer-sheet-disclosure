// Delegate to the root library implementation to avoid duplication
// Types are provided via the root d.ts where available
import type { UserInput } from '../../../src/lib/pdf/types'
// Import JS implementation (library-first). Vite allows fs access to repo root per config.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - importing JS module for runtime implementation
import { generateAnswerSheetPdf as generateFromLib } from '../../../src/lib/pdf/index.js'

export function generateAnswerSheetPdf(config: any, data: UserInput): Uint8Array {
  return generateFromLib(config, data)
}
