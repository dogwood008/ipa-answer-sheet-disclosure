# Research: PoC - Drawing Rectangles with pdf-lib

## Decision: Use `pdf-lib` for PDF manipulation and drawing.

### Rationale
- The existing Proof of Concept already uses `pdf-lib`, so continuing with it maintains consistency and leverages existing code.
- `pdf-lib` provides a `drawRectangle` method, which directly supports the core requirement of this feature.

### Alternatives Considered
- **jsPDF**: While also capable, switching would require refactoring existing code. `pdf-lib` is sufficient and already integrated.

## How to draw a rectangle with `pdf-lib`
The `pdf-lib` library has a straightforward method for drawing rectangles.

```javascript
import { PDFDocument, rgb } from 'pdf-lib'

async function drawRectangle(pdfDoc, options) {
  const pages = pdfDoc.getPages()
  const firstPage = pages[0]

  firstPage.drawRectangle({
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    color: options.color || rgb(0, 0, 0), // Default to black
  })
}
```

## How to manage numeric inputs for dimensions
Standard HTML `<input type="number">` fields can be used to gather the dimensions from the user.

### HTML
```html
<form id="rectangle-form">
  <label for="rect-x">X:</label>
  <input type="number" id="rect-x" name="rect-x" value="50">
  <label for="rect-y">Y:</label>
  <input type="number" id="rect-y" name="rect-y" value="50">
  <label for="rect-width">Width:</label>
  <input type="number" id="rect-width" name="rect-width" value="100">
  <label for="rect-height">Height:</label>
  <input type="number" id="rect-height" name="rect-height" value="50">
</form>
```

### JavaScript
```javascript
const form = document.getElementById('rectangle-form');
const xInput = document.getElementById('rect-x');
const yInput = document.getElementById('rect-y');
const widthInput = document.getElementById('rect-width');
const heightInput = document.getElementById('rect-height');

function getRectangleDimensions() {
  return {
    x: parseInt(xInput.value, 10),
    y: parseInt(yInput.value, 10),
    width: parseInt(widthInput.value, 10),
    height: parseInt(heightInput.value, 10),
  };
}

// On PDF generation, call getRectangleDimensions() and pass to the drawing function.
// Add validation to ensure all values are numbers.
```
This approach is simple and uses standard browser features.