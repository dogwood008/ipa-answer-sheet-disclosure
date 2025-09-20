# CI: fontkit と Canvas (skia-canvas / node-canvas) の設定ガイド

このドキュメントは、リポジトリ内で PDF に日本語フォントを埋め込む（`pdf-lib` + `fontkit`）や、Canvas を用いたラスタ化（テキスト→PNG）を CI 上で安定して実行するための手順をまとめたものです。

主な選択肢
- 推奨: `skia-canvas` を使う（ネイティブビルドで問題が少ない環境では導入が楽な場合がある）
- 互換性重視: `canvas` (node-canvas) を使う（広く使われるが system パッケージが必要）

ポイント
- `pdf-lib` にカスタムフォントを埋め込むには `fontkit` を登録します（`outDoc.registerFontkit(fontkit)`）。実行時に `fontkit` があれば pdf-lib の `embedFont` が ttf/otf を扱えます。
- Canvas を使ってテキストを PNG にラスタ化するテスト/フォールバックを行う場合、Node 環境にネイティブ依存があることが多いです。CI のランナーに応じて必要なライブラリをインストールしてください。

GitHub Actions の例（node-canvas 用）

```yaml
name: e2e
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install system deps for node-canvas
        run: sudo apt-get update && sudo apt-get install -y \
          build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:e2e
```

skia-canvas を使う場合
- `skia-canvas` は Skia を利用する実装で、環境やバージョンによってはビルドや事前の依存が必要となることがあります。多くのケースで `npm ci` でインストールできることもありますが、失敗する場合は `node-canvas` の方にフォールバックする手順を用意してください。

Fontkit の導入
- `fontkit` をプロジェクトに追加しておくと、pdf-lib 側での埋め込みが安定します。インストール例:

```bash
npm install --save-dev fontkit
```

CI の注意点とヒント
- CI でのブラウザを使った E2E（Puppeteer）を行う場合、Chromium のパスやランナーの権限に注意してください（`--no-sandbox`、`--disable-setuid-sandbox` 等のフラグを検討）。
- テストが依存するフォントファイル（例: `specs/.../poc/NotoSansJP-Regular.ttf`）はリポジトリに含めておくか、CI で事前にダウンロードしておくと安定します。
- もし skia-canvas/node-canvas のどちらかが CI 環境で失敗する場合、ジョブ内で fallback path を用意する（まず skia-canvas を試み、失敗したら apt-get を実行して node-canvas 用 deps を入れて再試行）と堅牢です。

このドキュメントは PoC 向けの手順です。実運用の CI では runner イメージの固定やキャッシュ手順（`actions/cache`）を組み合わせて高速化してください。
