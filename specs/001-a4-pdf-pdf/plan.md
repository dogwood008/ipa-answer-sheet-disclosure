## Implementation Plan: A4 PDF生成 — IPA答案用紙の個人情報開示申請用PDF

**Branch**: `001-a4-pdf-pdf` | **Date**: 2025-09-19 | **Spec**: /home/kit/projects/github/ipa-answer-sheet-disclosure/specs/001-a4-pdf-pdf/spec.md
**Input**: Feature specification (上記パス)

## Summary
TypeScriptを主要技術として、完全にブラウザ内で完結するクライアント単体アプリケーションを実装します。テンプレートPDFは実行時にブラウザから次のURLでダウンロードします: https://www.ipa.go.jp/privacy/hjuojm000000f2fl-att/02.pdf。入力データを矩形（x,y,width,height）で定義された領域に対して文字・チェック・丸描画を行い、生成したA4 PDFをブラウザでプレビュー・ダウンロードさせます。データはどこにも保存しません（明示的にメモリ内のみ）。

## Technical Context
- Language: TypeScript (ES2022), target: modern browsers
- Framework: UI は React + Vite（軽量）を想定。ただし Vanilla+TS でも可（実装選択）
- PDF manipulation: `pdf-lib`（既存 PDF を読み込み、座標指定で描画できる）を推奨
- Preview: ブラウザの Blob URL を iframe/object で表示、または PDF.js を利用して表示
- Storage: NONE（ユーザの要望に従い、保存しない。テンポラリはメモリのみ）
- Field mapping: 開発者が用意する `FieldMapConfig`（JSON）で矩形 x,y,width,height,fontSize,fontName,type(text|checkbox|circle) を定義
- Fonts: 日本語対応フォントとしてNoto Sans（Noto Sans JP）を使用します。実行時にフォントファイルを同梱するか、またはCDN等からフェッチしてpdf-libに埋め込む方針をとります（ライセンス確認を行ってください）。埋め込み不可ならアウトライン化/ビットマップ化の検討。
- Security: CSP, Trusted Types を有効にする。ユーザ PII をどこにも出さない（外部送信・永続化禁止）

## Constitution Check
- Simplicity: 単一フロントエンドプロジェクト（src/）で実装。サーバは不要。
- Testing: ユニット＋E2E（Jest + Playwright）を計画。レンダリング座標と出力 PDF の一致を自動化検証する。
- Observability: ローカルのみのログ。PII はログ出力しない。

## Phase 0: Research (outputs: research.md) — COMPLETE
- 決定事項:
  - テンプレート配布方法: デフォルトでアプリに同梱（`assets/templates/ipa-template.pdf`）。オプションとしてユーザがローカルからテンプレートをアップロードできる（アップロードはメモリ内でのみ扱う）。
  - ブラウザ保存方針: ユーザの指示通り『保存しない』を標準とする。ローカル一時保存機能は実装しない（将来的にオンデマンドでメモリのみのプレビュー用キャッシュを許容する設計はあり得るが、今回は除外）。
  - フォント方針: Noto Sans JP（ライセンス要確認）を同梱し、pdf-lib を使って埋め込み可能であることを確認する。
  - PDF ライブラリ: `pdf-lib` を採用（既存 PDF に重畳可能、TypeScript で利用実績あり）。代替: PDFKit（だが既存 PDF のテンプレート上に上書きする用途では pdf-lib が適切）。

## Phase 1: Design & Contracts (outputs: data-model.md, contracts/, quickstart.md) — COMPLETE

Technical decisions (concrete):
- Project structure (recommended)
  - src/
    - components/
    - lib/ (pdf utils)
    - types/
    - assets/templates/ipa-template.pdf
  - public/
  - package.json, tsconfig.json, vite.config.ts

- Primary Dependencies
  - react, react-dom, vite, typescript
  - pdf-lib (PDF操作)
  - pdfjs-dist or using object/embed for preview
  - jest, @testing-library/react, playwright

- Data shapes (see `data-model.md`)

Contracts (UI-level)
- Input shape: JSON object representing `UserInput` (see `contracts/input-contract.md`).
- FieldMapConfig: JSON schema mapping input keys to rectangles on the template (see `contracts/fieldmap-schema.json`)

## Phase 2: Task Planning (outputs: tasks.md) — COMPLETE (初版)
- Task generation strategy: TDD で進める。座標/描画の自動テストを最優先で用意し、目視確認をその後に行う。
- 主要タスクは `tasks.md` に一覧化（下記）。

## Progress Tracking
- [x] Phase 0: Research complete
- [x] Phase 1: Design complete
- [x] Phase 2: Task planning complete

## Artifacts generated (absolute paths)
- /home/kit/projects/github/ipa-answer-sheet-disclosure/specs/001-a4-pdf-pdf/plan.md
- /home/kit/projects/github/ipa-answer-sheet-disclosure/specs/001-a4-pdf-pdf/research.md
- /home/kit/projects/github/ipa-answer-sheet-disclosure/specs/001-a4-pdf-pdf/data-model.md
- /home/kit/projects/github/ipa-answer-sheet-disclosure/specs/001-a4-pdf-pdf/quickstart.md
- /home/kit/projects/github/ipa-answer-sheet-disclosure/specs/001-a4-pdf-pdf/contracts/input-contract.md
- /home/kit/projects/github/ipa-answer-sheet-disclosure/specs/001-a4-pdf-pdf/tasks.md

## Next steps
- レビューで `FR-005`（フォント）とテンプレートの配布方法を確定してください。
- 承認後、/tasks をもとに実装を開始します（PoC: pdf-lib を使った矩形描画の最短実装）。
# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context
**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: [#] (max 3 - e.g., api, cli, tests)
- Using framework directly? (no wrapper classes)
- Single data model? (no DTOs unless serialization differs)
- Avoiding patterns? (no Repository/UoW without proven need)

**Architecture**:
- EVERY feature as library? (no direct app code)
- Libraries listed: [name + purpose for each]
- CLI per library: [commands with --help/--version/--format]
- Library docs: llms.txt format planned?

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? (test MUST fail first)
- Git commits show tests before implementation?
- Order: Contract→Integration→E2E→Unit strictly followed?
- Real dependencies used? (actual DBs, not mocks)
- Integration tests for: new libraries, contract changes, shared schemas?
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included?
- Frontend logs → backend? (unified stream)
- Error context sufficient?

**Versioning**:
- Version number assigned? (MAJOR.MINOR.BUILD)
- BUILD increments on every change?
- Breaking changes handled? (parallel tests, migration plan)

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
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

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: [DEFAULT to Option 1 unless Technical Context indicates web/mobile app]

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [ ] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*