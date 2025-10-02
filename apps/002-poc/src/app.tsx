import React, { useState } from 'react';

export default function App() {
  const [name, setName] = useState('');
  const [examNumber, setExamNumber] = useState('');
  const [url, setUrl] = useState<string | null>(null);

  const onGenerate = async () => {
    try {
      // Dynamic import from root library to keep duplication minimal
      const { generateAnswerSheetPdf } = await import('../../../src/lib/pdf/index.js');
      const bytes = generateAnswerSheetPdf({}, { name, examNumber });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      setUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return objectUrl;
      });
    } catch (e) {
      alert('生成に失敗しました: ' + (e as Error).message);
    }
  };

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <h1>IPA Answer Sheet Generator (002-poc)</h1>
      <div style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
        <label htmlFor="name">氏名</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} />

        <label htmlFor="examNumber">受験番号</label>
        <input id="examNumber" value={examNumber} onChange={(e) => setExamNumber(e.target.value)} />

        <button id="generate" onClick={onGenerate}>PDFを生成</button>
      </div>
      {url && (
        <div style={{ marginTop: 16 }}>
          <a id="download" href={url} download="out.pdf">ダウンロード</a>
          <div style={{ marginTop: 8 }}>
            <iframe src={url} style={{ width: '100%', height: 600 }} />
          </div>
        </div>
      )}
    </div>
  );
}
