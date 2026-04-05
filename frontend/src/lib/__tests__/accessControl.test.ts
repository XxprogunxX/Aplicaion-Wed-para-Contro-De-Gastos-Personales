import { canAccessRoute, hasPermission } from '@/lib/accessControl';

describe('accessControl', () => {
  it('redirige a login cuando no hay sesion y la ruta es privada', () => {
    const decision = canAccessRoute('/presupuestos', null, false);

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('no-session');
    expect(decision.redirectTo).toBe('/auth/login');
  });

  it('permite rutas de auth cuando no hay sesion', () => {
    const decision = canAccessRoute('/auth/login', null, false);

    expect(decision.allowed).toBe(true);
    expect(decision.reason).toBe('ok');
  });

  it('redirige a acceso denegado cuando user navega a configuracion', () => {
    const decision = canAccessRoute('/configuracion', 'user', true);

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('forbidden');
    expect(decision.redirectTo).toBe('/acceso-denegado');
  });

  it('permite configuracion cuando el rol es admin', () => {
    const decision = canAccessRoute('/configuracion', 'admin', true);

    expect(decision.allowed).toBe(true);
    expect(decision.reason).toBe('ok');
  });

  it('valida permisos por rol', () => {
    expect(hasPermission('admin', 'settings:view')).toBe(true);
    expect(hasPermission('admin', 'categories:manage')).toBe(true);
    expect(hasPermission('user', 'settings:view')).toBe(false);
    expect(hasPermission('user', 'categories:manage')).toBe(false);
  });
});
