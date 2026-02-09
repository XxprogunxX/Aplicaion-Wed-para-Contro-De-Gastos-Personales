export function formatCurrency(amount: number, locale = 'es-MX', currency = 'MXN') {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function formatDate(date: Date | string) {
	const value = typeof date === 'string' ? new Date(date) : date;
	return new Intl.DateTimeFormat('es-MX', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	}).format(value);
}

export function formatDateShort(date: Date | string) {
	const value = typeof date === 'string' ? new Date(date) : date;
	return new Intl.DateTimeFormat('es-MX', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	}).format(value);
}

export function getCurrentMonth() {
	return new Date().getMonth() + 1;
}

export function getCurrentYear() {
	return new Date().getFullYear();
}

export function getMonthName(month: number) {
	const date = new Date(2000, Math.max(0, month - 1), 1);
	return new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(date);
}

export function isValidEmail(email: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function generateRandomColor() {
	const hue = Math.floor(Math.random() * 360);
	return `hsl(${hue}, 65%, 70%)`;
}

export function calculatePercentage(part: number, total: number) {
	if (!total) return 0;
	return Math.round((part / total) * 100);
}

export function truncateText(text: string, maxLength: number) {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength).trim()}...`;
}
