// src/utils/apiError.ts — Shared error type for stable, code-driven API errors.
//
// Split out from api.ts so modules that only need the error type (e.g.
// googleAuth.ts, or this module under `node --test`) don't have to evaluate
// api.ts's Vite-only `import.meta.env` top-level code.

// Buyer UI must never render `message` — it comes straight from the server
// and is not localized. Only `code` (mapped via `errorTranslationKey`) may
// drive user-facing copy; `message` exists solely for console.warn/debugging.
export class ApiError extends Error {
  code: string;

  constructor(code: string, message?: string) {
    super(message || code);
    this.name = 'ApiError';
    this.code = code;
  }
}
