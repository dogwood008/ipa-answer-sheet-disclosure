export interface GenerateConfig {
  // Reserved for future use (e.g., template bytes/path, layout options)
  template?: any
  // Optional: override template bytes or path for pdf-lib path
  templateBytes?: Uint8Array
  templatePath?: string
}

export interface UserInput {
  name: string
  examNumber: string
  // Optional fields migrated from PoC
  furigana?: string
  color?: string // hex (#RRGGBB or #RGB) or limited named (black/red/green/blue/white)
  drawCircle?: boolean
  rect?: {
    enabled?: boolean
    x: number
    yTop: number // from top (PDF points)
    w: number
    h: number
  }
}
