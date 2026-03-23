import type { UserRole, Usuario } from '@/types';

const TOKEN_STORAGE_KEY = 'token';
const USER_STORAGE_KEY = 'session_user';
const SESSION_STORAGE_KEY = 'backend_session_v1';
const EXPIRY_LEEWAY_SECONDS = 30;

export const BACKEND_SESSION_STORAGE_KEYS = [
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  SESSION_STORAGE_KEY,
] as const;

type BackendSessionInput = {
  token: string;
  user: Usuario;
};

type TokenPayload = {
  sub?: unknown;
  id?: unknown;
  email?: unknown;
  username?: unknown;
  role?: unknown;
  exp?: unknown;
  iat?: unknown;
};

type StoredBackendSession = {
  token: string;
  user: Usuario | null;
  role: UserRole;
  issuedAt: string | null;
  expiresAt: string | null;
  updatedAt: string;
};

function normalizeRole(value: unknown): UserRole {
  return String(value || '').trim().toLowerCase() === 'admin' ? 'admin' : 'user';
}

function decodeTokenPayload(token: string): TokenPayload | null {
  const payloadSegment = String(token || '').split('.')[1] || '';
  if (!payloadSegment) {
    return null;
  }

  try {
    const normalizedPayload = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
    return JSON.parse(atob(paddedPayload)) as TokenPayload;
  } catch {
    return null;
  }
}

function parseUnixSeconds(value: unknown): number | null {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return Math.floor(numericValue);
}

function unixSecondsToIso(value: number | null): string | null {
  if (value === null) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

function normalizeToken(token: unknown): string {
  return String(token || '').trim();
}

function getTokenPrincipalId(payload: TokenPayload | null): string {
  if (!payload) {
    return '';
  }

  return String(payload.id ?? payload.sub ?? '').trim();
}

function createUserFromTokenPayload(payload: TokenPayload | null, fallbackCreatedAt: string): Usuario | null {
  if (!payload) {
    return null;
  }

  const id = getTokenPrincipalId(payload);
  const username = String(payload.username || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();

  if (!id || !username || !email) {
    return null;
  }

  return {
    id,
    username,
    email,
    role: normalizeRole(payload.role),
    createdAt: fallbackCreatedAt,
  };
}

function normalizeUser(rawValue: unknown): Usuario | null {
  if (!rawValue || typeof rawValue !== 'object') {
    return null;
  }

  const user = rawValue as Partial<Usuario>;
  const id = String(user.id || '').trim();
  const username = String(user.username || '').trim();
  const email = String(user.email || '').trim();
  const createdAt = String(user.createdAt || '').trim();

  if (!id || !username || !email || !createdAt) {
    return null;
  }

  return {
    id,
    username,
    email: email.toLowerCase(),
    role: normalizeRole(user.role),
    createdAt,
  };
}

function isTokenExpired(token: string, leewaySeconds = EXPIRY_LEEWAY_SECONDS): boolean {
  const payload = decodeTokenPayload(token);
  const expSeconds = parseUnixSeconds(payload?.exp);

  if (expSeconds === null) {
    return false;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return nowInSeconds >= expSeconds - leewaySeconds;
}

function buildStoredSession(tokenValue: string, userValue: unknown): StoredBackendSession | null {
  const token = normalizeToken(tokenValue);
  if (!token) {
    return null;
  }

  const payload = decodeTokenPayload(token);
  const normalizedUser = normalizeUser(userValue);
  const iatSeconds = parseUnixSeconds(payload?.iat);
  const expSeconds = parseUnixSeconds(payload?.exp);
  const fallbackCreatedAt = unixSecondsToIso(iatSeconds) || new Date().toISOString();
  const user = normalizedUser || createUserFromTokenPayload(payload, fallbackCreatedAt);
  const role = normalizeRole(user?.role ?? payload?.role);

  if (user) {
    const tokenPrincipalId = getTokenPrincipalId(payload);
    if (tokenPrincipalId && String(user.id) !== tokenPrincipalId) {
      return null;
    }
  }

  if (isTokenExpired(token)) {
    return null;
  }

  return {
    token,
    user,
    role,
    issuedAt: unixSecondsToIso(iatSeconds),
    expiresAt: unixSecondsToIso(expSeconds),
    updatedAt: new Date().toISOString(),
  };
}

function persistSession(session: StoredBackendSession): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  window.localStorage.setItem(TOKEN_STORAGE_KEY, session.token);

  if (session.user) {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session.user));
  } else {
    window.localStorage.removeItem(USER_STORAGE_KEY);
  }
}

