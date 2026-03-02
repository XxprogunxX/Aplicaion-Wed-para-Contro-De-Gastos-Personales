import { useState, useCallback } from 'react';
import { sileo } from 'sileo';
import { api } from '@/lib/api';
import { ApiError } from '@/types';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: () => Promise<T>, options?: { showSuccess?: boolean; successMessage?: string }): Promise<T> => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await apiCall();
      // DESARROLLO: Agregar delay para ver animaciones (elimina esto en producción)
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      setState({ data, loading: false, error: null });
      
      if (options?.showSuccess !== false) {
        sileo.success({ title: options?.successMessage || '¡Operación exitosa!' });
      }
      
      return data;
    } catch (error) {
      const apiError = error as ApiError;
      setState({ data: null, loading: false, error: apiError });
      
      sileo.error({ title: apiError.message || 'Ocurrió un error' });
      
      throw apiError; // Re-throw para que el componente pueda manejar si quiere
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}