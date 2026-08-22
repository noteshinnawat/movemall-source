import test from 'node:test';
import assert from 'node:assert/strict';

import { authenticatePasswordLogin } from '../src/utils/passwordLogin.ts';

test('does not persist a session when password authentication is rejected', async () => {
  let persistedSession = null;
  const rejectedLogin = Object.assign(new Error('Invalid credentials'), {
    code: 'AUTH_INVALID_CREDENTIALS',
  });

  await assert.rejects(
    authenticatePasswordLogin({
      request: async () => {
        throw rejectedLogin;
      },
      onAuthenticated: session => {
        persistedSession = session;
      },
    }),
    error => error === rejectedLogin,
  );

  assert.equal(persistedSession, null);
});

test('persists only the authenticated response returned by the login API', async () => {
  let persistedSession = null;
  const authenticatedSession = {
    token: 'real-jwt-token',
    user: { id: 'user-in-database', name: 'Member', role: 'BUYER' },
  };

  const result = await authenticatePasswordLogin({
    request: async () => authenticatedSession,
    onAuthenticated: session => {
      persistedSession = session;
    },
  });

  assert.equal(result, authenticatedSession);
  assert.equal(persistedSession, authenticatedSession);
});
