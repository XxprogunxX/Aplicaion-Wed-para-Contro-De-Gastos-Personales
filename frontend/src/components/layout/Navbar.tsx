'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { hasPermission } from '@/lib/accessControl';
import { clearBackendToken, getBackendUserRole } from '@/lib/session';
import { SESSION_EXPIRED_EVENT } from '@/lib/utils';
import type { Usuario } from '@/types';

const navItems = [
	{ href: '/', label: 'Resumen' },
	{ href: '/gastos', label: 'Nuevo gasto' },
	{ href: '/historial', label: 'Historial' },
	{ href: '/presupuestos', label: 'Presupuestos' },
	{ href: '/reportes', label: 'Reportes' },
	{ href: '/configuracion', label: 'Configuración', permission: 'settings:view' as const },
];

export default function Navbar() {
	const pathname = usePathname();
	const router = useRouter();
	const [profile, setProfile] = useState<Usuario | null>(null);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isSessionExpired, setIsSessionExpired] = useState(false);
	const currentRole = profile?.role || getBackendUserRole();
	const visibleNavItems = navItems.filter((item) => {
		if (!item.permission) {
			return true;
		}

		return hasPermission(currentRole, item.permission);
	});

	useEffect(() => {
		let isMounted = true;

		const loadProfile = async () => {
			try {
				const user = await api.getProfile();
				if (isMounted) {
					setProfile(user);
				}
			} catch (error) {
				if (isMounted) {
					setProfile(null);
					// Si hay error 401, la sesión ya fue manejada por el interceptor
				}
			}
		};

		void loadProfile();

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		const handleSessionExpired = () => {
			setIsSessionExpired(true);
			setProfile(null);
		};

		window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

		return () => {
			window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
		};
	}, []);

	useEffect(() => {
		setIsMenuOpen(false);
	}, [pathname]);

	const handleLogout = async () => {
		try {
			await api.logout();
		} catch {
			// Si expiro la sesion en backend, igual limpiamos token local.
		}

		clearBackendToken();
		router.replace('/auth/login');
	};

	return (
		<header className="border-b border-border bg-surface px-4 py-4 shadow-card sm:px-6" suppressHydrationWarning>
			<div className="mx-auto w-full max-w-6xl" suppressHydrationWarning>
				<div className="flex items-center gap-3 lg:gap-6">
					<Link href="/" aria-label="Ir al dashboard" className="inline-flex shrink-0 items-center">
						<Image
							src="/images/logo.png"
							alt="Gastos Personales"
							width={777}
							height={469}
							priority
							className="h-9 w-auto sm:h-10 lg:h-11"
						/>
					</Link>

					<nav className="hidden flex-1 items-center gap-2 lg:flex" aria-label="Navegación principal">
						{visibleNavItems.map((item) => {
							const isActive = pathname === item.href;
							return (
								<Link
									key={item.href}
									href={item.href}
									className={`font-inter rounded-theme-sm px-4 py-2 text-ds-secondary font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
										isActive
											? 'bg-primary text-white shadow-card'
											: 'text-text-secondary hover:bg-background hover:text-text-primary'
									}`}
								>
									{item.label}
								</Link>
							);
						})}
					</nav>

					<div className="ml-auto hidden items-center gap-4 lg:flex">
						<p className="font-inter text-[12px] text-text-secondary" suppressHydrationWarning>
							{isSessionExpired ? 'Sesión expirada' : profile ? `Usuario: ${profile.username}` : 'Usuario: -'}
						</p>
						<button
							type="button"
							onClick={handleLogout}
							className="font-inter rounded-theme-sm border border-border bg-surface px-4 py-2 text-ds-secondary font-medium text-text-primary transition-colors duration-200 hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
						>
							Cerrar sesión
						</button>
					</div>

					<button
						type="button"
						onClick={() => setIsMenuOpen((prev) => !prev)}
						className="font-inter ml-auto inline-flex rounded-theme-sm border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-primary transition-colors duration-200 hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 lg:hidden"
						aria-expanded={isMenuOpen}
						aria-controls="navbar-mobile-menu"
					>
						{isMenuOpen ? 'Cerrar menu' : 'Menu'}
					</button>
				</div>

				<div
					id="navbar-mobile-menu"
					className={`overflow-hidden transition-[max-height,opacity,margin] duration-200 ease-out lg:hidden ${
						isMenuOpen ? 'mt-3 max-h-[30rem] opacity-100' : 'mt-0 max-h-0 opacity-0'
					}`}
				>
					<div className="rounded-theme-md border border-border bg-background p-3">
						<p className="font-inter text-[12px] text-text-secondary" suppressHydrationWarning>
							{isSessionExpired ? 'Sesión expirada' : profile ? `Usuario: ${profile.username}` : 'Usuario: -'}
						</p>
						<nav className="mt-3 grid grid-cols-2 gap-2" aria-label="Navegación principal móvil">
							{visibleNavItems.map((item) => {
								const isActive = pathname === item.href;
								return (
									<Link
										key={item.href}
										href={item.href}
										onClick={() => setIsMenuOpen(false)}
										className={`font-inter w-full rounded-theme-sm px-3 py-2 text-center text-ds-secondary font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
											isActive
												? 'bg-primary text-white shadow-card'
												: 'text-text-secondary hover:bg-surface hover:text-text-primary'
										}`}
									>
										{item.label}
									</Link>
								);
							})}
						</nav>
						<button
							type="button"
							onClick={handleLogout}
							className="font-inter mt-3 w-full rounded-theme-sm border border-border bg-surface px-4 py-2 text-ds-secondary font-medium text-text-primary transition-colors duration-200 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
						>
							Cerrar sesión
						</button>
					</div>
				</div>
			</div>
		</header>
	);
}
