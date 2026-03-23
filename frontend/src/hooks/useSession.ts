import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getBackendToken } from '@/lib/session';
import { SESSION_EXPIRED_EVENT } from '@/lib/utils';

interface UseSessionOptions {
  onSessionExpired?: () => void;
  redirectToExpiredPage?: boolean;
}

/**
 * Hook para manejar la validación y expiración de sesión del usuario.
 * Escucha eventos de expiración y redirige automáticamente si es necesario.
 */
export function useSession(options: UseSessionOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSessionValid, setIsSessionValid] = useState(() => Boolean(getBackendToken()));
  const [isLoading, setIsLoading] = useState(true);

  const { onSessionExpired, redirectToExpiredPage = true } = options;

  const handleSessionExpired = useCallback(() => {
    setIsSessionValid(false);
    onSessionExpired?.();

    // Redirigir a página de sesión expirada si no estamos ya ahí
    if (redirectToExpiredPage && pathname !== '/session-expired') {
      router.replace('/session-expired');
    }
  }, [onSessionExpired, redirectToExpiredPage, pathname, router]);

  useEffect(() => {
    // Verificar si hay token al montar el componente
    const token = getBackendToken();
    setIsSessionValid(Boolean(token));
    setIsLoading(false);

    // Escuchar evento de expiración de sesión
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [handleSessionExpired]);

  return {
    isSessionValid,
    isLoading,
    hasToken: Boolean(getBackendToken()),
  };
}
