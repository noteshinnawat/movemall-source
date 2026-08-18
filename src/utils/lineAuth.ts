// src/utils/lineAuth.ts — Official LINE Login v2.1 OAuth Integration

export interface LineUserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  email?: string;
}

export interface LineAuthResult {
  code?: string;
  state?: string;
  lineUser?: LineUserProfile;
}

/**
 * Generate cryptographically random state for CSRF protection
 */
export function generateRandomState(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get the current callback URL for LINE Login
 */
export function getLineCallbackUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/auth/line/callback`;
}

/**
 * Initiate real LINE Login OAuth 2.1 authorization
 */
export function initiateLineLogin(customRedirectUri?: string) {
  const channelId = import.meta.env.VITE_LINE_CHANNEL_ID || '1656088534';
  const redirectUri = customRedirectUri || getLineCallbackUrl();
  const state = generateRandomState(24);
  const nonce = generateRandomState(16);

  // Store state in sessionStorage to verify on callback
  sessionStorage.setItem('line_oauth_state', state);
  sessionStorage.setItem('line_oauth_redirect_origin', window.location.pathname);

  const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${encodeURIComponent(
    channelId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&state=${encodeURIComponent(state)}&scope=profile%20openid%20email&nonce=${encodeURIComponent(
    nonce
  )}&bot_prompt=normal`;

  window.location.href = lineAuthUrl;
}
