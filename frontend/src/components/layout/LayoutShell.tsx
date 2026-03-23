'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatbotWidget from './ChatbotWidget';
import { api } from '@/lib/api';
import {
  BACKEND_SESSION_STORAGE_KEYS,
  clearBackendSession,
  getBackendSessionExpirationTimestamp,
  hasBackendRole,
  recoverValidBackendSession,
  setBackendUser,
} from '@/lib/session';

interface LayoutShellProps {
  children: React.ReactNode;
}

const authPaths = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
const isChatbotEnabled = process.env.NEXT_PUBLIC_CHATBOT_ENABLED !== 'false';

export default function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [readyToRender, setReadyToRender] = useState(false);
  const [sessionSyncNonce, setSessionSyncNonce] = useState(0);

  const isAuthPath = authPaths.includes(pathname);
  const hideChrome = authPaths.includes(pathname);

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
    let isCancelled = false;

    const syncAuthState = async () => {
      const activeSession = recoverValidBackendSession();
      const hasToken = Boolean(activeSession?.token);

      if (!hasToken) {
        if (!isAuthPath) {
          setReadyToRender(false);
          router.replace('/auth/login');
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

        if (!hasBackendRole(['admin', 'user'])) {
          clearBackendSession();

          if (!isAuthPath) {
            setReadyToRender(false);
            router.replace('/auth/login');
            return;
          }

          setReadyToRender(true);
          return;
        }

        if (isCancelled) {
          return;
        }

        if (isAuthPath) {
          setReadyToRender(false);
          router.replace('/');
          return;
        }

        setReadyToRender(true);
      } catch {
        clearBackendSession();

        if (isCancelled) {
          return;
        }

        if (!isAuthPath) {
          setReadyToRender(false);
          router.replace('/auth/login');
          return;
        }

        setReadyToRender(true);
      }
    };

    void syncAuthState();

    return () => {
      isCancelled = true;
    };
  }, [isAuthPath, router, sessionSyncNonce]);

  useEffect(() => {
    if (isAuthPath) {
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
  }, [isAuthPath, pathname, router, sessionSyncNonce]);

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
