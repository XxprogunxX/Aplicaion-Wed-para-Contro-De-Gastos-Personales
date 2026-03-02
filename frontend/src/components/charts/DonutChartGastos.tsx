'use client';

import { useMemo, useCallback, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Sector,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { theme, getDonutSegmentColor } from '@/lib/theme';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface DonutChartGastosDato {
  name: string;
  value: number;
}

function formatMxn(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Scale font size so two-line label stays within innerRadius (avoid overflow) */
function scaledFontSize(innerRadiusPx: number, ratio: number): number {
  const max = innerRadiusPx * ratio;
  return Math.min(Math.floor(max), 24);
}

interface DonutChartGastosProps {
  data: DonutChartGastosDato[];
}

export function DonutChartGastos({ data }: DonutChartGastosProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data]
  );

  const dataWithColor = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        color: getDonutSegmentColor(item.name, false),
        colorHover: getDonutSegmentColor(item.name, true),
      })),
    [data]
  );

  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const renderCenterLabel = useCallback(
    (props: {
      cx: number;
      cy: number;
      innerRadius?: number | string;
      index?: number;
    }) => {
      const { cx, cy, index = 0 } = props;
      if (index !== 0) return null;

      const rawInner = props.innerRadius;
      const innerPx =
        typeof rawInner === 'number' ? rawInner : 80;
      const fontSizeLabel = scaledFontSize(innerPx, 0.2);
      const fontSizeValue = scaledFontSize(innerPx, 0.28);
      const lineGap = fontSizeValue * 0.4;
      const totalFormatted = `MXN ${total.toLocaleString('es-MX')}`;

      return (
        <g role="img" aria-label={`Todos. ${totalFormatted}`}>
          <text
            x={cx}
            y={cy}
            dy={-lineGap}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={theme.colors.textSecondary}
            fontSize={fontSizeLabel}
            fontFamily="var(--font-inter), ui-sans-serif, sans-serif"
            fontWeight={400}
          >
            Todos
          </text>
          <text
            x={cx}
            y={cy}
            dy={lineGap}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={theme.colors.text}
            fontSize={fontSizeValue}
            fontFamily="var(--font-inter), ui-sans-serif, sans-serif"
            fontWeight={600}
          >
            {totalFormatted}
          </text>
        </g>
      );
    },
    [total]
  );

  const renderActiveShape = useCallback(
    (props: unknown) => {
      const sectorProps = props as { fill?: string; index?: number; [k: string]: unknown };
      const entry =
        typeof sectorProps.index === 'number' ? dataWithColor[sectorProps.index] : undefined;
      const hoverFill = entry?.colorHover ?? sectorProps.fill;
      return <Sector {...sectorProps} fill={hoverFill} stroke="none" />;
    },
    [dataWithColor]
  );

  if (data.length === 0) {
    return (
      <div className="flex min-h-[280px] w-full items-center justify-center rounded-theme-lg border border-border bg-background">
        <p className="font-inter text-ds-secondary text-text-secondary">
          No hay datos para mostrar
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 text-center">
        <p className="font-inter text-ds-secondary font-medium text-text-secondary">
          Total
        </p>
        <p className="font-inter text-ds-h2 font-semibold tabular-nums text-text-primary">
          {formatMxn(total)}
        </p>
      </div>

      <div
        className="relative w-full rounded-theme-lg"
        style={{ minHeight: 280, backgroundColor: theme.colors.background }}
      >
        <ResponsiveContainer width="100%" height={280}>
          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Pie
              data={dataWithColor}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
              isAnimationActive={!prefersReducedMotion}
              animationDuration={prefersReducedMotion ? 0 : 220}
              animationBegin={0}
              label={renderCenterLabel}
              activeIndex={prefersReducedMotion ? undefined : activeIndex}
              activeShape={prefersReducedMotion ? undefined : renderActiveShape}
              onMouseEnter={
                prefersReducedMotion
                  ? undefined
                  : (_, index) => setActiveIndex(index)
              }
              onMouseLeave={
                prefersReducedMotion
                  ? undefined
                  : () => setActiveIndex(undefined)
              }
            >
              {dataWithColor.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatMxn(value), '']}
              contentStyle={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 8,
                fontFamily: 'var(--font-inter), sans-serif',
                fontSize: 14,
                color: theme.colors.text,
              }}
              labelStyle={{ color: theme.colors.text, fontWeight: 600 }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: 16 }}
              iconType="circle"
              iconSize={10}
              formatter={(value) => (
                <span className="font-inter text-ds-secondary text-text-primary">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ——— Ejemplo de uso con datos mock ———
export const DONUT_CHART_GASTOS_MOCK: DonutChartGastosDato[] = [
  { name: 'Gastos financieros', value: 12500 },
  { name: 'Comida y Bebida', value: 8300 },
  { name: 'Vida y entretenimiento', value: 4200 },
];
