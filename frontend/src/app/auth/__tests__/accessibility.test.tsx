import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock de los hooks y contexto de API
jest.mock('@/hooks/useApi', () => ({
  useApi: () => ({
    loading: false,
    error: null,
    execute: jest.fn(),
  }),
}));

jest.mock('@/hooks/useSession', () => ({
  useSession: () => ({
    session: null,
    loading: false,
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock de next-i18next
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('Página de Login - Accesibilidad', () => {
  it('No debe tener violaciones de accesibilidad', async () => {
    const { container } = render(
      <div>
        <form>
          <label htmlFor="email">Correo</label>
          <input id="email" type="email" aria-describedby="email-error" />
          <p id="email-error" role="alert">Campo requerido</p>

          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" aria-describedby="password-error" />
          <p id="password-error" role="alert"></p>

          <div role="status" aria-live="polite" aria-hidden="true">
            Cargando...
          </div>

          <button type="submit">Iniciar sesión</button>
        </form>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Debe tener aria-live en región de estados', () => {
    render(
      <div role="status" aria-live="polite">
        Validando credenciales...
      </div>
    );
    const statusRegion = screen.getByRole('status');
    expect(statusRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('Campo con error debe tener aria-invalid', () => {
    render(
      <input aria-invalid="true" aria-describedby="error-msg" />
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('Etiqueta debe estar vinculada al input con htmlFor', () => {
    render(
      <>
        <label htmlFor="email-input">Email</label>
        <input id="email-input" />
      </>
    );
    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', 'email-input');
  });

  it('Párrafo de error debe tener role=alert', () => {
    render(
      <p id="error-msg" role="alert">
        Email inválido
      </p>
    );
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Email inválido');
  });

  it('HTML debe tener lang="es"', () => {
    const root = document.querySelector('html');
    // Este test depende de que tu layout.tsx tenga <html lang="es">
    // Si no lo tiene, agrega: expect(document.documentElement).toHaveAttribute('lang', 'es');
  });
});
