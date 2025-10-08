import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

// Load PoC logic (TS) after React mounts so it can bind to elements
import('./poc-script');
