# Implementation Plan: Rewrite PoC with TypeScript and React

**Branch**: `002-poc` | **Date**: 2025-09-28 | **Spec**: [link](./spec.md)
**Input**: Feature specification from `/specs/002-poc/spec.md`

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
This feature involves rewriting the existing Proof of Concept (PoC) for the IPA answer sheet PDF generation. The new implementation will use a more robust and maintainable tech stack: TypeScript, React, and Vite. The goal is to achieve the same functionality as the original PoC but with a production-ready architecture.

## Technical Context
**Language/Version**: TypeScript
**Primary Dependencies**: React, Vite, pdf-lib
**Storage**: N/A
**Testing**: Jest, Puppeteer, React Testing Library
**Target Platform**: Modern web browsers
**Project Type**: Web Application
**Performance Goals**: N/A
**Constraints**: Must replicate all functionality of the original PoC.
**Scale/Scope**: Small, focused rewrite of the existing PoC.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution at `.specify/memory/constitution.md` is currently a template with no specific principles defined. Therefore, there are no constitutional gates to check against at this time.

## Project Structure

### Documentation (this feature)
```
specs/002-poc/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (when "frontend" + "backend" detected)
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/
```

**Structure Decision**: Option 2: Web application. A new `frontend` directory will be created to house the React/TypeScript application.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - Font handling in the new stack (Web fonts vs. embedding).
   - Best practices for integrating `pdf-lib` with React and TypeScript.
   - State management strategy for the React application.

2. **Generate and dispatch research agents**:
   ```
   Task: "Research font handling strategies for pdf-lib in a web environment"
   Task: "Find best practices for using pdf-lib with React hooks and TypeScript"
   Task: "Evaluate state management libraries for a small React application (e.g., Zustand, Jotai, or React Context)"
   ```

3. **Consolidate findings** in `research.md`.

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - UserInput: { name: string, examNumber: string, ... }
   - FieldMap: { [key: string]: { x: number, y: number, ... } }

2. **Generate API contracts**:
   - N/A for this client-side application.

3. **Generate contract tests**:
   - N/A

4. **Extract test scenarios** from user stories:
   - E2E test scenarios in `quickstart.md`.

5. **Update agent file incrementally**:
   - N/A for this workflow.

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Set up the Vite project with TypeScript and React.
- Create React components for the form and PDF preview.
- Implement the PDF generation logic in a service module.
- Write unit tests for components and services.
- Write E2E tests to cover the user flow.

**Ordering Strategy**:
- 1. Project setup. 2. PDF generation service. 3. UI components. 4. Integration and state management. 5. Tests.

**Estimated Output**: 15-20 tasks in tasks.md

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