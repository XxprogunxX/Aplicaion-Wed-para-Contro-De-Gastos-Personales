import { useCallback } from 'react';
import { sileo, Toaster  } from 'sileo';

export function useSileoToast() {
  const showSuccess = useCallback((message: string) => {
    sileo.success({ title: message });
  }, []);

  const showError = useCallback((message: string) => {
    sileo.error({ title: message });
  }, []);

  const showInfo = useCallback((message: string) => {
    sileo.info({ title: message });
  }, []);

  const showWarning = useCallback((message: string) => {
    sileo.warning({ title: message });
  }, []);

  return { showSuccess, showError, showInfo, showWarning };
}
