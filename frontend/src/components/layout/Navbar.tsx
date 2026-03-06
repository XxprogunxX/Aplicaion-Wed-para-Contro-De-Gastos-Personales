'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { clearBackendToken } from '@/lib/session';
import type { Usuario } from '@/types';

const navItems = [
	{ href: '/', label: 'Resumen' },
	{ href: '/gastos', label: 'Nuevo gasto' },
	{ href: '/historial', label: 'Historial' },
	{ href: '/presupuestos', label: 'Presupuestos' },
	{ href: '/reportes', label: 'Reportes' },
];

export default function Navbar() {
	const pathname = usePathname();
	const router = useRouter();
	const [profile, setProfile] = useState<Usuario | null>(null);

	useEffect(() => {
		let isMounted = true;

		const loadProfile = async () => {
			try {
				const user = await api.getProfile();
				if (isMounted) {
					setProfile(user);
				}
			} catch {
				if (isMounted) {
					setProfile(null);
				}
			}
		};

		void loadProfile();

		return () => {
			isMounted = false;
		};
	}, []);

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
		<header className="relative border-b border-border bg-surface px-6 py-4 shadow-card" suppressHydrationWarning>
			<Link href="/" aria-label="Ir al dashboard" className="absolute left-6 top-1/2 inline-flex -translate-y-1/2 items-center">
				<Image
					src="/images/logo.png"
					alt="Gastos Personales"
					width={777}
					height={469}
					priority
					className="h-10 w-auto sm:h-12"
				/>
			</Link>
			<div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4" suppressHydrationWarning>
				<p className="font-inter text-[12px] text-text-secondary" suppressHydrationWarning>
					{profile ? `Usuario: ${profile.username}` : 'Usuario: -'}
				</p>
				<nav className="flex flex-wrap items-center gap-2" aria-label="Navegación principal">
					{navItems.map((item) => {
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
				<button
					type="button"
					onClick={handleLogout}
					className="font-inter rounded-theme-sm border border-border bg-surface px-4 py-2 text-ds-secondary font-medium text-text-primary transition-colors duration-200 hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
				>
					Cerrar sesión
				</button>
			</div>
		</header>
	);
}
