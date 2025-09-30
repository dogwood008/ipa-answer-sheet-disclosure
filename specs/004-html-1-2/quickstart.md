# Quickstart: Verify Color Selection

1) Start static server
   - `cd specs/001-a4-pdf-pdf/poc && python3 -m http.server 8000`

2) Open http://localhost:8000 in a browser

3) Test presets
   - Click Black preset → generate PDF → text and circle are black
   - Click Red preset → generate PDF → text and circle are red

4) Test color picker
   - Use `<input type="color">` to select blue → generate → elements are blue

5) Test named colors
   - Enter `green` (CSS named color) → generate → elements are green
   - Enter `not-a-color` → generate → elements are black (fallback)

Note: If remote CDN fetches fail for fonts/PDF.js, use the local template upload in the UI as described on the page.

