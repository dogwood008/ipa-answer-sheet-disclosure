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

Based on `.specify/memory/constitution.md` v1.0.0, this plan adheres to the following principles and constraints:

- Library-first and small-surface design: PDF生成はReactに依存しない純TSライブラリとして`src/lib/pdf/`に実装し、`generateAnswerSheetPdf(config, data)`等の小さなAPIを公開。React側はそのライブラリを薄く呼び出すのみ。
- Explicit Interfaces & Scriptability: 上記APIに加え、最小のnpmスクリプト（例: `npm run gen:pdf -- --input data.json --out out.pdf`）で再現可能なCLI導線を用意（Node実行が難しければ、代替として`scripts/`に小さなドライバを置く）。
- Test-First (NON-NEGOTIABLE): ライブラリのユニットテストを先に追加→失敗を確認→実装→成功の順で進行。UIフローはE2Eでカバー。
- Integration and Contract Testing: 「UIで入力→PDF生成→所定領域に期待テキスト/描画が存在」のE2E契約テストを追加。重要フローはエンドツーエンドで検証。
- Observability, Versioning, Simplicity: PIIログは出力しない。APIはセマンティックバージョニングを前提に`0.x`→`1.0`で安定化を目指す。過度なインフラ/最適化は入れない。
- Development Constraints: 言語はTypeScript。PDF処理は`pdf-lib`中心。フォントは可能な限りローカルttf/otf（同梱済み`NotoSansJP-Regular.ttf`を優先）、プレビュー用途でのみWebフォントを許容し、その前提をドキュメント化。

Gate decision: PASS（上記の計画変更により準拠）。

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
src/
├── lib/
│   └── pdf/
│       ├── index.ts            # generateAnswerSheetPdf(config, data) 他（純TS、UI非依存）
│       └── fonts/              # 可能ならローカル埋め込みフォント
└── index.ts                    # ライブラリエントリ

apps/002-poc/                   # 最小のReactアプリ（Vite想定、ビルドは必要最小限）
├── src/
│   ├── components/
│   ├── pages/
│   └── app.tsx
├── index.html
└── vite.config.ts

tests/
├── unit/                       # ライブラリ用ユニットテスト（先に作る）
└── e2e/                        # 既存E2Eに追従/最小追加

scripts/
└── generate-pdf.ts             # 簡易CLIドライバ（npm scriptから呼出）
```

**Structure Decision**: Library-first。PDF生成は`src/lib/pdf`に実装し、Reactアプリは`apps/002-poc`で最小限。既存の`tests/`配下を活用し、E2Eは現行の手法に合わせる。

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - フォント戦略（ローカル埋め込みを優先、Webフォントはプレビュー用途で明示的許可）。
   - `pdf-lib`のTS/React連携の最小実装（副作用/非同期の扱い、Blob/URL生成）。
   - Reactの状態管理（Contextで十分か、Zustand/Jotaiの必要性評価）。
   - 既存E2Eとの整合（ローカル静的配信とChromium起動、オフライン時のCDN依存排除）。

2. **Generate and dispatch research agents**:
   ```
   Task: "pdf-libでのTrueType埋め込みとフォールバック（PNGレンダ）の可否と手順"
   Task: "React+TSでのPDF生成副作用の最小化（hooks設計）"
   Task: "小規模状態管理（Context vs Zustand/Jotai）の比較と採用基準"
   Task: "オフラインでのプレビュー挙動（CDN排除/代替）の検証"
   ```

3. **Consolidate findings** in `research.md`.

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`（テスト先行）:
   - UserInput: { name: string, examNumber: string, ... }（ユニットテスト作成→失敗確認→実装）
   - FieldMap: { [key: string]: { x: number, y: number, ... } }（同上）

2. **Generate contracts**:
   - UI/フロー契約: 「フォーム入力→生成→ダウンロード/プレビュー」
   - PDF契約（最小）: 指定フィールドへのテキスト配置、フォント埋め込みの有無、用紙サイズ/座標系

3. **Generate contract tests**:
   - E2E: 主要フロー（入力→PDF生成）を契約テストとして定義（PDFのテキスト/座標の一部検査）
   - ユニット: `generateAnswerSheetPdf`の入出力契約（入力検証、エラー、成功時のメタデータ）

4. **Extract test scenarios** from user stories:
   - E2Eのシナリオを`quickstart.md`に明記（前提: ローカルフォント/オフライン動作方針）

5. **Update agent file incrementally**:
   - N/A for this workflow.

**Output**: data-model.md, /contracts/*, failing tests（先行）, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- ライブラリ（`src/lib/pdf`）のTDD（ユニットテスト→実装→リファクタ）
- Reactアプリ（`apps/002-poc`）の最小構成（フォーム/プレビュー）
- フォント埋め込みの実装とドキュメント化（ローカル優先）
- CLI/スクリプト化（`scripts/generate-pdf.ts` + npm script）
- E2E契約テスト（主要フロー、PDF検証の最小化）

**Ordering Strategy**:
- 1. ユニットテスト雛形 → 2. ライブラリ実装 → 3. React UI最小 → 4. フォント/生成配線 → 5. CLI導線 → 6. E2E契約テスト

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
- [X] Initial Constitution Check: PASS（本計画で準拠）
- [ ] Post-Design Constitution Check: PENDING（Phase 1完了後に再評価）
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v1.0.0 - See `/.specify/memory/constitution.md`*
