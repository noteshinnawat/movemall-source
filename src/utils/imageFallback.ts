// Shared fallback for <img> tags whose remote source (mock data hotlinks
// to images.unsplash.com, dicebear, qrserver, etc.) fails to load — swaps
// in a neutral inline placeholder instead of the browser's broken-image icon.

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#F3F4F6"/>
      <g fill="none" stroke="#D1D5DB" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
        <rect x="30" y="45" width="140" height="110" rx="8"/>
        <circle cx="72" cy="82" r="12"/>
        <path d="M30 135l40-40 30 30 25-25 45 45"/>
      </g>
    </svg>`
  );

export function onImageError(e: React.SyntheticEvent<HTMLImageElement>): void {
  const img = e.currentTarget;
  if (img.src === FALLBACK_IMAGE) return;
  img.onerror = null;
  img.src = FALLBACK_IMAGE;
}
