# quickstart.md — A4 PDF生成 PoC 簡易手順

1. ローカルで簡易 HTTP サーバを起動します（リポジトリの `specs/001-a4-pdf-pdf/poc` に移動）:

```bash
cd /home/kit/projects/github/ipa-answer-sheet-disclosure/specs/001-a4-pdf-pdf/poc
python3 -m http.server 8000
```

2. ブラウザで `http://localhost:8000` を開きます。  
3. 氏名と受験番号を入力して「PDF生成・プレビュー」をクリックします。  
4. プレビューが別タブで開き、ダウンロードリンクが有効になります。  
5. 必要に応じてローカルのテンプレート PDF（IPA 提供の PDF を事前にダウンロード）や日本語フォント（.ttf/.otf）を選択してテストしてください。  

注意: IPA のテンプレートを外部から取得する場合、CORS でブロックされる場合があります。その場合はテンプレート PDF を手動でダウンロードしてローカルで選択してください。
