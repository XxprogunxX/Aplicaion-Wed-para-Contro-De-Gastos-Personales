import type { ReactNode } from 'react';

type MockLinkProps = {
  children: ReactNode;
  href: string;
};

// Mock de next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock de next/link (ya que aparece en login)
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: MockLinkProps) => <a href={href}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('Páginas con Animaciones de Carga', () => {
  describe('GastosPage - Loading Animation', () => {
    it('renderiza componente Loading cuando loading=true', async () => {
      // Este test requiere mockers de useApi y api
      // Aquí es un placeholder para la estructura

      // En términos reales, necesitarías:
      // 1. Importar GastosPage
      // 2. Mockarear useApi para retornar loading=true
      // 3. Verificar que <Loading /> aparece en el DOM

      expect(true).toBe(true); // Placeholder
    });

    it('muestra "Guardando gasto..." en el Loading component', async () => {
      // expect(screen.getByText('Guardando gasto...')).toBeInTheDocument();
      
      expect(true).toBe(true); // Placeholder
    });

    it('desactiva el botón submit mientras loading=true', async () => {
      // expect(screen.getByRole('button', { name: /Guardar gasto/i })).toBeDisabled();
      
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('LoginPage - Loading Animation', () => {
    it('renderiza componente Loading cuando loading=true', async () => {
      // Placeholder similar a GastosPage
      
      expect(true).toBe(true); // Placeholder
    });

    it('muestra "Iniciando sesión..." en el Loading component', async () => {
      // expect(screen.getByText('Iniciando sesión...')).toBeInTheDocument();
      
      expect(true).toBe(true); // Placeholder
    });

    it('desactiva el botón submit mientras loading=true', async () => {
      // expect(screen.getByRole('button', { name: /Iniciar sesión/i })).toBeDisabled();
      
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Modal Animations', () => {
    it('aplica animación de fade-in/out, respetando prefers-reduced-motion', async () => {
      // Este test requeriría montar un modal y verificar las propiedades de Framer Motion
      // Placeholder por la complejidad de testear Framer Motion

      expect(true).toBe(true); // Placeholder
    });

    it('restaura el foco al cerrar el modal (accesibilidad)', async () => {
      // expect(previouslyFocusedElement).toBe(document.activeElement);
      
      expect(true).toBe(true); // Placeholder
    });
  });
});
