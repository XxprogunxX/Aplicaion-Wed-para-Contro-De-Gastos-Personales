const TOKEN_STORAGE_KEY = 'token';

export function getBackendToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  return storedToken && storedToken.trim() ? storedToken : null;
}

export function setBackendToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearBackendToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Backward-compatible helper used across pages.
 * It now only reads current token and never auto-creates one.
 */
export function ensureBackendToken(): string | null {
  return getBackendToken();
}