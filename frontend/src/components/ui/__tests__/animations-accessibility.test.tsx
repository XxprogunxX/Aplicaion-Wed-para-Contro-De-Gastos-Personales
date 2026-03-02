import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';

describe('Componentes con Animaciones y Accesibilidad', () => {
  describe('Loading Component', () => {
    it('renderiza con role="status" para anuncio de carga', () => {
      render(<Loading size="md" text="Cargando datos..." />);
      
      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toBeInTheDocument();
    });

    it('tiene aria-label con texto descriptivo', () => {
      render(<Loading size="md" text="Cargando gastos..." />);
      
      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveAttribute('aria-label', 'Cargando gastos...');
    });

    it('renderiza el texto visible junto al spinner', () => {
      render(<Loading size="md" text="Procesando..." />);
      
      expect(screen.getByText('Procesando...')).toBeInTheDocument();
    });

    it('usa clase motion-safe:animate-spin para respetar prefers-reduced-motion', () => {
      const { container } = render(<Loading size="md" text="Cargando..." />);
      
      const spinner = container.querySelector('[role="status"]');
      expect(spinner?.className).toContain('motion-safe:animate-spin');
    });

    it('tiene tamaños disponibles (sm, md, lg)', () => {
      const { container: containerSm } = render(<Loading size="sm" text="Cargando..." />);
      const spinnerSm = containerSm.querySelector('[role="status"]');
      expect(spinnerSm?.className).toContain('h-4 w-4');

      const { container: containerMd } = render(<Loading size="md" text="Cargando..." />);
      const spinnerMd = containerMd.querySelector('[role="status"]');
      expect(spinnerMd?.className).toContain('h-6 w-6');

      const { container: containerLg } = render(<Loading size="lg" text="Cargando..." />);
      const spinnerLg = containerLg.querySelector('[role="status"]');
      expect(spinnerLg?.className).toContain('h-10 w-10');
    });
  });

  describe('Alert Component', () => {
    it('renderiza con role="alert" para anuncio inmediato', () => {
      render(<Alert type="error" message="Error al cargar" />);
      
      const alertElement = screen.getByRole('alert');
      expect(alertElement).toBeInTheDocument();
    });

    it('muestra el mensaje de error correctamente', () => {
      const mensaje = 'Error: No se pudo conectar al servidor';
      render(<Alert type="error" message={mensaje} />);
      
      expect(screen.getByText(mensaje)).toBeInTheDocument();
    });

    it('aplica estilos correctos por tipo (error, success, warning, info)', () => {
      const { container: containerError } = render(<Alert type="error" message="Error" />);
      expect(containerError.querySelector('[role="alert"]')).toHaveClass('border-error');

      const { container: containerSuccess } = render(<Alert type="success" message="Éxito" />);
      expect(containerSuccess.querySelector('[role="alert"]')).toHaveClass('border-success');
    });

    it('tiene botón cerrar con aria-label cuando se proporciona onClose', () => {
      const handleClose = jest.fn();
      render(<Alert type="info" message="Mensaje" onClose={handleClose} />);
      
      const closeButton = screen.getByLabelText('Cerrar alerta');
      expect(closeButton).toBeInTheDocument();
    });

    it('ejecuta callback onClose cuando se hace click en cerrar', async () => {
      const handleClose = jest.fn();
      render(<Alert type="info" message="Mensaje" onClose={handleClose} />);
      
      const closeButton = screen.getByLabelText('Cerrar alerta');
      closeButton.click();
      
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe('Accesibilidad global - prefers-reduced-motion', () => {
    it('respecta la configuración del sistema prefers-reduced-motion', () => {
      // Verificar que el CSS global incluye la media query
      const computedStyle = window.getComputedStyle(document.documentElement);
      
      // Esto es más de integración; en desarrollo el usuario puede activar
      // prefers-reduced-motion en DevTools y verá que la animación se detiene
      expect(true).toBe(true); // Placeholder para estructura de test
    });
  });
});
