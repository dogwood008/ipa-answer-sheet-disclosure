# Quickstart: 002-poc verification (Library-first + UI)

このドキュメントは、002-poc の検証手順（ライブラリ→CLI→UI→E2E）を示します。現段階ではライブラリ/CLIを優先し、UIは最小構成を順次追加します。

## 1) Unit（ライブラリ）
- 実行: `npm run test:unit`
- 目的: `generateAnswerSheetPdf(config, data)` の入出力契約（必須項目、PDFヘッダ）を担保。

## 2) CLI（再現性のある生成導線）
- コマンド: `npm run gen:pdf -- --input data.json --out out.pdf`
- `data.json` 例:
  ```json
  { "name": "Taro", "examNumber": "AB1234" }
  ```
- 期待: リポジトリ直下に `out.pdf` が生成される。

補足: pdf-lib の自動利用
- ライブラリは Node 実行時に `pdf-lib` / `@pdf-lib/fontkit` が導入されていれば自動検出して利用します。
- 未導入の場合でも最小の有効なPDFを生成します（フォント埋め込み・テンプレート描画なし）。
- 既定テンプレートは `specs/001-a4-pdf-pdf/poc/in.pdf` を探索します。明示する場合は `scripts/generate-pdf.js` を参考に `templatePath` を設定してください。

## 3) UI（最小React; 後続追加）
- 目的: フォーム入力→生成→プレビュー/ダウンロードまでのフロー。
- 現状: `apps/002-poc` にスケルトンを追加済み。CDNに依存せずローカル静的配信で動作させる方針。
- ビルド: `npm run build:002` → 出力 `apps/002-poc/dist/`
- 配信: `cd apps/002-poc/dist && python3 -m http.server 8000`（別ターミナル）
- アクセス: http://localhost:8000/

ローカル自動E2E（推奨）
- コマンド例: `PORT=8001 E2E_DIR=apps/002-poc/dist npm run test:e2e:local`
- 備考: 既に:8000が使用中の場合はポートを変更してください。

## 4) E2E（契約テスト）
- 既存 `tests/e2e` を活用。ローカル静的サーバで配信し、Puppeteerから主要フローを検証。
- 注意: オフライン環境で失敗しないようフォントはローカルTTF（`NotoSansJP-Regular.ttf`）を優先使用。

## フォント方針（FR-009 準拠）
- 原則: ローカル ttf/otf を埋め込み（例: リポジトリ直下または `assets/`）。
- 例外: プレビュー専用でWebフォントを使う場合は明記し、ローカル代替を必ず提供。
