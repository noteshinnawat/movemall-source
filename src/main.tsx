import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

