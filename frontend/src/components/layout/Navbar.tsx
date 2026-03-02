'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
	{ href: '/', label: 'Dashboard' },
	{ href: '/gastos', label: 'Nuevo gasto' },
	{ href: '/historial', label: 'Historial' },
	{ href: '/presupuestos', label: 'Presupuestos' },
	{ href: '/reportes', label: 'Reportes' },
];

export default function Navbar() {
	const pathname = usePathname();
	const router = useRouter();

	const handleLogout = () => {
		localStorage.removeItem('token');
		router.push('/auth/login');
	};

	return (
		<header className="border-b border-border bg-surface px-6 py-4 shadow-card" suppressHydrationWarning>
			<div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4" suppressHydrationWarning>
				<div className="font-inter text-ds-secondary font-semibold text-text-primary">LOGO</div>
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
