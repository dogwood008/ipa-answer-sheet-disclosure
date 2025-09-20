# Feature Specification: A4 PDF生成 — IPA答案用紙の個人情報開示申請用PDF

**Feature Branch**: `001-a4-pdf-pdf`  
**Created**: 2025-09-17  
**Status**: Draft  
**Input**: User description: "ユーザが入力した情報をもとに、A4のPDFを出力するアプリケーションを作ります。そのPDFは、情報処理推進機構が実施する「情報処理技術者試験」の答案用紙を、個人情報として開示するという内容です。入力した内容でアプリケーションはPDFを作成し、プレビューを可能とし、ユーザにPDFをダウンロードさせます。ユーザはそのPDFを郵送することで、個人情報の開示請求が可能となります。PDFはあらかじめ情報処理推進機構が用意したテンプレートがあり、それを使用する必要があります。このアプリケーションは、ユーザが与えた情報を使って、そのPDFに対し文字や記号を上書きします。文字等をPDFへ入力する領域は、あらかじめ開発者によって設定ファイルを通してアプリケーションに与えられます。入力内容は、サーバを通さずユーザのブラウザの中だけで一時的に保持されます。これは個人情報をサーバへ送ることに懸念を覚えるユーザが多くいるためです。"

## Execution Flow (main)
```
1. 入力: ブラウザ上でユーザがフォームに情報を入力する
   -> If empty required fields: RETURN validation error to UI
2. 設定ファイル（フィールドマップ）を読み込む
   -> マッピング: 入力フィールド名 -> PDFテンプレート上の座標/領域
3. PDFテンプレート（IPA提供）を読み込む（事前にアプリにバンドルまたは選択可能）
   -> If template missing: ERROR "Template not available"
4. 入力データを用いてテンプレートに文字・記号を上書き（レンダリング）
   -> フォント、サイズ、位置、改行・Overflowの扱いを適用
5. 生成したPDFをブラウザ内でプレビュー表示する（ダウンロードの選択を提示）
6. ユーザがダウンロードを選択したら、ブラウザでファイルを生成してダウンロードさせる
7. 全てのデータはサーバへ送信しない（ローカルのみ）
8. ローカル保存の方式：セッションストレージ／ローカルストレージ／IndexedDBのいずれか（実装で選択）
9. ローカルに保存する場合、ユーザに明示し、削除操作を提供する
10. エラー/例外処理：フォント未対応、座標外への描画、ブラウザ非対応機能はユーザに通知
```

---

## ⚡ Quick Guidelines
- ✅ ユーザ価値: 目的は『個人情報の開示請求に使える、印刷可能なA4 PDFをブラウザだけで生成すること』
- ❌ 実装の詳細（サーバサイドの言語等）はこの仕様では記載しない
- ドキュメントは日本語で利用者とレビュアー向けに記載

### Section Requirements
- **Mandatory sections**: 本ドキュメントに従う
- **Optional sections**: 当該機能に不要であれば削除

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
ユーザは自分の個人情報（氏名、住所、受験番号等）を入力し、IPAが提供する答案用紙テンプレートへ上書きしてA4のPDFを生成、ブラウザでプレビューし、ダウンロードして郵送できる。

### Acceptance Scenarios
1. Given: ユーザが必要な入力欄に値を入力済み、When: プレビューを押す、Then: ブラウザ上にPDFプレビューが表示され、表示内容が入力と一致する。
2. Given: プレビューで表示されたPDF、When: ダウンロードを押す、Then: ローカルにA4サイズのPDFファイル（印刷適合）が保存される。
3. Given: 入力フィールドが空、When: プレビューを押す、Then: 必須フィールドのバリデーションエラーが表示され、PDFは生成されない。
4. Given: テンプレート画像やフォントが欠落、When: 生成を試みる、Then: ユーザにエラーを通知し、代替案（シンプルフォントでの生成やサポート問い合わせ）を提示する。

### Edge Cases
- 入力文字が長すぎて指定領域に収まらない場合の折り返し・縮小ルール
- 使用ブラウザのフォント差異で見た目が崩れるケース
- テンプレートの座標定義が不正（オフセットや誤差）で印刷時にずれるケース
- ローカルストレージ容量不足やプライベートブラウジングでの保存不可

---

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**：システムはユーザがフォームへ入力した個人情報を受け取り、IPAのテンプレートPDFに上書きしてA4のPDFを生成できること。
- **FR-002**：システムは生成したPDFをブラウザ内でプレビュー表示し、ユーザが確認できること。
- **FR-003**：システムはユーザの操作でPDFをローカルへダウンロードさせること（サーバへは送信しない）。
- **FR-004**：システムは事前定義された設定ファイル（フィールドマップ）を使って、入力フィールドとPDF上の描画座標を正確に対応付けること。
- **FR-005**：システムはフォントが未対応の場合のフォールバック処理を提供し、印刷時に意味が変わらないようにすること。［NEEDS CLARIFICATION：使用可能なフォントの一覧と埋め込みポリシー］
- **FR-006**：システムは入力のバリデーション（必須項目、フォーマット）を行い、エラーをユーザに分かりやすく表示すること。
- **FR-007**：システムは生成処理中に発生したエラーをログ（ローカル）に記録し、ユーザに操作可能なエラー説明を提示すること。
- **FR-008**：システムはユーザデータをブラウザ外部のサーバへ送信しない（明確にオフラインで処理すること）。

*Example of marking unclear requirements:*
**FR-009**：データをブラウザに一時保存する方法（sessionStorage／localStorage／IndexedDB）については実装方針を明確化する必要がある。［NEEDS CLARIFICATION：優先方式］
**FR-010**：テンプレートの受け渡し方法（アプリにバンドルするか、ユーザがアップロードするか）を決める必要がある。［NEEDS CLARIFICATION：テンプレート配布方法］

### Key Entities *(include if feature involves data)*
- **UserInput**：ユーザがフォームに入力するデータ（氏名、住所、受験番号、日付、選択式のマーク等）
  - 属性：name、address、exam_number、date_of_birth、answer_marks、remarks
- **PDFTemplate**：IPA提供のA4答案用紙テンプレート（静的PDFファイル）
  - 属性：file、version、field_definitions
- **FieldMapConfig**：開発者が用意する設定ファイル（JSON/YAML）で、入力キー→PDF上の座標／フォント／サイズを定義
- **LocalStorage**：ブラウザ側に一時的に保持するストレージ（実装選択に依存）

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [ ] No ［NEEDS CLARIFICATION］ markers remain
- [x] Requirements are testable and unambiguous where possible
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---


