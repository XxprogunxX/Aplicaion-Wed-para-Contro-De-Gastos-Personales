import React from 'react';

interface LoadingProps {
	size?: 'sm' | 'md' | 'lg';
	text?: string;
}

const sizeMap = {
	sm: 'h-4 w-4 border-2',
	md: 'h-6 w-6 border-2',
	lg: 'h-10 w-10 border-4',
};

export default function Loading({ size = 'md', text = 'Cargando...' }: LoadingProps) {
	return (
		<div className="flex items-center gap-3 text-sm text-slate-600">
			<span
				className={`motion-safe:animate-spin rounded-full border-slate-300 border-t-slate-600 ${sizeMap[size]}`}
				role="status"
				aria-label={text}
			/>
			<span>{text}</span>
		</div>
	);
}
