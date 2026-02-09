import React from 'react';

interface CardProps {
	title?: string;
	className?: string;
	children: React.ReactNode;
}

export default function Card({ title, className = '', children }: CardProps) {
	return (
		<div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
			{title && <h3 className="mb-4 text-base font-semibold text-slate-800">{title}</h3>}
			<div>{children}</div>
		</div>
	);
}
