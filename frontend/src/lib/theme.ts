/**
 * Fintech design system – single source of truth for colors and tokens.
 * Use these constants in components and extend Tailwind from this file.
 * No inline hardcoded colors; keep the system scalable.
 */

export const theme = {
  colors: {
    primary: '#2563EB',
    primaryHover: '#1d4ed8',
    success: '#16A34A',
    successHover: '#15803d',
    warning: '#F59E0B',
    warningHover: '#d97706',
    error: '#DC2626',
    errorHover: '#b91c1c',
    background: '#F9FAFB',
    surface: '#ffffff',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
  },
  shadow: {
    soft: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
    softHover: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  },
  spacing: {
    /** 8px grid */
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
} as const;

export const chartSegmentColors = {
  neutral: theme.colors.textSecondary,
  neutralHover: theme.colors.text,
} as const;

type DonutCategoryColor = {
  color: string;
  hover: string;
};

/** Unique palette per category to avoid repeated colors in the donut legend. */
export const donutCategoryColors: Record<string, DonutCategoryColor> = {
  'gastos financieros': { color: '#4F46E5', hover: '#4338CA' },
  alimentacion: { color: '#F59E0B', hover: '#D97706' },
  alimentos: { color: '#F59E0B', hover: '#D97706' },
  comida: { color: '#F59E0B', hover: '#D97706' },
  bebidas: { color: '#06B6D4', hover: '#0891B2' },
  bebida: { color: '#06B6D4', hover: '#0891B2' },
  'comida y bebida': { color: '#F59E0B', hover: '#D97706' },
  transporte: { color: '#2563EB', hover: '#1D4ED8' },
  servicios: { color: '#0D9488', hover: '#0F766E' },
  salud: { color: '#DC2626', hover: '#B91C1C' },
  vivienda: { color: '#64748B', hover: '#475569' },
  entretenimiento: { color: '#DB2777', hover: '#BE185D' },
  'vida y entretenimiento': { color: '#DB2777', hover: '#BE185D' },
  videojuegos: { color: '#65A30D', hover: '#4D7C0F' },
  educacion: { color: '#7C3AED', hover: '#6D28D9' },
  ahorro: { color: '#16A34A', hover: '#15803D' },
  deudas: { color: '#EA580C', hover: '#C2410C' },
  suscripciones: { color: '#0284C7', hover: '#0369A1' },
  otros: { color: '#94A3B8', hover: '#64748B' },
};

const donutFallbackPalette: DonutCategoryColor[] = [
  { color: '#2563EB', hover: '#1D4ED8' },
  { color: '#16A34A', hover: '#15803D' },
  { color: '#F59E0B', hover: '#D97706' },
  { color: '#DC2626', hover: '#B91C1C' },
  { color: '#4F46E5', hover: '#4338CA' },
  { color: '#0D9488', hover: '#0F766E' },
  { color: '#DB2777', hover: '#BE185D' },
  { color: '#EA580C', hover: '#C2410C' },
  { color: '#7C3AED', hover: '#6D28D9' },
  { color: '#0284C7', hover: '#0369A1' },
  { color: '#65A30D', hover: '#4D7C0F' },
  { color: '#475569', hover: '#334155' },
];

function normalizeCategoryName(categoryName: string): string {
  return categoryName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getFallbackColor(categoryName: string): DonutCategoryColor {
  let hash = 0;

  for (let index = 0; index < categoryName.length; index += 1) {
    hash = (hash * 31 + categoryName.charCodeAt(index)) >>> 0;
  }

  return donutFallbackPalette[hash % donutFallbackPalette.length];
}

export function getDonutSegmentColor(
  categoryName: string,
  hover = false
): string {
  const normalizedCategory = normalizeCategoryName(categoryName || '');
  if (!normalizedCategory) {
    return hover ? chartSegmentColors.neutralHover : chartSegmentColors.neutral;
  }

  const token = donutCategoryColors[normalizedCategory] ?? getFallbackColor(normalizedCategory);
  return hover ? token.hover : token.color;
}

export type Theme = typeof theme;
