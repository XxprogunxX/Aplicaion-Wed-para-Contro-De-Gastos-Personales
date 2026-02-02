'use client'

import Link from 'next/link'
import { useMemo, useEffect, useRef } from 'react'
import styles from './not-found.module.css'

interface Star {
  id: number
  left: number
  top: number
  size: number
  opacity: number
  delay: number
}

export default function NotFound() {
  // Generar estrellas
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      delay: Math.random() * 3,
    }))
  }, [])

  // Referencia para el focus trap
  const containerRef = useRef<HTMLDivElement>(null)

  // Anunciar el error 404 a los lectores de pantalla y manejar focus trap
  useEffect(() => {
    // El aria-live se maneja en el JSX, pero también podemos hacer focus en el mensaje principal
    const timer = setTimeout(() => {
      const errorMessage = document.getElementById('error-404-message')
      if (errorMessage) {
        errorMessage.focus()
      }
    }, 100)

    // Focus trap para mantener el focus dentro de la página
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const container = containerRef.current
      if (!container) return

      // Obtener todos los elementos focusables
      const focusableElements = container.querySelectorAll(
        'a, button, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (!firstElement || !lastElement) return

      // Si está en el último elemento y presiona Tab, ir al primero
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      data-404-page
      className={`fixed inset-0 overflow-hidden z-50 ${styles.container}`}
      style={{ 
        fontFamily: 'var(--font-press-start), var(--font-courier-prime), var(--font-roboto-mono), monospace',
        imageRendering: 'pixelated',
      }}
    >
      {/* Fondo espacial con estrellas */}
      <div className={styles.spaceStars}>
        {stars.map((star) => (
          <div
            key={star.id}
            className={styles.star}
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Nebulosas y efectos espaciales */}
      <div className={styles.spaceNebula}>
        <div className={`${styles.nebula} ${styles.nebula1}`} />
        <div className={`${styles.nebula} ${styles.nebula2}`} />
        <div className={`${styles.nebula} ${styles.nebula3}`} />
      </div>

      {/* Menú persistente accesible - Minimalista */}
      <nav 
        aria-label="Navegación principal" 
        className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-sm bg-black/20 border-t border-white/10"
      >
        <ul className={`flex justify-center items-center gap-6 px-4 py-3 ${styles.pixelText}`}>
          <li>
            <Link 
              href="/" 
              className="text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded px-2 py-1 transition-colors text-xs md:text-sm"
              tabIndex={0}
            >
              Inicio
            </Link>
          </li>
          <li>
            <Link 
              href="/gastos" 
              className="text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded px-2 py-1 transition-colors text-xs md:text-sm"
              tabIndex={0}
            >
              Gastos
            </Link>
          </li>
          <li>
            <Link 
              href="/presupuestos" 
              className="text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded px-2 py-1 transition-colors text-xs md:text-sm"
              tabIndex={0}
            >
              Presupuestos
            </Link>
          </li>
          <li>
            <Link 
              href="/reportes" 
              className="text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded px-2 py-1 transition-colors text-xs md:text-sm"
              tabIndex={0}
            >
              Reportes
            </Link>
          </li>
        </ul>
      </nav>

      {/* Anuncio para lectores de pantalla */}
      <div 
        id="aria-live-announcement"
        aria-live="assertive" 
        aria-atomic="true"
        className={styles.srOnly}
      >
        Error 404. Página no encontrada
      </div>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="relative z-20 px-4 pt-4">
        <ol className={`flex items-center space-x-2 text-sm text-white/80 ${styles.pixelText}`}>
          <li>
            <Link 
              href="/" 
              className="hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent rounded px-2 py-1 transition-colors"
              tabIndex={0}
            >
              Inicio
            </Link>
          </li>
          <li aria-hidden="true" className="text-white/60">/</li>
          <li className="text-white" aria-current="page">
            Error 404
          </li>
        </ol>
      </nav>

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center justify-center h-screen px-4 py-12">
        {/* Header/Título */}
        <h1 
          id="error-404-message"
          className={`text-white text-center mb-8 md:mb-12 text-xl md:text-3xl lg:text-4xl font-bold tracking-wider px-4 ${styles.pixelText}`}
          tabIndex={-1}
        >
          PARECE QUE HAS CAÍDO EN UN AGUJERO NEGRO EN EL ESPACIO
        </h1>

        {/* Elemento central: 404 con nave espacial */}
        <div className="flex items-center justify-center gap-2 md:gap-4 lg:gap-6 mb-8 md:mb-12">
          {/* Número 4 izquierdo */}
          <div className="text-white">
            <PixelNumber4 size="large" />
          </div>

          {/* Nave espacial en el medio */}
          <div className="flex-shrink-0 mx-2 md:mx-4">
            <RocketShip />
          </div>

          {/* Número 4 derecho */}
          <div className="text-white">
            <PixelNumber4 size="large" />
          </div>
        </div>

        {/* Texto descriptivo */}
        <p className={`text-white text-center mb-8 md:mb-12 text-sm md:text-base lg:text-lg max-w-2xl px-4 leading-relaxed ${styles.pixelText}`}>
          404 – Esta página no existe. ¿Quieres volver al inicio?
        </p>

        {/* Botón */}
        <Link href="/">
          <button 
            className={`${styles.pixelButton} focus:outline-none focus:ring-4 focus:ring-white focus:ring-offset-4 focus:ring-offset-transparent`}
            tabIndex={0}
            aria-label="Volver a la página de inicio"
          >
            VOLVER AL INICIO
          </button>
        </Link>
      </div>
    </div>
  )
}

// Componente para el número 4 en pixel art mejorado
function PixelNumber4({ size = 'large' }: { size?: 'large' | 'medium' | 'small' }) {
  const sizeClasses = {
    large: 'text-7xl md:text-9xl lg:text-[12rem]',
    medium: 'text-5xl md:text-7xl',
    small: 'text-3xl md:text-5xl'
  }

  return (
    <div 
      className={`${sizeClasses[size]} font-bold ${styles.pixelNumber}`}
      style={{
        fontFamily: 'var(--font-press-start), var(--font-courier-prime), monospace',
        letterSpacing: '0.05em',
        lineHeight: '1',
      }}
    >
      4
    </div>
  )
}

// Componente para la nave espacial usando la imagen proporcionada
function RocketShip() {
  return (
    <div 
      className={styles.rocketContainer}
    >
      <div className={styles.rocketGlow} />
      <img
        src="/images/onmi-removebg-preview.png"
        alt="Nave espacial pixel art"
        className={styles.rocketImage}
      />
    </div>
  )
}
