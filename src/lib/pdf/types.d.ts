export interface GenerateConfig {
  template?: any;
}

export interface UserInput {
  name: string;
  examNumber: string;
}

export function generateAnswerSheetPdf(
  config: GenerateConfig,
  data: UserInput
): Uint8Array;

