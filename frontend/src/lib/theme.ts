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

/** Map category name → segment role (primary | success | warning). Others use neutral. */
export const donutCategoryToRole: Record<string, 'primary' | 'success' | 'warning'> = {
  'Gastos financieros': 'primary',
  'Comida y Bebida': 'warning',
  'Vida y entretenimiento': 'success',
};

export function getDonutSegmentColor(
  categoryName: string,
  hover = false
): string {
  const role = donutCategoryToRole[categoryName] ?? 'neutral';
  const key = hover ? `${role}Hover` : role;
  const colors = chartSegmentColors as Record<string, string>;
  return colors[key] ?? (hover ? chartSegmentColors.neutralHover : chartSegmentColors.neutral);
}

export type Theme = typeof theme;
