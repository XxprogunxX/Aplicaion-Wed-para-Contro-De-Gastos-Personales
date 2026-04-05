'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatbotWidget from './ChatbotWidget';
import { api } from '@/lib/api';
import { canAccessRoute } from '@/lib/accessControl';
import {
  BACKEND_SESSION_STORAGE_KEYS,
  clearBackendSession,
  getBackendSessionExpirationTimestamp,
  getBackendUserRole,
  recoverValidBackendSession,
  setBackendUser,
} from '@/lib/session';
import { ACCESS_FORBIDDEN_EVENT } from '@/lib/utils';
import type { ApiError } from '@/types';

interface LayoutShellProps {
  children: React.ReactNode;
}

const hideChromePaths = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
const isChatbotEnabled = process.env.NEXT_PUBLIC_CHATBOT_ENABLED !== 'false';

export default function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [readyToRender, setReadyToRender] = useState(false);
  const [sessionSyncNonce, setSessionSyncNonce] = useState(0);

  const hideChrome = hideChromePaths.includes(pathname);

  useEffect(() => {
    const storageKeys = new Set<string>(BACKEND_SESSION_STORAGE_KEYS);

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || storageKeys.has(event.key)) {
        setSessionSyncNonce((current) => current + 1);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    const handleAccessForbidden = () => {
      const accessDecision = canAccessRoute(pathname, getBackendUserRole(), true);
      if (accessDecision.reason === 'forbidden') {
        setReadyToRender(false);
        router.replace(accessDecision.redirectTo || '/acceso-denegado');
      }
    };

    window.addEventListener(ACCESS_FORBIDDEN_EVENT, handleAccessForbidden);
    return () => {
      window.removeEventListener(ACCESS_FORBIDDEN_EVENT, handleAccessForbidden);
    };
  }, [pathname, router]);

  useEffect(() => {
    let isCancelled = false;

    const syncAuthState = async () => {
      const activeSession = recoverValidBackendSession();
      const hasSession = Boolean(activeSession?.token);

      if (!hasSession) {
        const accessDecision = canAccessRoute(pathname, null, false);
        if (!accessDecision.allowed) {
          setReadyToRender(false);
          router.replace(accessDecision.redirectTo || '/auth/login');
          return;
        }

        if (!isCancelled) {
          setReadyToRender(true);
        }
        return;
      }

      try {
        const profile = await api.getProfile();

        if (isCancelled) {
          return;
        }

        setBackendUser(profile);
        const currentRole = getBackendUserRole();

        if (!currentRole) {
          clearBackendSession();
          setReadyToRender(false);
          router.replace('/auth/login');
          return;
        }

        const accessDecision = canAccessRoute(pathname, currentRole, true);
        if (!accessDecision.allowed) {
          setReadyToRender(false);
          router.replace(accessDecision.redirectTo || '/');
          return;
        }

        if (isCancelled) {
          return;
        }

        setReadyToRender(true);
      } catch (error) {
        const apiError = error as ApiError;

        if (apiError?.status === 403) {
          setReadyToRender(false);
          router.replace('/acceso-denegado');
          return;
        }

        clearBackendSession();

        if (isCancelled) {
          return;
        }

        setReadyToRender(false);
        router.replace('/auth/login');
      }
    };

    void syncAuthState();

    return () => {
      isCancelled = true;
    };
  }, [pathname, router, sessionSyncNonce]);

  useEffect(() => {
    const activeSession = recoverValidBackendSession();
    if (!activeSession?.token) {
      return;
    }

    const expirationTimestamp = getBackendSessionExpirationTimestamp();
    if (!expirationTimestamp) {
      return;
    }

    const millisecondsUntilExpiration = expirationTimestamp - Date.now();

    if (millisecondsUntilExpiration <= 0) {
      clearBackendSession();
      setReadyToRender(false);
      router.replace('/auth/login');
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearBackendSession();
      setReadyToRender(false);
      router.replace('/auth/login');
    }, millisecondsUntilExpiration + 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pathname, router, sessionSyncNonce]);

  if (!readyToRender) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {!hideChrome && <Navbar />}
      <main className={hideChrome ? '' : 'pb-24 sm:pb-0'}>{children}</main>
      {!hideChrome && <Footer />}
      {!hideChrome && isChatbotEnabled && <ChatbotWidget />}
    </div>
  );
}
