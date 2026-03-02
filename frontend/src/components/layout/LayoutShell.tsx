'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutShellProps {
  children: React.ReactNode;
}

const authPaths = ['/auth/login', '/auth/register'];

export default function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname();
  const hideChrome = authPaths.includes(pathname);

  return (
    <div className="min-h-screen bg-background">
      {!hideChrome && <Navbar />}
      <main>{children}</main>
      {!hideChrome && <Footer />}
    </div>
  );
}
