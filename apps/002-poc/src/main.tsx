import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

// 002-poc: ロジックは App 内に統合済み（poc-script は未使用）
