import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for offline capability
if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Teacher Hub Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('Service Worker registration skipped or restricted:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
