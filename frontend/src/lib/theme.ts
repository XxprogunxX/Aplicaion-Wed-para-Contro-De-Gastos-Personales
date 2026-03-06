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

/** Chart segment colors by role (for donut/pie). Use Primary, Success, Warning. */
export const chartSegmentColors = {
  primary: theme.colors.primary,
  primaryHover: theme.colors.primaryHover,
  success: theme.colors.success,
  successHover: theme.colors.successHover,
  warning: theme.colors.warning,
  warningHover: theme.colors.warningHover,
  /** Fallback for unknown categories */
  neutral: theme.colors.textSecondary,
  neutralHover: theme.colors.text,
} as const;

type DonutColorRole = 'primary' | 'success' | 'warning';

/** Map normalized category name -> segment role. */
export const donutCategoryToRole: Record<string, DonutColorRole> = {
  'gastos financieros': 'primary',
  alimentacion: 'warning',
  alimentos: 'warning',
  comida: 'warning',
  'comida y bebida': 'warning',
  'vida y entretenimiento': 'success',
  entretenimiento: 'success',
  servicios: 'success',
  salud: 'success',
  transporte: 'primary',
  vivienda: 'primary',
  educacion: 'warning',
  ahorro: 'success',
  deudas: 'warning',
  suscripciones: 'primary',
  otros: 'warning',
  videojuegos: 'success',
};

const donutFallbackRoles: DonutColorRole[] = ['primary', 'success', 'warning'];

function normalizeCategoryName(categoryName: string): string {
  return categoryName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getFallbackRole(categoryName: string): DonutColorRole {
  let hash = 0;

  for (let index = 0; index < categoryName.length; index += 1) {
    hash = (hash * 31 + categoryName.charCodeAt(index)) >>> 0;
  }

  return donutFallbackRoles[hash % donutFallbackRoles.length];
}

export function getDonutSegmentColor(
  categoryName: string,
  hover = false
): string {
  const normalizedCategory = normalizeCategoryName(categoryName || '');
  const role = normalizedCategory
    ? (donutCategoryToRole[normalizedCategory] ?? getFallbackRole(normalizedCategory))
    : 'neutral';
  const key = hover ? `${role}Hover` : role;
  const colors = chartSegmentColors as Record<string, string>;
  return colors[key] ?? (hover ? chartSegmentColors.neutralHover : chartSegmentColors.neutral);
}

export type Theme = typeof theme;
