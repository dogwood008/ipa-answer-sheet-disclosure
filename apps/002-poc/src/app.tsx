import React from 'react';

export default function App() {
  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1>PoC: A4 PDF生成（IPA答案用紙） - 002 React</h1>

      <label>ふりがな <input id="furigana" defaultValue="やまだ たろう" aria-label="ふりがな" /></label>
      <label>氏名 <input id="name" defaultValue="山田 太郎" /></label>
      <label>受験番号 <input id="examNumber" defaultValue="12345678" /></label>

      <div id="circleOptions" style={{ margin: '8px 0' }}>
        <span style={{ marginRight: 8 }}>円の描画:</span>
        <label style={{ marginRight: 8 }}><input type="radio" name="drawCircle" id="drawCircleOn" value="draw" /> 描く</label>
        <label><input type="radio" name="drawCircle" id="drawCircleOff" value="nodraw" defaultChecked /> 描かない</label>
      </div>

      <div id="rectOptions" style={{ margin: '8px 0' }}>
        <span style={{ marginRight: 8 }}>矩形の描画:</span>
        <label style={{ marginRight: 8 }}><input type="checkbox" id="drawRect" /> 描く</label>
        <label style={{ marginRight: 8 }}>x: <input id="rectX" type="number" defaultValue={50} style={{ width: 80 }} /></label>
        <label style={{ marginRight: 8 }}>y(上から): <input id="rectY" type="number" defaultValue={60} style={{ width: 80 }} /></label>
        <label style={{ marginRight: 8 }}>width: <input id="rectW" type="number" defaultValue={100} style={{ width: 80 }} /></label>
        <label>height: <input id="rectH" type="number" defaultValue={80} style={{ width: 80 }} /></label>
      </div>

      <button
        id="generate"
        onClick={() => {
          const w: any = window as any
          if (w.generate) {
            w.generate()
          } else {
            // Extreme fallback: do nothing to avoid overriding color-aware generator
          }
        }}
      >
        PDF生成・プレビュー
      </button>
      <a id="download" style={{ pointerEvents: 'none', opacity: 0.5, marginLeft: 8 }} download>ダウンロード</a>

      <h3>色の選択</h3>
      <div id="colorSection" style={{ margin: '8px 0' }}>
        <div style={{ marginBottom: 6 }}>
          <strong>プリセット:</strong>
          <button type="button" id="presetBlack" aria-label="黒に設定" style={{ marginLeft: 8, marginRight: 8 }}>黒</button>
          <button type="button" id="presetRed" aria-label="赤に設定">赤</button>
        </div>
        <div style={{ marginBottom: 6 }}>
          <label htmlFor="colorPicker"><strong>カラーピッカー:</strong></label>
          <input id="colorPicker" type="color" defaultValue="#000000" aria-label="カラーピッカー" />
        </div>
        <div style={{ marginBottom: 6 }}>
          <label htmlFor="colorName"><strong>CSS 色名:</strong></label>
          <input id="colorName" type="text" placeholder="例: green" aria-label="CSS 色名入力" />
        </div>
        <div>
          <span>選択中の色プレビュー: </span>
          <span id="colorSwatch" aria-label="選択色プレビュー" title="#000000" style={{ display: 'inline-block', width: 20, height: 20, border: '1px solid #ccc', background: '#000000', verticalAlign: 'middle' }}></span>
          <span id="colorValue" style={{ marginLeft: 6 }}>#000000</span>
        </div>
      </div>

      <h3>テンプレートPDF</h3>
      <p>
        <a id="templateLink" href="https://www.ipa.go.jp/privacy/hjuojm000000f2fl-att/02.pdf" target="_blank" rel="noopener">IPAテンプレートをこのリンクからダウンロード</a>
      </p>
      <label>またはローカルに保存したテンプレートPDFを選択: <input id="templateFile" type="file" accept="application/pdf" /></label>
      <label style={{ display: 'block', marginTop: 6 }}>フォントファイル（日本語対応：.ttf/.otf）を選択: <input id="fontFile" type="file" accept="font/ttf,font/otf,.ttf,.otf" /></label>

      <h3>プレビュー</h3>
      <iframe id="preview" style={{ width: '100%', height: 600, border: '1px solid #ddd' }} title="preview" />

      <h3>ログ</h3>
      <div id="log" style={{ whiteSpace: 'pre-wrap', border: '1px solid #ddd', padding: 8, height: 120, overflow: 'auto' }} />
    </div>
  );
}
