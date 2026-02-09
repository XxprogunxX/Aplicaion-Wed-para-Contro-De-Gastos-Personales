import type { Metadata } from 'next'
import { Courier_Prime, Roboto_Mono, Press_Start_2P } from 'next/font/google'
import LayoutShell from '@/components/layout/LayoutShell'
import './globals.css'

const courierPrime = Courier_Prime({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-courier-prime',
})

const robotoMono = Roboto_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-roboto-mono',
})

const pressStart2P = Press_Start_2P({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-press-start',
})

export const metadata: Metadata = {
  title: 'Control de Gastos Personales',
  description: 'Aplicación para gestionar tus gastos personales',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${courierPrime.variable} ${robotoMono.variable} ${pressStart2P.variable}`}>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  )
}
