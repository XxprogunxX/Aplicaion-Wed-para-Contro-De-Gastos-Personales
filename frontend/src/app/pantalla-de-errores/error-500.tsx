'use client'

import Link from 'next/link'
import { useEffect, useRef, useMemo } from 'react'
import styles from './error-500.module.css'

interface Star {
  id: number
  left: number
  top: number
  size: number
  opacity: number
  delay: number
}

export default function Error500() {
  const containerRef = useRef<HTMLDivElement>(null)
  const breadcrumbRef = useRef<HTMLUListElement>(null)

  // Generate stars for space background
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

  // Focus trap similar al 404
  useEffect(() => {
    const container = containerRef.current
    const timer = setTimeout(() => {
      const title = document.getElementById('error-500-title')
      if (title) title.focus()
    }, 100)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (!container) return
        const focusable = container.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])')
        const first = focusable[0] as HTMLElement
        const last = focusable[focusable.length - 1] as HTMLElement
        if (!first || !last) return
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus() }
        }
      }

      // Breadcrumb keyboard navigation (Left/Right)
      if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && document.activeElement && breadcrumbRef.current && breadcrumbRef.current.contains(document.activeElement)) {
        e.preventDefault()
        const items = Array.from(breadcrumbRef.current.querySelectorAll('a')) as HTMLElement[]
        const idx = items.indexOf(document.activeElement as HTMLElement)
        if (idx === -1) return
        if (e.key === 'ArrowRight') {
          const next = items[(idx + 1) % items.length]
          next.focus()
        } else {
          const prev = items[(idx - 1 + items.length) % items.length]
          prev.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => { clearTimeout(timer); document.removeEventListener('keydown', handleKeyDown) }
  }, [])

  return (
    <div ref={containerRef} className={`${styles.container}`} role="application" aria-labelledby="error-500-title">
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

      {/* aria-live para lectores de pantalla */}
      <div id="aria-live-500" className={styles.srOnly} aria-live="assertive" aria-atomic="true">Error 500. Error interno del servidor</div>

      {/* Menú persistente (minimalista, integrado) */}
      <nav aria-label="Navegación principal" className={styles.persistentMenu}>
        <ul className={styles.menuList}>
          <li><Link href="/" className={styles.menuLink}>Inicio</Link></li>
          <li><Link href="/gastos" className={styles.menuLink}>Gastos</Link></li>
          <li><Link href="/presupuestos" className={styles.menuLink}>Presupuestos</Link></li>
          <li><Link href="/reportes" className={styles.menuLink}>Reportes</Link></li>
        </ul>
      </nav>

      <main className={styles.layout}>
        <section className={styles.left}>
          {/* Breadcrumbs con soporte por teclado */}
          <nav aria-label="Breadcrumb" className={styles.breadcrumbNav}>
            <ol ref={breadcrumbRef as any} className={styles.breadcrumbList}>
              <li>
                <Link href="/" className={styles.breadcrumbLink} tabIndex={0}>Inicio</Link>
              </li>
              <li aria-hidden="true" className={styles.separator}>/</li>
              <li aria-current="page" className={styles.current}>Error 500</li>
            </ol>
          </nav>

          <h1 id="error-500-title" tabIndex={-1} className={styles.title}>Error Interno del Servidor — 500</h1>
          <p className={styles.description}>Parece que tuvimos un problema con el servidor. No te preocupes — estamos enviando ayuda para que todo vuelva a la normalidad.</p>

          <div className={styles.actions}>
            <Link href="/">
              <button className={styles.primaryButton} aria-label="Volver al inicio">Volver al inicio</button>
            </Link>
            <Link href="/" className={styles.secondaryLink}>Intentar más tarde</Link>
          </div>
        </section>

        <aside className={styles.right} aria-hidden="true">
          {/* Imagen removida por petición; se mantiene un elemento decorativo en su lugar */}
          <div className={styles.astro} aria-hidden="true" />
        </aside>
      </main>
    </div>
  )
}
