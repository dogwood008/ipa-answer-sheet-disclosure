# Implementation Plan: Change Text and Circle Color

**Branch**: `004-html-1-2` | **Date**: 2025-09-30 | **Spec**: specs/004-html-1-2/spec.md  
**Input**: Feature specification from `/specs/004-html-1-2/spec.md`

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
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file
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
Add color selection to the PoC so the same color applies to both the user-entered text and the optional circle in the generated PDF. Provide three selection paths: two presets (Black, Red), a color picker, and direct input of a CSS named color.

カラーピッカーは、可能であればブラウザ標準のものを使うようにしてください。なければ、メジャーなOSSで、権利上問題のないものを使用してください。

## Technical Context
**Language/Version**: Browser JS (ES2019+), simple HTML (no build tool)  
**Primary Dependencies**: pdf-lib (UMD), fontkit (UMD), PDF.js (global build); native `<input type="color">` for color picking  
**Storage**: N/A  
**Testing**: Jest (unit), puppeteer-core (E2E) with local static server  
**Target Platform**: Chromium/Chrome on Linux (CI), modern desktop browsers locally  
**Project Type**: single (static page + script in specs/001-a4-pdf-pdf/poc)  
**Performance Goals**: N/A for this UI toggle; keep synchronous UI responsive  
**Constraints**: Keep CDN dependencies stable and minimal. Offline CI may fail for CDN fetches; E2E supports local template upload path.  
カラーピッカーは、可能であればブラウザ標準のものを使うようにしてください。なければ、メジャーなOSSで、権利上問題の無いものを使用してください。 
**Scale/Scope**: Small UI enhancement with limited state (selected color, method)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No explicit constitutional MUSTs are defined in `.specify/memory/constitution.md` yet. The plan adheres to simplicity and test-first intent by limiting scope, adding unit/E2E coverage, and avoiding unnecessary dependencies. Status: PASS.

## Project Structure

### Documentation (this feature)
```
specs/004-html-1-2/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
specs/001-a4-pdf-pdf/poc/
├── index.html        # add color UI (presets, native picker, text input)
└── script.js         # parse/validate color, apply to text & circle

tests/
├── e2e/              # puppeteer tests for color selection
└── unit/             # small color-parse utils, if extracted
```

**Structure Decision**: Single static page PoC. Changes are limited to `specs/001-a4-pdf-pdf/poc/index.html` and `script.js`, plus tests.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - Color name validation for "HTML Safe Colors" (assume CSS named colors)
   - Color string normalization to pdf-lib rgb(0..1)
   - Fallback policy if color picker unsupported
   - Accessibility: basic label/ARIA for inputs

2. **Generate and dispatch research agents**:
   ```
   Research CSS named color validation approach (computed style vs. canvas).
   Research conversion from hex/rgb(a)/named to pdf-lib rgb(0..1).
   Evaluate OSS fallback candidates (Pickr MIT, iro.js MIT) but do not add unless necessary.
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: Prefer `<input type="color">`; OSS fallback only if necessary (e.g., iro.js MIT / Pickr MIT)
   - Rationale: Built-in UI, zero extra deps, consistent browser support
   - Alternatives considered: Third-party pickers; rejected unless native is unavailable

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity: ColorSelection { method: preset|picker|name, value: string (normalized hex), valid: boolean }
   - Validation: CSS named color accepted when browser can parse; else fallback black
   - Application: Both text drawing and circle use the same normalized color

2. **Generate API contracts**:
   - N/A (no external API; UI-only feature). Add a short `contracts/README.md` documenting this.

3. **Generate contract tests**:
   - N/A for external API. Add E2E tests for UI interactions instead.

4. **Extract test scenarios** from user stories** → `quickstart.md`:
   - Steps for selecting presets, using color picker, and entering CSS color names; verify PDF rendering reflects choice.

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh codex`
   - Keep under 150 lines, add only new tech if any (none expected beyond native color input)

**Output**: data-model.md, /contracts/*, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Generate tasks from Phase 1 design docs (data model, quickstart)
- Each user story → E2E test task
- Implementation tasks to wire UI to pdf-lib drawing color

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Color parsing util before UI wiring before PDF rendering hooks

**Estimated Output**: 10-15 tasks in tasks.md

## Phase 3+: Future Implementation
*Beyond /plan scope*

**Phase 3**: Task execution (/tasks creates tasks.md)  
**Phase 4**: Implementation (execute tasks)  
**Phase 5**: Validation (run tests)

## Complexity Tracking
| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
