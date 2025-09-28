# Tasks: PoC - Add radio button input and draw a circle

**Input**: Design documents from `/specs/003-poc/`
**Prerequisites**: plan.md, research.md, data-model.md, quickstart.md

## Phase 3.1: Setup
- [ ] T001 [P] Add a new `div` element to `specs/001-a4-pdf-pdf/poc/index.html` to contain the radio button inputs.

## Phase 3.2: Core Implementation
- [ ] T002 Modify `specs/001-a4-pdf-pdf/poc/index.html` to include a radio button group with at least two options: one to draw a circle and one not to.
- [ ] T003 Modify `specs/001-a4-pdf-pdf/poc/script.js` to add an event listener that detects changes to the new radio button group.
- [ ] T004 In `specs/001-a4-pdf-pdf/poc/script.js`, implement the logic to draw a black circle on the PDF using `pdf-lib`'s `drawEllipse` method when the "draw" option is selected. The circle's position and size should be based on predefined constants.
- [ ] T005 Ensure that if the "no-draw" option is selected, no circle is drawn on the PDF.

## Phase 3.3: Tests
- [ ] T006 [P] Create a new E2E test file `tests/e2e/draw-circle.spec.js`.
- [ ] T007 In `tests/e2e/draw-circle.spec.js`, write a test that uses Puppeteer to select the "draw" radio button and verifies that the PDF generation is triggered.
- [ ] T008 In `tests/e2e/draw-circle.spec.js`, add a step to the test to check a flag in the browser's `window` object to confirm that the circle-drawing code path was executed.

## Dependencies
- T001 must be completed before T002.
- T002 must be completed before T003.
- T003 must be completed before T004 and T005.
- T006 must be completed before T007 and T008.
- Core implementation (T002-T005) should be completed before tests (T007-T008) are run to verify the implementation.

## Parallel Example
Tasks T001 and T006 can be run in parallel as they involve creating new, independent files.

```
# Launch T001 and T006 together:
Task: "Add a new div element to specs/001-a4-pdf-pdf/poc/index.html to contain the radio button inputs."
Task: "Create a new E2E test file tests/e2e/draw-circle.spec.js."
```
