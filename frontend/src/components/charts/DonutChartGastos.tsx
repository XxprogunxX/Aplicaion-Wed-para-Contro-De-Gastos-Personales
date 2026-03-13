'use client';

import { useMemo, useCallback, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Sector,
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
function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function scaledFontSize(
  innerRadiusPx: number,
  ratio: number,
  minSize: number,
  maxSize: number,
  textLength = 0,
  textThreshold = 12
): number {
  const base = innerRadiusPx * ratio;
  const overflowChars = Math.max(0, textLength - textThreshold);
  const adjusted = base - overflowChars * 0.45;
  return clampNumber(Math.round(adjusted), minSize, maxSize);
}

interface DonutChartGastosProps {
  data: DonutChartGastosDato[];
}

function truncateLegendLabel(value: string, max = 14): string {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max)}…`;
}

export function DonutChartGastos({ data }: DonutChartGastosProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const sortedData = useMemo(
    () =>
      [...data]
        .map((item) => ({
          ...item,
          value: Number(item.value) || 0,
        }))
        .sort((a, b) => b.value - a.value),
    [data]
  );

  const total = useMemo(
    () => sortedData.reduce((sum, item) => sum + item.value, 0),
    [sortedData]
  );

  const dataWithColor = useMemo(
    () =>
      sortedData.map((item) => ({
        ...item,
        color: getDonutSegmentColor(item.name, false),
        colorHover: getDonutSegmentColor(item.name, true),
      })),
    [sortedData]
  );

  const [selectedIndex, setSelectedIndex] = useState<number | undefined>(undefined);
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined);
  const activeIndex = hoveredIndex ?? selectedIndex;

  const renderCenterLabel = useCallback(
    (props: {
      cx: number;
      cy: number;
      innerRadius?: number | string;
      index?: number;
    }) => {
      const { cx, cy, index = 0 } = props;
      if (index !== 0) return null;

      const selectedSlice =
        typeof activeIndex === 'number' ? dataWithColor[activeIndex] : undefined;
      const selectedLabel = selectedSlice?.name || 'Todos';
      const selectedValue = Number(selectedSlice?.value ?? total);
      const labelDisplay =
        selectedLabel.length > 16 ? `${selectedLabel.slice(0, 16)}…` : selectedLabel;

      const rawInner = props.innerRadius;
      const innerPx =
        typeof rawInner === 'number' ? rawInner : 80;
      const valueFormatted = formatMxn(selectedValue);
      const fontSizeLabel = scaledFontSize(innerPx, 0.24, 10, 18, selectedLabel.length, 10);
      const fontSizeValue = scaledFontSize(innerPx, 0.36, 13, 30, valueFormatted.length, 11);
      const lineGap = Math.max(4, fontSizeValue * 0.38);

      return (
        <g role="img" aria-label={`${selectedLabel}. ${valueFormatted}`}>
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
            {labelDisplay}
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
            {valueFormatted}
          </text>
        </g>
      );
    },
    [activeIndex, dataWithColor, total]
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
      <div
        className="flex w-full items-center justify-center rounded-theme-lg border border-border bg-background"
        style={{ minHeight: 'clamp(15.5rem, 55vw, 25rem)' }}
      >
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
        style={{
          backgroundColor: theme.colors.background,
          height: 'clamp(15.5rem, 55vw, 25rem)',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
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
                  : (_, index) => setHoveredIndex(index)
              }
              onMouseLeave={
                prefersReducedMotion
                  ? undefined
                  : () => setHoveredIndex(undefined)
              }
              onClick={(_, index) => {
                setSelectedIndex((current) => (current === index ? undefined : index));
              }}
            >
              {dataWithColor.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              cursor={false}
              content={({ active, payload }: {
                active?: boolean;
                payload?: Array<{
                  name?: string;
                  value?: number;
                  payload?: {
                    name?: string;
                    value?: number;
                  };
                }>;
              }) => {
                if (!active || !payload || payload.length === 0) {
                  return null;
                }

                const firstEntry = payload[0];
                const category = String(firstEntry?.payload?.name || firstEntry?.name || 'Categoría');
                const amount = Number(firstEntry?.value ?? firstEntry?.payload?.value ?? 0);
                const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : '0.0';

                return (
                  <div
                    style={{
                      backgroundColor: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: 8,
                      fontFamily: 'var(--font-inter), sans-serif',
                      fontSize: 14,
                      color: theme.colors.text,
                      padding: '8px 10px',
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 600 }}>{category}</p>
                    <p style={{ margin: '2px 0 0 0', fontWeight: 500 }}>{formatMxn(amount)}</p>
                    <p style={{ margin: '2px 0 0 0', color: theme.colors.textSecondary, fontSize: 12 }}>
                      {percentage}% del total
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 px-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-3 sm:gap-y-2">
          {dataWithColor.map((entry, index) => {
            const rawName = String(entry.name || 'Categoría');
            const displayName = truncateLegendLabel(rawName);
            const dotColor = entry.color || getDonutSegmentColor(rawName, false);
            const isActive = activeIndex === index;
            const amount = Number(entry.value || 0);
            const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : '0.0';

            return (
              <button
                key={`legend-${rawName}-${index}`}
                type="button"
                onClick={() => {
                  setSelectedIndex((current) => (current === index ? undefined : index));
                }}
                className={`inline-flex w-full items-center gap-1.5 rounded-theme-sm px-1 py-0.5 text-left transition-colors ${
                  isActive
                    ? 'font-semibold text-text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                aria-label={`Seleccionar categoría ${rawName}`}
                title={rawName}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: dotColor }}
                  aria-hidden="true"
                />
                <span className="font-inter min-w-0 max-w-[8.5rem] truncate text-xs sm:max-w-[10rem] sm:text-ds-secondary">
                  {displayName}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-theme-sm border border-border bg-background px-1.5 py-0.5 font-inter text-[10px] leading-none text-text-secondary sm:text-[11px]">
                  <span>{percentage}%</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline">{formatMxn(amount)}</span>
                </span>
              </button>
            );
          })}
        </div>

        {typeof selectedIndex === 'number' && dataWithColor[selectedIndex] ? (
          <p className="font-inter mt-2 text-center text-xs text-text-secondary">
            Categoría seleccionada:{' '}
            <span className="font-medium text-text-primary">{dataWithColor[selectedIndex].name}</span>
          </p>
        ) : null}
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
