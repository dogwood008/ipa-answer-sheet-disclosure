# quickstart.md — A4 PDF生成 PoC 簡易手順

1. ローカルで簡易 HTTP サーバを起動します（リポジトリの `specs/001-a4-pdf-pdf/poc` に移動）:

```bash
cd ./specs/001-a4-pdf-pdf/poc
python3 -m http.server 8000
```

2. ブラウザで `http://localhost:8000` を開きます。  
3. 氏名と受験番号を入力して「PDF生成・プレビュー」をクリックします。  
4. プレビューが別タブで開き、ダウンロードリンクが有効になります。  
5. 必要に応じてローカルのテンプレート PDF（IPA 提供の PDF を事前にダウンロード）や日本語フォント（.ttf/.otf）を選択してテストしてください。  

## E2E テストと CI (追加)

この PoC では E2E スモークテストを用意しています。ローカルで E2E を実行する手順と、CI での注意点を以下に示します。

ローカル実行手順:

1. Poc ディレクトリで簡易 HTTP サーバを起動（別ターミナルで実行）:

```bash
cd ./specs/001-a4-pdf-pdf/poc
python3 -m http.server 8000
```

2. ルートリポジトリで依存をインストール:

```bash
cd ipa-answer-sheet-disclosure
npm ci
# または: npm install
```

3. E2E テストを実行:

```bash
npm run test:e2e
```

注: このリポジトリの devDependencies には `puppeteer-core` が含まれます。`puppeteer-core` はブラウザ本体をバンドルしないため、実行環境に Chrome/Chromium が必要です。テストがブラウザ不在で失敗する場合は、以下のいずれかを行ってください:

- システムに Chromium をインストール (例: Ubuntu の場合 `sudo apt-get install -y chromium-browser`)
- または CI 環境でフル版の `puppeteer` を使う、もしくは `PUPPETEER_EXECUTABLE_PATH` を設定して既存のブラウザを指す

CI に関するメモ:

- GitHub Actions などで E2E を走らせる際は、ランナーにブラウザを用意する必要があります。`ubuntu-latest` では apt や snap を使って Chromium を入れるか、`actions/setup-chrome` 相当のアクションを使ってブラウザを用意してください。
- CI ではヘッドレス実行かつ最小限のブラウザ操作のみ行うスモークテストを推奨します（例: ページロード、フォーム入力、PDF 生成ボタンのクリック、生成物の存在確認）。テストが重い場合はタグやワークフローで分離してください。
- 代替: CI で確実に動かすなら `puppeteer` を devDependency に追加して Chromium を自動で用意する方法が最も簡単です。

```
