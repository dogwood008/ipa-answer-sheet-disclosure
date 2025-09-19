# data-model.md — A4 PDF生成（IPAテンプレート）データモデル

## Entities

### UserInput
- 説明: ユーザがフォームで入力するデータの集合。
- フィールド:
  - name: string (氏名)
  - address: string (住所) — optional
  - exam_number: string (受験番号)
  - date_of_birth: string (生年月日) — optional
  - answer_marks: object | string (答案用マーク/選択肢) — optional
  - remarks: string — optional
- バリデーション:
  - name と exam_number は必須
  - exam_number は半角数字を期待。長すぎる場合は切り詰めまたは縮小表示で対応

### PDFTemplate
- 説明: IPA が提供する A4 テンプレート PDF のメタデータ
- フィールド:
  - file: binary/pdf
  - url: string (元のダウンロード URL)
  - version: string (任意)
  - field_definitions: array of FieldMapConfig

### FieldMapConfig
- 説明: ひとつの入力項目が PDF 上のどの座標に描かれるかを定義する設定
- フィールド:
  - key: string (例: "name", "examNumber")
  - x: number (左起点の x 座標、PDF 単位)
  - y: number (下起点の y 座標、PDF 単位)
  - size: number (ポイント)
  - type: enum { text, checkbox, circle }
  - font: optional string (埋め込みフォント識別子)

## Usage
- フロントエンドは `UserInput` を受け取り、`FieldMapConfig` に従って `pdf-lib` で `PDFTemplate` 上に描画する。
- フォントは可能なら埋め込み（ユーザが `.ttf/.otf` を提供）し、そうでない場合は CDN から読み込んだフォントで Canvas に描画し、PNG を埋め込む。

## Notes
- 仕様上サーバは不要。将来 API を追加する場合は `contracts/` に OpenAPI を配置する。
