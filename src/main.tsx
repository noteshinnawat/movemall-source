import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ── Auto-reload on stale build chunks (Vite / Cloudflare Pages Cache Invalidation) ──
window.addEventListener('vite:preloadError', () => {
  console.warn('🔄 New version detected or chunk missing, reloading page to fetch latest version...');
  window.location.reload();
});

window.addEventListener('error', (e) => {
  if (e.message && (
    e.message.includes('Failed to fetch dynamically imported module') ||
    e.message.includes('Importing a module script failed') ||
    e.message.includes('MIME type of "text/html"')
  )) {
    console.warn('🔄 Dynamic module script failed to load, auto-reloading page...');
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

