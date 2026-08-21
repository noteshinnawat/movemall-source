import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { promptGoogleAuth } from '../src/utils/googleAuth.ts';

const CLIENT_ID = 'test-client.apps.googleusercontent.com';
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.warn = () => {};
});

afterEach(() => {
  console.warn = originalConsoleWarn;
  delete globalThis.window;
});

function installGoogleTokenClient(trigger) {
  globalThis.window = {
    google: {
      accounts: {
        oauth2: {
          initTokenClient(config) {
            return {
              requestAccessToken() {
                setTimeout(() => trigger(config), 0);
              },
            };
          },
        },
      },
    },
  };
}

async function settlementOf(promise) {
  return Promise.race([
    promise.then(
      () => ({ status: 'resolved' }),
      error => ({ status: 'rejected', error }),
    ),
    new Promise(resolve => {
      setTimeout(() => resolve({ status: 'pending' }), 25);
    }),
  ]);
}

test('rejects when the Google popup closes before returning a token', async () => {
  installGoogleTokenClient(config => {
    try {
      config.error_callback({ type: 'popup_closed' });
    } catch {
      // Google invokes this callback asynchronously; a thrown error does not
      // settle the Promise returned by promptGoogleAuth.
    }
  });

  const result = await settlementOf(promptGoogleAuth(CLIENT_ID));

  assert.equal(result.status, 'rejected');
  assert.equal(result.error.code, 'GOOGLE_POPUP_CLOSED');
});

test('rejects when Google returns an OAuth error without an access token', async () => {
  installGoogleTokenClient(config => {
    void config.callback({
      error: 'access_denied',
      error_description: 'The user denied the request',
    }).catch(() => undefined);
  });

  const result = await settlementOf(promptGoogleAuth(CLIENT_ID));

  assert.equal(result.status, 'rejected');
  assert.equal(result.error.code, 'GOOGLE_AUTH_FAILED');
});
