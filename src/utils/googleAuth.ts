// Google Authentication Utility for Movemall

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notification?: (notification: unknown) => void) => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (tokenResponse: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
            error_callback?: (error: unknown) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export interface GoogleAuthResult {
  credential?: string;
  accessToken?: string;
  googleUser?: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  };
  mockUser?: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  };
}

let isGisLoaded = false;
let gisLoadPromise: Promise<boolean> | null = null;

/**
 * Load Google Identity Services SDK Script
 */
export function loadGoogleScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.google?.accounts?.oauth2 || window.google?.accounts?.id) return Promise.resolve(true);
  if (isGisLoaded) return Promise.resolve(true);

  if (gisLoadPromise) return gisLoadPromise;

  gisLoadPromise = new Promise((resolve) => {
    const existingScript = document.getElementById('google-jssdk');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        isGisLoaded = true;
        resolve(true);
      });
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-jssdk';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      isGisLoaded = true;
      resolve(true);
    };
    script.onerror = () => {
      console.warn('Google Identity Services SDK could not be loaded. Falling back to dev mode.');
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return gisLoadPromise;
}

/**
 * Perform Google Sign-in / Sign-up with Google OAuth2 Popup
 */
export async function promptGoogleAuth(clientId?: string): Promise<GoogleAuthResult> {
  const activeClientId = clientId || (import.meta.env.VITE_GOOGLE_CLIENT_ID as string);

  // If Client ID is provided and GIS loads successfully
  if (activeClientId && activeClientId !== 'YOUR_GOOGLE_CLIENT_ID' && activeClientId.includes('.apps.googleusercontent.com')) {
    const loaded = await loadGoogleScript();

    if (loaded && window.google?.accounts?.oauth2) {
      try {
        return await new Promise<GoogleAuthResult>((resolve) => {
          const client = window.google!.accounts.oauth2.initTokenClient({
            client_id: activeClientId,
            scope: 'email profile openid',
            callback: async (tokenResponse) => {
              if (tokenResponse?.access_token) {
                // Fetch Userinfo directly to ensure instant profile loading
                try {
                  const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                  });
                  if (uRes.ok) {
                    const uData = await uRes.json() as {
                      sub: string;
                      email: string;
                      name: string;
                      picture?: string;
                    };
                    resolve({
                      accessToken: tokenResponse.access_token,
                      googleUser: {
                        googleId: uData.sub,
                        email: uData.email,
                        name: uData.name || uData.email.split('@')[0],
                        avatarUrl: uData.picture,
                      },
                    });
                    return;
                  }
                } catch (e) {
                  console.warn('Direct userinfo fetch failed:', e);
                }

                resolve({ accessToken: tokenResponse.access_token });
              } else {
                console.warn('Google OAuth Token response error:', tokenResponse);
                resolve(getDevMockUser());
              }
            },
            error_callback: (err) => {
              console.warn('Google OAuth Prompt Error:', err);
              resolve(getDevMockUser());
            },
          });

          // Trigger standard Google Account Selector Popup
          client.requestAccessToken({ prompt: 'select_account' });
        });
      } catch (promptErr) {
        console.warn('Google Auth Client Init Error:', promptErr);
      }
    }
  }

  // Dev fallback with simulated realistic Google Account
  return getDevMockUser();
}

function getDevMockUser(): GoogleAuthResult {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return {
    mockUser: {
      googleId: `goog_${Date.now()}`,
      email: `movemall.shopper.${randomSuffix}@gmail.com`,
      name: `Google Shopper ${randomSuffix}`,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=Google_${randomSuffix}`,
    },
  };
}
