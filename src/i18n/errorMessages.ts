// src/i18n/errorMessages.ts — Maps stable API error codes to translation keys.
//
// Server responses may still carry an arbitrary `message` string (kept for
// `console.warn`/debugging), but buyer-facing UI must never render it
// directly — only this explicit map decides what the buyer sees.

const KNOWN_CODES = {
  AUTH_INVALID_CREDENTIALS: 'errors.authInvalidCredentials',
  AUTH_REQUIRED: 'errors.authRequired',
  OTP_INVALID: 'errors.otpInvalid',
  OTP_EXPIRED: 'errors.otpExpired',
  PRODUCT_NOT_FOUND: 'errors.productNotFound',
  ORDER_OUT_OF_STOCK: 'errors.orderOutOfStock',
  ORDER_FAILED: 'errors.orderFailed',
  PAYMENT_FAILED: 'errors.paymentFailed',
  NETWORK_ERROR: 'errors.networkError',
  RATE_LIMITED: 'errors.rateLimited',
} as const;

export type KnownErrorCode = keyof typeof KNOWN_CODES;

export function errorTranslationKey(code: unknown): string {
  if (typeof code === 'string' && code in KNOWN_CODES) {
    return KNOWN_CODES[code as KnownErrorCode];
  }
  return 'errors.generic';
}
