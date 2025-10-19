# Research: PoC Rewrite with TypeScript and React

## Decision: Use Vite for project setup, React for UI, and Zustand for state management.

### Rationale
- **Vite**: Provides a fast development experience with Hot Module Replacement (HMR) and optimized builds. It has excellent support for TypeScript out of the box.
- **React**: A robust and widely-used library for building user interfaces, with a strong ecosystem.
- **Zustand**: A small, fast, and scalable state management library. It's simpler than Redux and avoids the boilerplate of React Context for this small-scale application.
- **pdf-lib**: The existing library for PDF manipulation will be retained for its proven capabilities.

### Alternatives Considered
- **Create React App**: A more traditional choice for React projects, but Vite offers a faster and more modern development experience.
- **Redux/React Context**: Redux is overkill for this application's simple state needs. React Context can lead to performance issues with frequent updates, whereas Zustand is more optimized.

## Font Handling
The recommendation is to use a web font (e.g., from Google Fonts) for the UI and to embed a specific font file (like the NotoSansJP-Regular.ttf from the original PoC) into the PDF for consistency. The font file can be fetched from the `public` directory of the Vite project.

## `pdf-lib` Integration
`pdf-lib` can be wrapped in a TypeScript service module. This module will export functions to load the PDF template, draw the user's data, and return the generated PDF as a `Uint8Array`. React components will call these service functions.

```typescript
// src/services/pdfService.ts
import { PDFDocument, rgb } from 'pdf-lib';

export const generatePdf = async (userInput: UserInput): Promise<Uint8Array> => {
  const templateBytes = await fetch('/path/to/template.pdf').then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  // ... drawing logic using userInput ...

  return pdfDoc.save();
};
```
This approach isolates the PDF logic from the UI components, making the code cleaner and easier to test.