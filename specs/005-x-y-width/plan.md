# Implementation Plan: Draw Rectangle

**Branch**: `005-x-y-width` | **Date**: 2025-09-28 | **Spec**: [link](./spec.md)
**Input**: Feature specification from `/specs/005-x-y-width/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
This feature adds the capability to draw a solid-filled rectangle on the PDF. Users will provide the rectangle's position (x, y) and dimensions (width, height) through input fields on the HTML page. The rectangle will be drawn using the currently selected color.

## Technical Context
**Language/Version**: JavaScript (ES6+)
**Primary Dependencies**: pdf-lib
**Storage**: N/A
**Testing**: Jest, Puppeteer
**Target Platform**: Node.js for PDF generation, modern web browsers for the form.
**Project Type**: single
**Performance Goals**: N/A (PoC)
**Constraints**: Must be able to draw shapes on a PDF.
**Scale/Scope**: Small, focused PoC.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution at `.specify/memory/constitution.md` is currently a template with no specific principles defined. Therefore, there are no constitutional gates to check against at this time.

## Project Structure

### Documentation (this feature)
```
specs/005-x-y-width/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/
```

**Structure Decision**: Option 1: Single project

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - Research best practices for using `pdf-lib` to draw rectangles.
   - Research how to handle numeric inputs for dimensions in HTML/JavaScript.

2. **Generate and dispatch research agents**:
   ```
   Task: "Research how to draw a rectangle with pdf-lib"
   Task: "Find best practices for managing numeric inputs for dimensions in a simple web form"
   ```

3. **Consolidate findings** in `research.md`.

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - RectangleDimensions: { x: number, y: number, width: number, height: number }

2. **Generate API contracts**:
   - N/A for this PoC as it's a single frontend application.

3. **Generate contract tests**:
   - N/A

4. **Extract test scenarios** from user stories:
   - E2E test scenario in `quickstart.md`.

5. **Update agent file incrementally**:
   - N/A for this workflow.

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Create tasks for HTML form creation, JavaScript logic for handling numeric inputs, and PDF generation logic for drawing the rectangle.

**Ordering Strategy**:
- 1. HTML structure. 2. JavaScript event handling. 3. PDF drawing logic. 4. E2E test.

**Estimated Output**: 5-10 tasks in tasks.md

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       | N/A        | N/A                                 |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [X] Phase 0: Research complete (/plan command)
- [X] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [X] Initial Constitution Check: PASS
- [X] Post-Design Constitution Check: PASS
- [X] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/.specify/memory/constitution.md`*