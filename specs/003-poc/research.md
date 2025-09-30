# Research: PoC - Drawing Circles with pdf-lib

## Decision: Use `pdf-lib` for PDF manipulation and drawing.

### Rationale
- The existing Proof of Concept (`specs/001-a4-pdf-pdf/poc/script.js`) already uses `pdf-lib`, so continuing with it maintains consistency and leverages existing code.
- `pdf-lib` is a well-documented and capable library for creating and modifying PDF documents in JavaScript.
- It supports drawing custom shapes, which is a core requirement for this feature.

### Alternatives Considered
- **jsPDF**: Another popular library for PDF generation. However, switching would require rewriting the existing PoC logic. For the scope of this feature, staying with `pdf-lib` is more efficient.

## How to draw a circle with `pdf-lib`
The `pdf-lib` library allows for drawing custom shapes using the `drawPage` method with pathing commands. A circle can be approximated using `drawEllipse`.

```javascript
import { PDFDocument, rgb } from 'pdf-lib'

async function drawCircle(pdfDoc) {
  const pages = pdfDoc.getPages()
  const firstPage = pages[0]

  const { width, height } = firstPage.getSize()
  firstPage.drawEllipse({
    x: width / 2,
    y: height / 2,
    xScale: 50, // radius
    yScale: 50, // radius
    color: rgb(0, 0, 0), // black
  })
}
```

## How to manage radio button state
Standard HTML and JavaScript can be used to manage the state of radio buttons.

### HTML
```html
<form id="main-form">
  <input type="radio" id="option1" name="drawing" value="draw">
  <label for="option1">Draw Circle</label><br>
  <input type="radio" id="option2" name="drawing" value="no-draw" checked>
  <label for="option2">Don't Draw</label><br>
</form>
```

### JavaScript
```javascript
const form = document.getElementById('main-form');

form.addEventListener('change', (event) => {
  if (event.target.type === 'radio' && event.target.name === 'drawing') {
    const selectedValue = event.target.value;
    if (selectedValue === 'draw') {
      // trigger PDF generation with circle
    } else {
      // trigger PDF generation without circle
    }
  }
});
```
This approach is simple, well-understood, and requires no external libraries.