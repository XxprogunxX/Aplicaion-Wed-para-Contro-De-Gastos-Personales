import { useEffect, useState } from 'react';

/**
 * Devuelve true cuando el usuario ha activado "reducir movimiento" a nivel de sistema.
 * Implementado como hook para poder desactivar animaciones en componentes concretos.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Estado inicial
    setPrefersReducedMotion(mediaQuery.matches);

    // Suscribirse a cambios
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

