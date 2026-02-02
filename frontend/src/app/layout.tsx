import type { Metadata } from 'next'
import { Courier_Prime, Roboto_Mono, Press_Start_2P } from 'next/font/google'
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
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Control de Gastos Personales
              </h1>
            </div>
          </header>
          <main>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
