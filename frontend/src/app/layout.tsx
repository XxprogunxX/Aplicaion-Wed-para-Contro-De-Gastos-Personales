import type { Metadata } from 'next'
import { Toaster } from 'sileo'
import LayoutShell from '@/components/layout/LayoutShell'
import './globals.css'


export const metadata: Metadata = {
  title: 'Control de Gastos Personales',
  description: 'Aplicación para gestionar tus gastos personales',
  icons: {
    icon: [{ url: '/favicon.ico?v=2', type: 'image/x-icon' }],
    shortcut: [{ url: '/favicon.ico?v=2', type: 'image/x-icon' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <LayoutShell>{children}</LayoutShell>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
