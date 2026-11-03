import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign HMR / Vite WebSocket disconnection errors in dev iframe preview
if (typeof window !== 'undefined') {
  window.addEventListener('error', event => {
    const msg = event.message || '';
    const file = event.filename || '';
    if (
      msg.includes('WebSocket') ||
      msg.includes('vite') ||
      file.includes('@vite/client')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('unhandledrejection', event => {
    const reason = String(event.reason || '');
    if (reason.includes('WebSocket') || reason.includes('vite')) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
