import type { UserRole } from '@/types';

export type FrontendPermission =
  | 'settings:view'
  | 'categories:manage';

export type RouteAccessReason =
  | 'ok'
  | 'no-session'
  | 'already-authenticated'
  | 'forbidden';

export interface RouteAccessDecision {
  allowed: boolean;
  reason: RouteAccessReason;
  redirectTo?: string;
}

const AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
] as const;

const PUBLIC_PATHS = ['/session-expired'] as const;

const ROLE_PERMISSIONS: Record<UserRole, FrontendPermission[]> = {
  admin: ['settings:view', 'categories:manage'],
  user: [],
};

const ROUTE_ROLE_RULES: Array<{ pathPrefix: string; roles: UserRole[] }> = [
  { pathPrefix: '/configuracion', roles: ['admin'] },
];

function normalizePathname(pathname: string): string {
  if (!pathname) {
    return '/';
  }

  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function startsWithPath(pathname: string, pathPrefix: string): boolean {
  if (pathname === pathPrefix) {
    return true;
  }

  return pathname.startsWith(`${pathPrefix}/`);
}

export function getDefaultRouteForRole(role: UserRole): string {
  return role === 'admin' ? '/configuracion' : '/';
}

export function hasPermission(role: UserRole | null, permission: FrontendPermission): boolean {
  if (!role) {
    return false;
  }

  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAccessRoute(pathname: string, role: UserRole | null, hasSession: boolean): RouteAccessDecision {
  const normalizedPathname = normalizePathname(pathname);
  const isAuthPath = AUTH_PATHS.some((path) => startsWithPath(normalizedPathname, path));
  const isPublicPath = PUBLIC_PATHS.some((path) => startsWithPath(normalizedPathname, path));

  if (!hasSession) {
    if (isAuthPath || isPublicPath) {
      return { allowed: true, reason: 'ok' };
    }

    return {
      allowed: false,
      reason: 'no-session',
      redirectTo: '/auth/login',
    };
  }

  if (isAuthPath) {
    return {
      allowed: false,
      reason: 'already-authenticated',
      redirectTo: role ? getDefaultRouteForRole(role) : '/',
    };
  }

  const matchedRule = ROUTE_ROLE_RULES.find((rule) => startsWithPath(normalizedPathname, rule.pathPrefix));

  if (matchedRule && role && !matchedRule.roles.includes(role)) {
    return {
      allowed: false,
      reason: 'forbidden',
      redirectTo: '/acceso-denegado',
    };
  }

  return { allowed: true, reason: 'ok' };
}
