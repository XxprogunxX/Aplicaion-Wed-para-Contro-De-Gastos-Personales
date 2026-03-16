'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatbotWidget from './ChatbotWidget';
import { api } from '@/lib/api';
import { clearBackendToken, getBackendToken } from '@/lib/session';

interface LayoutShellProps {
  children: React.ReactNode;
}

const authPaths = ['/auth/login', '/auth/register'];
const isChatbotEnabled = process.env.NEXT_PUBLIC_CHATBOT_ENABLED !== 'false';

export default function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [readyToRender, setReadyToRender] = useState(false);

  const isAuthPath = authPaths.includes(pathname);
  const hideChrome = authPaths.includes(pathname);

  useEffect(() => {
    let isCancelled = false;

    const syncAuthState = async () => {
      const token = getBackendToken();
      const hasToken = Boolean(token);

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
        await api.getProfile();

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
        clearBackendToken();

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
  }, [isAuthPath, router]);

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
