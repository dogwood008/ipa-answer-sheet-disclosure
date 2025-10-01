# Tasks: Draw Rectangle (x, y, width, height)

**Input**: Design documents from `/specs/005-x-y-width/`  
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
- [ ] T001 Verify baseline E2E harness works: `npm run test:e2e:local`（必要に応じ `CHROME_PATH`/`PORT` を設定）。

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
- [X] T002 [P] Add unit tests for number parsing/validation (x,y,width,height) in `tests/unit/rect-parse.spec.js`
- [X] T003 [P] Add E2E test: valid rectangle renders with current color in `tests/e2e/rect-draw.valid.spec.js`
- [X] T004 [P] Add E2E test: invalid inputs fallback (e.g., negative/NaN → ignore or clamp) in `tests/e2e/rect-draw.invalid.spec.js`

Notes for tests:
- Use existing page at `specs/001-a4-pdf-pdf/poc/index.html`; add inputs `#rectX`, `#rectY`, `#rectW`, `#rectH`, and a toggle `#drawRect` similar to circle.
- E2E asserts via page hooks to be added, e.g., `window.__rectDrawn === true` and `window.__lastRect = { x,y,w,h }`.

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [X] T005 Update `specs/001-a4-pdf-pdf/poc/index.html`: add rectangle controls
  - Inputs: `<input id="rectX" type="number">`, `<input id="rectY" type="number">`, `<input id="rectW" type="number">`, `<input id="rectH" type="number">`
  - Toggle: `<input type="checkbox" id="drawRect">` with label
- [X] T006 Implement parsing/validation helpers in `specs/001-a4-pdf-pdf/poc/script.js`
  - `parseRectInputs()` → `{ x,y,w,h, valid }`（整数/浮動、非数/負数は無効扱い）
- [X] T007 Apply rectangle drawing with pdf-lib in `script.js`
  - Use `page.drawRectangle({ x, y, width: w, height: h, color: rgb(r,g,b) })`（solid fill）
  - Expose `window.__rectDrawn = true` and `window.__lastRect = { x,y,w,h }`
- [X] T008 Ensure same selected color is used (reuse existing selected color logic)

## Phase 3.4: Polish
- [ ] T009 [P] Update `specs/005-x-y-width/quickstart.md` with new controls and steps
- [ ] T010 [P] Add minimal labels/ARIA for rectangle inputs and toggle in `index.html`
- [ ] T011 Run `npm run test:e2e:local` and `npm run test:unit` → fix any flakes; keep CDN reliance unchanged

## Dependencies
- T001 before all tests (environment sanity)
- Tests (T002–T004) must exist and fail before implementation (T005–T008)
- T005 precedes T006–T008（同一ファイルのため直列）
- Polish（T009–T011）は実装後

## Parallel Example
```
# Author tests in parallel files:
Task: "Add unit rect parsing tests in tests/unit/rect-parse.spec.js"
Task: "Add E2E valid rect in tests/e2e/rect-draw.valid.spec.js"
Task: "Add E2E invalid rect in tests/e2e/rect-draw.invalid.spec.js"
```

## Validation Checklist
- [ ] All tests are authored before implementation
- [ ] Unit tests cover parsing/validation edge cases（NaN, negative, zero sizes）
- [ ] E2E verifies rectangle renders with selected color
- [ ] Invalid inputs do not crash app; behavior is defined（ignore/clamp）
- [ ] Parallel tests operate on distinct files
- [ ] Tasks reference exact file paths
