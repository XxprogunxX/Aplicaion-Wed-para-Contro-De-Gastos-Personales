'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import { getBackendToken } from '@/lib/session';

interface LayoutShellProps {
  children: React.ReactNode;
}

const authPaths = ['/auth/login', '/auth/register'];

export default function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [readyToRender, setReadyToRender] = useState(false);

  const isAuthPath = authPaths.includes(pathname);
  const hideChrome = authPaths.includes(pathname);

  useEffect(() => {
    const token = getBackendToken();
    const isAuthenticated = Boolean(token);

    if (!isAuthPath && !isAuthenticated) {
      setReadyToRender(false);
      router.replace('/auth/login');
      return;
    }

    if (isAuthPath && isAuthenticated) {
      setReadyToRender(false);
      router.replace('/');
      return;
    }

    setReadyToRender(true);
  }, [isAuthPath, router]);

  if (!readyToRender) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {!hideChrome && <Navbar />}
      <main>{children}</main>
      {!hideChrome && <Footer />}
    </div>
  );
}
