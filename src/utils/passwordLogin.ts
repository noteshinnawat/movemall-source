export interface PasswordLoginSession {
  token: string;
  user: {
    id: string;
    name: string;
    email?: string | null;
    role: string;
    coinsBalance?: number;
    avatarUrl?: string | null;
  };
}

interface AuthenticatePasswordLoginOptions {
  request: () => Promise<PasswordLoginSession>;
  onAuthenticated: (session: PasswordLoginSession) => void;
}

/**
 * Runs password authentication and persists state only after the API confirms
 * a real user session. Rejections intentionally propagate to the login UI.
 */
export async function authenticatePasswordLogin({
  request,
  onAuthenticated,
}: AuthenticatePasswordLoginOptions): Promise<PasswordLoginSession> {
  const session = await request();
  onAuthenticated(session);
  return session;
}
