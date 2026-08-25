export type AuthSession = {
  userId: string;
  email: string;
  name: string;
  authenticatedAt: string;
};

export const AUTHENTICATION_ENABLED = true;
export const AUTH_PROVIDER = 'prototype-adapter';

const SESSION_KEY = 'visa-facil.auth.session.v1';

function parse(raw: string | null): AuthSession | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as AuthSession;
    return value?.email ? value : null;
  } catch {
    return null;
  }
}

export function getAuthSession(): AuthSession | null {
  if (!AUTHENTICATION_ENABLED) {
    return {
      userId: 'authentication-disabled',
      email: 'dev@visafacil.local',
      name: 'Administrador',
      authenticatedAt: new Date().toISOString(),
    };
  }
  return parse(sessionStorage.getItem(SESSION_KEY)) || parse(localStorage.getItem(SESSION_KEY));
}

export async function signIn(email: string, password: string, remember = false): Promise<AuthSession> {
  const cleanEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) throw new Error('Informe um e-mail válido.');
  if (password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');

  // Provider adapter: the current repository does not yet contain an authentication API.
  // Keeping the boundary here lets the prototype be replaced by Supabase/Auth0/backend auth
  // without changing routing, workspace selection or the protected application shell.
  await Promise.resolve();

  const session: AuthSession = {
    userId: `user:${cleanEmail}`,
    email: cleanEmail,
    name: cleanEmail.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    authenticatedAt: new Date().toISOString(),
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  if (remember) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  return session;
}

export function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function isInternalPath(path: string) {
  return path === '/workspaces' || path.startsWith('/crm') || path.startsWith('/site-admin') || path === '/preview';
}
