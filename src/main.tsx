import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/config.ts'
import App from './App.tsx'

// ── Disable verbose debug console logs in Production environment ──
if (import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
}

// ── Safe Chunk Cache Invalidation with loop protection ──
window.addEventListener('vite:preloadError', () => {
  const retryKey = 'mm_preload_retry';
  if (!sessionStorage.getItem(retryKey)) {
    sessionStorage.setItem(retryKey, 'true');
    window.location.reload();
  }
});

// ── Service Worker registration (moved out of index.html to satisfy CSP script-src 'self') ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
