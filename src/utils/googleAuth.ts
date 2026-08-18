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
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
            }
          ) => void;
        };
      };
    };
  }
}

export interface GoogleAuthResult {
  credential?: string;
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
  if (window.google?.accounts?.id) return Promise.resolve(true);
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
 * Perform Google Sign-in / Sign-up
 * Returns either actual Google credential token or simulated user object
 */
export async function promptGoogleAuth(clientId?: string): Promise<GoogleAuthResult> {
  const activeClientId = clientId || (import.meta.env.VITE_GOOGLE_CLIENT_ID as string);

  // If Client ID is provided and GIS loads successfully
  if (activeClientId && activeClientId !== 'YOUR_GOOGLE_CLIENT_ID') {
    const loaded = await loadGoogleScript();
    if (loaded && window.google?.accounts?.id) {
      return new Promise((resolve) => {
        window.google!.accounts.id.initialize({
          client_id: activeClientId,
          callback: (response) => {
            if (response?.credential) {
              resolve({ credential: response.credential });
            } else {
              // Fallback
              resolve({
                mockUser: {
                  googleId: `goog_${Date.now()}`,
                  email: `google_${Date.now()}@gmail.com`,
                  name: 'ผู้ใช้ Google',
                  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GoogleUser',
                },
              });
            }
          },
          cancel_on_tap_outside: true,
        });

        window.google!.accounts.id.prompt();
      });
    }
  }

  // Dev fallback with simulated realistic Google Account
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
