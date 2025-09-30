# AGENTS.md

このリポジトリで自動エージェント/開発者が作業するための実務ガイドです。短時間で安全に変更し、CI を通すことを目的にしています。

なお、[Spec Kit](https://github.com/github/spec-kit)を用いた Spec-Driven Development を採用しています。

## プロジェクト概要
- 目的: 情報処理技術者試験の答案開示書類 PDF をブラウザで生成する PoC。
- フロント: シングル HTML + TypeScript（CDN の pdf-lib/fontkit/PDF.js を使用）。
- テスト: Jest による Unit/E2E。E2E は `puppeteer-core` + ローカル静的サーバに接続。

## ディレクトリ
- `specs/`: SDD で開発を進めるディレクトリ
- `tests/unit`: 単体テスト
- `tests/e2e`: E2E テストと初期化スクリプト (`initial.sh`)
- `.github/workflows/e2e.yml`: CI の E2E ワークフロー

## 主要コマンド
- 依存関係: `npm ci`
- 全テスト: `npm test`
- Unit のみ: `npm run test:unit`
- E2E のみ: `npm run test:e2e`
 - E2E（ローカル自動・推奨）: `npm run test:e2e:local`

## E2E 実行方法（ローカル）
1) 静的サーバ起動（別ターミナル可）
   ```sh
   cd specs/001-a4-pdf-pdf/poc
   python3 -m http.server 8000
   ```
2) 必要素材の用意（初回/素材欠如時）
   ```sh
   tests/e2e/initial.sh
   ```
   - `specs/.../poc/in.pdf` をダウンロードします。
   - `NotoSansJP-Regular.ttf` は現状リポジトリに同梱済みです。
3) Chromium/Chrome のパスを指定（必要に応じて）
   ```sh
   export CHROME_PATH=/usr/bin/chromium-browser  # 例
   ```
4) 実行
   ```sh
   npm run test:e2e
   ```

補足: 自動実行
- `npm run test:e2e:local` を使うと、静的サーバ起動→E2E 実行→サーバ停止までを一括で行います。
- 必要に応じて `CHROME_PATH` を環境変数で指定してください（未指定時は `/usr/bin/chromium-browser` を既定とします）。

注: デモページは CDN（unpkg/cdnjs/Google Fonts）に依存します。オフライン環境では失敗します。

## CI（GitHub Actions）
- ワークフロー: `.github/workflows/e2e.yml`
- 主要ポイント:
  - Node 18 / `npm ci`
  - `tests/e2e/initial.sh` をテスト前に実行（テンプレート PDF 準備）
  - `chromium-browser` を `apt` で導入し、`CHROME_PATH` を `/usr/bin/chromium-browser` に設定

## 変更ガイドライン（エージェント向け）
- 影響範囲を最小化: 目的に直接関係しない差分は出さない。
- 仕様/テスト優先: 既存テストを壊さない。必要に応じてテストを更新/追加。
- ドキュメント更新: 使い方や前提が変わる場合は本ファイル/README を更新。
- 外部依存: CDN/ネットワーク依存を増やす場合は CI への影響を考慮し明記。
- コーディングスタイル: 既存の素朴な構成を踏襲（ビルドなし、ブラウザ互換を意識）。

## トラブルシュート
- E2E でブラウザ起動不可: `CHROME_PATH` を正しく指定。CI 例: `/usr/bin/chromium-browser`。
- CORS/ネットワーク失敗: `tests/e2e/initial.sh` を使いローカル PDF をアップロードさせる経路を使う。ネットワーク制約下では CDN 依存部が落ちる可能性あり。
- `in.pdf` が無い: `tests/e2e/initial.sh` を実行。

## 今後の改善候補（任意）
- ローカルビルドに切替（Vite など）して CDN 依存低減。
- `puppeteer`（フル版）採用で `CHROME_PATH` 指定を不要化。
- Lint/Format 導入（ESLint/Prettier）と GitHub Actions 追加。

## エージェントへの指示

ユーザとのコミュニケーションは日本語を使用してください。ただし、内部的に考える間は英語を使っても構いません。
