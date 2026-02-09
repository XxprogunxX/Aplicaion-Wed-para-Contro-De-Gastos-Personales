// Importar extensiones para Testing Library
import '@testing-library/jest-dom';

// Extender expect con jest-axe
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

// Mock para next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock para next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));