function readStoredSession(): StoredBackendSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (rawSession) {
    try {
      const parsedSession = JSON.parse(rawSession) as Partial<StoredBackendSession>;
      const session = buildStoredSession(parsedSession?.token || '', parsedSession?.user || null);

      if (!session) {
        return null;
      }

      return {
        ...session,
        role: normalizeRole(parsedSession?.role || session.role),
        updatedAt: String(parsedSession?.updatedAt || session.updatedAt),
      };
    } catch {
      return null;
    }
  }

  const legacyToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  const rawLegacyUser = window.localStorage.getItem(USER_STORAGE_KEY);
  let legacyUser: unknown = null;

  if (rawLegacyUser) {
    try {
      legacyUser = JSON.parse(rawLegacyUser);
    } catch {
      legacyUser = null;
    }
  }

  return buildStoredSession(legacyToken || '', legacyUser);
}

export function recoverValidBackendSession(): StoredBackendSession | null {
  const session = readStoredSession();

  if (!session) {
    clearBackendSession();
    return null;
  }

  persistSession(session);
  return session;
}

export function getBackendSession(): StoredBackendSession | null {
  return recoverValidBackendSession();
}

export function isBackendSessionValid(): boolean {
  return Boolean(getBackendSession());
}

export function getBackendSessionExpirationTimestamp(): number | null {
  const session = getBackendSession();
  if (!session?.expiresAt) {
    return null;
  }

  const timestamp = Date.parse(session.expiresAt);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function getBackendToken(): string | null {
  return getBackendSession()?.token || null;
}

export function setBackendToken(token: string): void {
  const safeToken = normalizeToken(token);
  if (!safeToken) {
    clearBackendSession();
    return;
  }

  const currentSession = getBackendSession();
  const nextSession = buildStoredSession(safeToken, currentSession?.user || null);

  if (!nextSession) {
    clearBackendSession();
    return;
  }

  persistSession(nextSession);
}

export function getBackendUser(): Usuario | null {
  return getBackendSession()?.user || null;
}

export function setBackendUser(user: Usuario): void {
  const normalizedUser = normalizeUser(user);
  if (!normalizedUser) {
    return;
  }

  const currentSession = getBackendSession();
  if (!currentSession?.token) {
    return;
  }

  const nextSession = buildStoredSession(currentSession.token, normalizedUser);
  if (!nextSession) {
    clearBackendSession();
    return;
  }

  persistSession(nextSession);
}

export function getBackendUserRole(): UserRole | null {
  const session = getBackendSession();
  if (!session?.token) {
    return null;
  }

  if (session.role) {
    return normalizeRole(session.role);
  }

  const payload = decodeTokenPayload(session.token);
  if (!payload) {
    return null;
  }

  return normalizeRole(payload.role);
}

export function setBackendSession(session: BackendSessionInput): void {
  const nextSession = buildStoredSession(session.token, session.user);
  if (!nextSession) {
    clearBackendSession();
    return;
  }

  persistSession(nextSession);
}

export function hasBackendRole(allowedRoles: UserRole | UserRole[]): boolean {
  const currentRole = getBackendUserRole();
  if (!currentRole) {
    return false;
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(currentRole);
}

export function clearBackendSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
}

export function clearBackendToken(): void {
  clearBackendSession();
}

/**
 * Backward-compatible helper used across pages.
 * It now only reads current token and never auto-creates one.
 */
export function ensureBackendToken(): string | null {
  return getBackendToken();
}