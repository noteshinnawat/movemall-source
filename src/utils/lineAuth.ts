// src/utils/lineAuth.ts — Official LINE Login v2.1 OAuth Integration

import i18n from '../i18n/config';
import { localeFromPath, resolveRootLocale, withLocale } from '../i18n/locales';

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
 * Get the current callback URL for LINE Login.
 *
 * The locale segment is part of the URL, so all three localized callbacks must
 * be allow-listed in the LINE Console before release (see the deployment
 * checklist). `/auth/line/callback` stays a legacy path that redirects to Thai.
 */
export function getLineCallbackUrl(): string {
  if (typeof window === 'undefined') return '';
  // On the callback itself the path already carries the locale that was used at
  // authorize time, so both requests send LINE an identical redirect_uri.
  const locale = localeFromPath(window.location.pathname)
    ?? resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  return `${window.location.origin}${withLocale('/auth/line/callback', locale)}`;
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
