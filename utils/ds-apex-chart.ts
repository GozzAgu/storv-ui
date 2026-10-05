/**
 * ApexCharts needs literal colours, so design-system charts read them from the `--s-*`
 * tokens at runtime and merge them over each chart's own options.
 */
export interface DsChartPalette {
  accent: string
  success: string
  warning: string
  info: string
  muted: string
  grid: string
  surface: string
  font: string
}

export const DS_CHART_PALETTE_FALLBACK: DsChartPalette = {
  accent: '#3d63f2',
  success: '#067647',
  warning: '#b54708',
  info: '#175cd3',
  muted: '#667085',
  grid: '#e4e7ec',
  surface: '#f2f4f7',
  font: "'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', sans-serif",
}

export function readDsChartPalette(fallback: DsChartPalette = DS_CHART_PALETTE_FALLBACK): DsChartPalette {
  if (typeof document === 'undefined') return fallback
  const style = getComputedStyle(document.documentElement)
  const read = (name: string, value: string) => style.getPropertyValue(name).trim() || value
  return {
    accent: read('--s-accent', fallback.accent),
    success: read('--s-success', fallback.success),
    warning: read('--s-warning', fallback.warning),
    info: read('--s-info', fallback.info),
    muted: read('--s-text-muted', fallback.muted),
    grid: read('--s-border', fallback.grid),
    surface: read('--s-surface-2', fallback.surface),
    font: read('--s-font-sans', fallback.font),
  }
}

const GREEN_SERIES = new Set(['#059669', '#34d399'])
const AMBER_SERIES = new Set(['#b45309', '#fbbf24'])

/** `#rrggbb` plus an alpha, for heatmap steps. Other colour formats are returned unchanged. */
export function withAlpha(hex: string, alpha: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return hex
  const value = parseInt(match[1]!, 16)
  return `rgb(${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255} / ${alpha})`
}

function seriesColors(original: unknown, palette: DsChartPalette): string[] {
  const list = Array.isArray(original) ? original.map((c) => String(c).toLowerCase()) : []
  if (list.length > 1) {
    return [palette.accent, palette.info, palette.success, palette.warning, palette.muted]
  }
  const only = list[0] ?? ''
  if (GREEN_SERIES.has(only)) return [palette.success]
  if (AMBER_SERIES.has(only)) return [palette.warning]
  return [palette.accent]
}

function withLabelColor(axis: unknown, color: string): unknown {
  if (!axis || typeof axis !== 'object' || Array.isArray(axis)) return axis
  const record = axis as Record<string, unknown>
  const labels = (record.labels as Record<string, unknown>) ?? {}
  const style = (labels.style as Record<string, unknown>) ?? {}
  return { ...record, labels: { ...labels, style: { ...style, colors: color } } }
}

export function mergeDsApexChartTheme<T extends Record<string, unknown>>(
  options: T,
  palette: DsChartPalette
): T {
  const merged: Record<string, unknown> = { ...options }

  merged.chart = { ...((merged.chart as Record<string, unknown>) ?? {}), fontFamily: palette.font, foreColor: palette.muted }
  merged.colors = seriesColors(merged.colors, palette)
  merged.grid = { ...((merged.grid as Record<string, unknown>) ?? {}), borderColor: palette.grid }
  merged.xaxis = withLabelColor(merged.xaxis, palette.muted)
  merged.yaxis = withLabelColor(merged.yaxis, palette.muted)

  const plotOptions = merged.plotOptions as Record<string, any> | undefined
  const ranges = plotOptions?.heatmap?.colorScale?.ranges
  if (Array.isArray(ranges)) {
    const steps = ranges.length - 1
    merged.plotOptions = {
      ...plotOptions,
      heatmap: {
        ...plotOptions!.heatmap,
        colorScale: {
          ...plotOptions!.heatmap.colorScale,
          ranges: ranges.map((range: Record<string, unknown>, index: number) => ({
            ...range,
            color: index === 0 ? palette.surface : withAlpha(palette.accent, steps > 0 ? index / steps : 1),
          })),
        },
      },
    }
  }

  return merged as T
}
