# Tasks: Change Text and Circle Color

**Input**: Design documents from `/specs/004-html-1-2/`  
**Prerequisites**: plan.md (required), research.md, data-model.md, quickstart.md

## Execution Flow (main)
```
1) Read plan/research/data-model/quickstart for scope and rules
2) Generate tests first (E2E + unit), ensure they FAIL
3) Implement UI + logic to pass tests
4) Polish: docs and small a11y improvements
```

## Format: `[ID] [P?] Description`
- [P]: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup
- [ ] T001 Verify baseline E2E harness works: `npm run test:e2e:local` (expect failures for new color scenarios); ensure `CHROME_PATH` if needed.

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
- [ ] T002 [P] Add E2E test for preset Black → both text and circle use black in `tests/e2e/color-select.presets-black.spec.js`
- [ ] T003 [P] Add E2E test for preset Red → both text and circle use red in `tests/e2e/color-select.presets-red.spec.js`
- [ ] T004 [P] Add E2E test for native color picker selection (e.g., blue) in `tests/e2e/color-select.picker.spec.js`
- [ ] T005 [P] Add E2E test for CSS named color valid (e.g., `green`) in `tests/e2e/color-select.named-valid.spec.js`
- [ ] T006 [P] Add E2E test for invalid color name fallback to black in `tests/e2e/color-select.named-invalid.spec.js`
- [ ] T007 [P] Add unit tests for color normalization utility (hex/#RGB→#RRGGBB, named→hex, invalid→#000000) in `tests/unit/color-normalize.spec.js`

Notes for tests:
- For E2E, set draw option to "描く" (`#drawCircleOn`) when verifying circle color; upload local `in.pdf` and `NotoSansJP-Regular.ttf` via existing file inputs to avoid network.
- Assert via exposed browser hooks (to be implemented) like `window.__lastSelectedColorHex` and `window.__lastPdfColorRGB`.

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T008 Update `specs/001-a4-pdf-pdf/poc/index.html`: add color controls
  - Presets: Black (`#000000`), Red (`#FF0000`)
  - Native color picker: `<input id="colorPicker" type="color">`
  - Named color input: `<input id="colorName" placeholder="CSS色名">`
  - Small swatch preview and labels (a11y)
- [ ] T009 Implement color normalization helper in `specs/001-a4-pdf-pdf/poc/script.js`
  - Accept hex `#RGB/#RRGGBB`, CSS named colors; return `#RRGGBB`
  - Fallback to `#000000` on invalid
  - Export hooks for tests: set `window.__lastSelectedColorHex`
- [ ] T010 Wire UI controls to one source of truth color in `script.js`
  - Method priority: presets → picker → named (latest user action wins)
  - Update preview swatch and persist selection in memory (no storage)
- [ ] T011 Apply normalized color to PDF drawing in `script.js`
  - Use same color for: text drawing (page.drawText) and circle (stroke)
  - Convert `#RRGGBB` to `rgb(r,g,b)` (0..1 each)
  - Expose `window.__lastPdfColorRGB = { r,g,b }` for tests
- [ ] T012 Handle invalid named color gracefully (no errors); ensure default black applied
- [ ] T013 Ensure default selection is Black when nothing chosen explicitly

## Phase 3.4: Polish
- [ ] T014 [P] Update `specs/004-html-1-2/quickstart.md` if UI element IDs/names differ
- [ ] T015 [P] Add minimal ARIA labels/title for controls in `index.html`
- [ ] T016 Run `npm run test:e2e:local` and `npm run test:unit` → fix any flakes; keep CDN reliance unchanged

## Dependencies
- T001 before all tests (environment sanity)
- Tests (T002-T007) must exist and fail before implementation (T008-T013)
- T008 precedes T009-T011 (same file)
- T009 precedes T011 (color util used in rendering)
- Polish (T014-T016) after implementation

## Parallel Example
```
# After scaffolding, run E2E tests in parallel files:
Task: "Add E2E test for preset Black in tests/e2e/color-select.presets-black.spec.js"
Task: "Add E2E test for preset Red in tests/e2e/color-select.presets-red.spec.js"
Task: "Add E2E test for picker in tests/e2e/color-select.picker.spec.js"
Task: "Add E2E test for named color valid in tests/e2e/color-select.named-valid.spec.js"
Task: "Add E2E test for invalid color in tests/e2e/color-select.named-invalid.spec.js"
```

## Validation Checklist
- [ ] All tests are authored before implementation
- [ ] Unit tests cover color normalization edge cases (#RGB, invalid names)
- [ ] E2E verifies same color applied to both text and circle
- [ ] Invalid input falls back to black without errors
- [ ] Parallel tests operate on distinct files
- [ ] Tasks reference exact file paths

