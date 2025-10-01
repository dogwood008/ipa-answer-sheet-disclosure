<!--
Sync Impact Report

- Version change: none -> 1.0.0
- Modified principles: initial population of constitution
- Added sections: Development Constraints, Development Workflow & Quality Gates
- Removed sections: none
- Templates reviewed: .specify/templates/plan-template.md (reviewed ✅), .specify/templates/spec-template.md (reviewed ✅), .specify/templates/tasks-template.md (reviewed ✅)
- Follow-up TODOs: none
-->

# ipa-answer-sheet-disclosure Constitution

## Core Principles

### I. Library-first and small-surface design
Every feature SHOULD be authored so it can be consumed as a small, well-scoped library (source in `src/` by default).
Libraries must be self-contained, independently testable, and documented. Avoid creating organizational-only libraries
or indirection layers unless there is a clear, documented need.

Rationale: keeping code modular reduces coupling and makes TDD, reviews, and reuse straightforward for PoC and
future work.

### II. Explicit Interfaces and Reproducible CLI/Scriptability
Public capabilities MUST expose programmatic entry points (functions/APIs) and a small CLI or npm script where
appropriate for automation. Text I/O or JSON input/outputs are preferred for non-UI automation.

Rationale: deterministic interfaces make automated tests, CI runs, and reproducible experiments simple and reliable.

### III. Test-First (NON-NEGOTIABLE)
All new behavior MUST be introduced following TDD: write the tests (contract/integration/unit) first and verify they
fail, then implement until they pass, then refactor. Tests must exercise real behavior (integration tests for critical
flows) and be added to `tests/` with clear file paths.

Rationale: For features dealing with PII and document generation, tests ensure correctness and prevent regressions.

### IV. Integration and Contract Testing
Every externally visible contract (UI flow, OpenAPI endpoint, file format) MUST have a corresponding contract test.
Integration tests MUST validate end-to-end flows that combine modules (example: browser-driven PDF generation).

Rationale: PoC fidelity and future compatibility depend on verifying end-to-end scenarios, not only unit logic.

### V. Observability, Versioning, and Simplicity
Structured logging (when present) SHOULD avoid logging PII. Use semantic versioning for public interfaces: MAJOR.MINOR.PATCH.
Prefer simple solutions (YAGNI). Performance optimizations and complex infra are only introduced when measurable need exists.

Rationale: Balance operational needs (traceability, compatibility) with the project's PoC scope and threat model.

## Development Constraints

- Primary language: TypeScript for library and PoC UI (repo default). Keep build/tooling minimal for PoC.
- PDF manipulation library preference: `pdf-lib` for in-browser PoC flows; prefer embedding true ttf/otf fonts when
  available; otherwise use canvas-render-to-PNG fallback.
- No server-side persistence of user PII by default: generated artifacts may be kept in-memory or downloaded client-side only.
- Fonts: prefer local ttf/otf packaged by the user or, for preview, use Google Fonts via FontFace API with clear
  documentation about CDN vs local embedding.

## Development Workflow & Quality Gates

- Tests-first workflow enforced: contract tests and E2E smoke tests are gating checks for major changes.
- Pull requests MUST include: one-line summary, which gates changed, and a brief test plan for manual verification.
- CI SHOULD run unit tests and a minimal headless E2E smoke test for PR validation. Heavy E2E can be gated by tags.
- Document changes to FieldMapConfig, data model, or contracts in `specs/[feature]/` and update `quickstart.md` when
  run instructions change.

## Governance

Amendments to this constitution are made via Pull Request. A proposed amendment MUST:

1. Include a clear rationale and migration notes in the PR description.
2. Show at least one test or checklist item that enforces the changed principle where applicable.
3. Be approved by at least one reviewer familiar with project testing and deployment practices.

Major changes to principles (removals or incompatible redefinitions) SHOULD increment the MAJOR version. Adding a new
principle or materially expanding guidance SHOULD increment the MINOR version. Clarifications or non-semantic fixes
SHOULD increment the PATCH level.

All PRs that could affect privacy, PII handling, or public contract behavior MUST reference this constitution and list
how they comply.

**Version**: 1.0.0 | **Ratified**: 2025-09-19 | **Last Amended**: 2025-09-19