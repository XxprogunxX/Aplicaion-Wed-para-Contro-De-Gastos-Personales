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
		<header className="bg-slate-200 px-6 py-4 text-slate-700" suppressHydrationWarning>
			<div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4" suppressHydrationWarning>
				<div className="text-sm font-semibold">LOGO</div>
				<nav className="flex flex-wrap items-center gap-3 text-sm">
					{navItems.map((item) => {
						const isActive = pathname === item.href;
						return (
							<Link
								key={item.href}
								href={item.href}
								className={`rounded-full px-3 py-1.5 transition ${
									isActive
										? 'bg-slate-300 text-slate-800'
										: 'text-slate-600 hover:bg-slate-300/70'
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
					className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700"
				>
					Cerrar sesion
				</button>
			</div>
		</header>
	);
}
