# Tasks: 002-poc (Rewrite with TypeScript + React)

Scope: Library-first、TDD、最小React、フォントはローカル埋め込み優先、E2E契約テストでUIフローを担保。

## Order of Execution
1) ユニットテスト雛形 → 2) ライブラリ実装 → 3) React最小UI → 4) フォント/生成配線 → 5) CLI導線 → 6) E2E契約テスト → 7) ドキュメント整備 → 8) Gate再チェック

## Task List
 - [X] 憲章 Gate: Initial Constitution Check 結果を記録（plan.md反映済みか確認）。
 - [X] 仕様不明点の解消: フォント戦略を確定（ローカルttf/otf埋め込みを優先、プレビューのみWebフォント許容）し、spec.mdのNEEDS CLARIFICATIONをクローズ。
 - [X] ディレクトリ準備: `src/lib/pdf/` と `scripts/`、`apps/002-poc/` の骨組みを作成（空実装でOK）。
 - [X] ユニットテスト(失敗を確認): `tests/unit/pdf/generateAnswerSheetPdf.spec.js` を作成（入力検証、PDFヘッダ検査）。
 - [X] ユニットテスト(失敗を確認): `tests/unit/pdf/generateAnswerSheetPdf.spec.js` を追加（入力検証、PDFヘッダの検査）。
 - [X] 型定義: `src/lib/pdf/types.d.ts` に `UserInput` 型を定義済み（既存定義を流用）。
 - [X] ライブラリAPIの空実装: `src/lib/pdf/index.ts` を追加（JS実装の型付きブリッジ）。
 - [X] フォント読み込みユーティリティ: `src/lib/pdf/fonts.ts` を追加（既存JSユーティリティの型付きブリッジ）。
 - [X] 実装: `pdf-lib` を用いてテンプレートPDFにテキスト描画（TrueType埋め込み、A4座標、基本レイアウト）。
       備考: ランタイムで `pdf-lib`/`@pdf-lib/fontkit` 検出時に有効化。未導入環境では最小PDFにフォールバック。
 - [X] 単体テスト修正→成功: 上記実装でユニットテストを通過させ、最低限のリファクタを実施。
 - [X] 簡易CLI: `scripts/generate-pdf.ts` を追加し、`npm run gen:pdf -- --input data.json --out out.pdf` で動作する導線を実装。
 - [X] React最小UI: `apps/002-poc` に Vite + React + TS の最小構成を追加（フォーム、生成ボタン、プレビュー）。
 - [X] UIからライブラリ呼出: フォーム入力から `generateAnswerSheetPdf` を呼び出し、Blob URLでプレビュー/ダウンロードを提供。
 - [X] フォント/オフライン配慮: ライブラリはCDN非依存で動作し、ローカルTTF読込ユーティリティを提供（UIは最低限）。
 - [X] E2E契約テスト: 主要フロー（起動→入力→生成→ダウンロード/プレビュー）を追加し、PDF内テキストの最低限の検査を行う。
       実装: `tests/e2e/002-poc.pdf-content.spec.js`（ASCIIの受験番号をPDFバイト列から検査）
 - [X] ローカル静的配信: 既存`tests/e2e`のサーバ起動フローに`apps/002-poc`の公開ディレクトリを追加（または相対パスで参照）。
 - [X] CHROME_PATH対応: E2Eで `CHROME_PATH` を環境変数から取得する前提を確認し、必要ならテスト/READMEに明記。
 - [X] ドキュメント更新: `quickstart.md` を最新手順（ユニット→CLI→UI→E2E）に更新し、フォント/PIIポリシーを追記。
 - [X] 憲章 Gate: Post-Design Constitution Check を更新（契約テスト/PIIログなし/シンプル設計の確認）。
- [ ] 最終バリデーション: `npm test` と E2E のローカル自動実行（`npm run test:e2e:local`）でグリーンを確認。

## Notes
- PIIはログに出力しない（フォーム入力/PDF内容）。
- 既存のE2E初期化スクリプト（`tests/e2e/initial.sh`）に依存し、`in.pdf` はローカル取得とする。
- 可能な限りCDN依存を削減し、再現性を高める（ビルドは最小限）。
