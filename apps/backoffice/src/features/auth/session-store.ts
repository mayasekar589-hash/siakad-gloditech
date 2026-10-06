import type { BackOfficeSession } from "./auth-provider";

const sessionKey = "siakad_backoffice_session";

function isBackOfficeSession(value: unknown): value is BackOfficeSession {
  if (!value || typeof value !== "object") return false;

  const session = value as Partial<BackOfficeSession>;
  return session.authenticated === true
    && session.loginMethod === "username"
    && typeof session.user?.id === "string"
    && typeof session.user.username === "string"
    && typeof session.user.name === "string"
    && typeof session.user.role === "string";
}

export function saveBackOfficeSession(session: BackOfficeSession, rememberMe: boolean): void {
  if (typeof window === "undefined") return;

  const persistentStore = rememberMe ? window.localStorage : window.sessionStorage;
  const otherStore = rememberMe ? window.sessionStorage : window.localStorage;
  otherStore.removeItem(sessionKey);
  persistentStore.setItem(sessionKey, JSON.stringify(session));
}

export function getBackOfficeSession(): BackOfficeSession | null {
  if (typeof window === "undefined") return null;

  for (const store of [window.localStorage, window.sessionStorage]) {
    const serializedSession = store.getItem(sessionKey);
    if (!serializedSession) continue;

    try {
      const session: unknown = JSON.parse(serializedSession);
      if (isBackOfficeSession(session)) return session;
      store.removeItem(sessionKey);
    } catch {
      store.removeItem(sessionKey);
    }
  }

  return null;
}

export function clearBackOfficeSession(): void {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(sessionKey);
  window.sessionStorage.removeItem(sessionKey);
}