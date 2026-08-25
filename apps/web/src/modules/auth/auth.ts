export type AuthSession = {
  userId: string;
  email: string;
  name: string;
  authenticatedAt: string;
};

/**
 * Authentication remains intentionally disabled until a real server-side
 * provider is connected. A frontend-only credential adapter is not an
 * authentication boundary and must never be presented as one.
 */
export const AUTHENTICATION_ENABLED = false;
export const AUTH_PROVIDER = 'disabled';

const SESSION_KEY = 'visa-facil.auth.session.v1';

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return isString(candidate.userId)
    && isString(candidate.email)
    && isString(candidate.name)
    && isString(candidate.authenticatedAt)
    && Number.isFinite(Date.parse(candidate.authenticatedAt));
}

function parse(raw: string | null): AuthSession | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return isAuthSession(value) ? value : null;
  } catch {
    return null;
  }
}

export function getAuthSession(): AuthSession | null {
  if (!AUTHENTICATION_ENABLED) return null;
  return parse(sessionStorage.getItem(SESSION_KEY)) || parse(localStorage.getItem(SESSION_KEY));
}

export async function signIn(email: string, password: string, remember = false): Promise<AuthSession> {
  if (!AUTHENTICATION_ENABLED) {
    throw new Error('A autenticação está desativada neste ambiente.');
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) throw new Error('Informe um e-mail válido.');
  if (password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');

  void remember;
  throw new Error('Nenhum provedor de autenticação real está configurado.');
}

export function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function isInternalPath(path: string) {
  return path === '/workspaces' || path.startsWith('/crm') || path.startsWith('/site-admin') || path === '/preview';
}
